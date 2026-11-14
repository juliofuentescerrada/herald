using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Herald.Contracts.Tournaments.V1;
using Shouldly;

namespace Herald.Host.Tests;

// The round-robin-pairings spec through the Admin API: Registration reports the eligible field to Competition
// as it does in production, from terms delivered as Tournaments publishes them.
[Collection(OrganisationApiTests.Name)]
public class ScheduleTests(OrganisationApi api)
{
    private static CancellationToken Cancellation => TestContext.Current.CancellationToken;

    private sealed record Owner(HttpClient Client, Guid Organisation)
    {
        public string Path => $"/api/organisations/{Organisation}";
    }

    private sealed record League(Owner Owner, Guid Tournament)
    {
        public string Schedule => $"{Owner.Path}/tournaments/{Tournament}/schedule";
    }

    private static async Task<JsonElement> JsonAsync(HttpResponseMessage response) =>
        await response.Content.ReadFromJsonAsync<JsonElement>(Cancellation);

    private static string[] Errors(JsonElement problem, string field) =>
        [.. problem.GetProperty("errors").GetProperty(field).EnumerateArray().Select(value => value.GetString()!)];

    private async Task<Owner> OwnerAsync()
    {
        var owner = new Owner(api.As(Guid.NewGuid()), Guid.NewGuid());
        (await owner.Client.CreateAsync(owner.Organisation, "Northside Gaming")).StatusCode.ShouldBe(HttpStatusCode.Created);
        return owner;
    }

    private Task TermsAsync(League league, int revision, RegistrationState registration, CheckInPolicy checkIn = CheckInPolicy.Optional, bool locked = false) =>
        api.PublishAndWaitAsync(new TournamentEntryTermsChanged(
            league.Owner.Organisation, league.Tournament, revision, registration, 8, EntryKind.Individual, Admission.Automatic, CheckIn: checkIn, FieldLocked: locked));

    private async Task<JsonElement> EnterAsync(League league, string name)
    {
        var owner = league.Owner;
        var guest = Guid.NewGuid();
        (await owner.Client.PutAsJsonAsync($"{owner.Path}/guests/{guest}", new { kind = "player", name, confirmNew = true }, Cancellation))
            .StatusCode.ShouldBe(HttpStatusCode.OK);
        var response = await api.SettledAsync(() =>
            owner.Client.PutAsJsonAsync($"{owner.Path}/tournaments/{league.Tournament}/entries/{Guid.NewGuid()}", new { guestId = guest }, Cancellation));
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        return (await JsonAsync(response)).GetProperty("entries").EnumerateArray().Single(entry => entry.GetProperty("guestName").GetString() == name);
    }

    // A published league with its players entered and registration closed.
    private async Task<League> LeagueAsync(params string[] players)
    {
        var league = new League(await OwnerAsync(), Guid.NewGuid());
        await TermsAsync(league, 3, RegistrationState.Open);
        foreach (var player in players)
        {
            await EnterAsync(league, player);
        }

        await TermsAsync(league, 4, RegistrationState.Closed);
        return league;
    }

    private static async Task<JsonElement> ScheduleAsync(League league)
    {
        var response = await league.Owner.Client.GetAsync(league.Schedule, Cancellation);
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        return await JsonAsync(response);
    }

    private static int Revision(JsonElement schedule) => schedule.GetProperty("revision").GetInt32();

    private Task<HttpResponseMessage> GenerateAsync(League league, JsonElement schedule, string seeding = "admissionOrder", Guid? operation = null) =>
        api.SettledAsync(() => league.Owner.Client.PostAsJsonAsync(
            $"{league.Schedule}/draft", new { operationId = operation ?? Guid.NewGuid(), expectedRevision = Revision(schedule), seeding }, Cancellation));

    private Task<HttpResponseMessage> PublishAsync(League league, int revision) =>
        api.SettledAsync(() => league.Owner.Client.PostAsJsonAsync($"{league.Schedule}/publication", new { expectedRevision = revision }, Cancellation));

    private Task<HttpResponseMessage> WithdrawAsync(League league, int revision, string? reason) =>
        api.SettledAsync(() => league.Owner.Client.PostAsJsonAsync($"{league.Schedule}/withdrawal", new { expectedRevision = revision, reason }, Cancellation));

    private static int Count(JsonElement pairings, string property) => pairings.GetProperty(property).GetInt32();

    [Fact]
    [Trait("covers", "round-robin-pairings: Four individual entrants")]
    public async Task Four_players_give_three_rounds_and_six_matches()
    {
        var league = await LeagueAsync("Robin Vale", "Sam Reed", "Jamie Brook", "Taylor Finch");

        var response = await GenerateAsync(league, await ScheduleAsync(league));

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var pairings = (await JsonAsync(response)).GetProperty("draft").GetProperty("pairings");
        Count(pairings, "matches").ShouldBe(6);
        pairings.GetProperty("rounds").GetArrayLength().ShouldBe(3);
        pairings.GetProperty("rounds")[0].GetProperty("matches")[0].GetProperty("first").GetProperty("name").GetString().ShouldBe("Robin Vale");
    }

    [Fact]
    [Trait("covers", "round-robin-pairings: Five entrants rest once each")]
    public async Task Five_players_give_ten_matches_and_a_rest_in_each_round()
    {
        var league = await LeagueAsync("Robin Vale", "Sam Reed", "Jamie Brook", "Taylor Finch", "Rowan Lake");

        var pairings = (await JsonAsync(await GenerateAsync(league, await ScheduleAsync(league), "draw"))).GetProperty("draft").GetProperty("pairings");

        Count(pairings, "matches").ShouldBe(10);
        pairings.GetProperty("seed").ValueKind.ShouldBe(JsonValueKind.Number);
        pairings.GetProperty("rounds").EnumerateArray().Select(round => round.GetProperty("rest").GetProperty("name").GetString()).Order()
            .ShouldBe(["Jamie Brook", "Robin Vale", "Rowan Lake", "Sam Reed", "Taylor Finch"]);
    }

    [Fact]
    [Trait("covers", "round-robin-pairings: Registration is still open")]
    public async Task Generating_while_registration_is_open_is_rejected()
    {
        var league = new League(await OwnerAsync(), Guid.NewGuid());
        await TermsAsync(league, 3, RegistrationState.Open);
        await EnterAsync(league, "Robin Vale");
        await EnterAsync(league, "Sam Reed");
        var schedule = await ScheduleAsync(league);
        schedule.GetProperty("blockers").EnumerateArray().Select(blocker => blocker.GetString()).ShouldBe(["registration-not-closed"]);

        var response = await GenerateAsync(league, schedule);

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        Errors(await JsonAsync(response), "registration").ShouldBe(["not-closed"]);
    }

    [Fact]
    [Trait("covers", "round-robin-pairings: Entries are pending")]
    public async Task Pending_entries_block_generating_and_are_named()
    {
        var league = new League(await OwnerAsync(), Guid.NewGuid());
        await TermsAsync(league, 3, RegistrationState.Open, CheckInPolicy.Mandatory);
        await EnterAsync(league, "Sam Reed");
        await EnterAsync(league, "Rowan Lake");
        await TermsAsync(league, 4, RegistrationState.Closed, CheckInPolicy.Mandatory);
        var schedule = await ScheduleAsync(league);

        var response = await GenerateAsync(league, schedule);

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        var problem = await JsonAsync(response);
        Errors(problem, "entries").ShouldBe(["pending"]);
        problem.GetProperty("schedule").GetProperty("pending").EnumerateArray().Select(entry => entry.GetProperty("name").GetString()).ShouldBe(["Sam Reed", "Rowan Lake"]);
    }

    [Fact]
    [Trait("covers", "round-robin-pairings: An absence makes the draft stale")]
    public async Task An_absence_after_generating_makes_the_draft_stale()
    {
        var league = new League(await OwnerAsync(), Guid.NewGuid());
        await TermsAsync(league, 3, RegistrationState.Open, CheckInPolicy.Mandatory);
        var robin = await EnterAsync(league, "Robin Vale");
        var sam = await EnterAsync(league, "Sam Reed");
        var jamie = await EnterAsync(league, "Jamie Brook");
        await TermsAsync(league, 4, RegistrationState.Closed, CheckInPolicy.Mandatory);
        foreach (var entry in new[] { robin, sam, jamie })
        {
            await api.SettledAsync(() => league.Owner.Client.PutAsJsonAsync(
                $"{league.Owner.Path}/tournaments/{league.Tournament}/entries/{entry.GetProperty("id").GetGuid()}/check-in", new { expectedRevision = 0 }, Cancellation));
        }

        await GenerateAsync(league, await ScheduleAsync(league));
        await api.SettledAsync(() => league.Owner.Client.DeleteAsync(
            $"{league.Owner.Path}/tournaments/{league.Tournament}/entries/{sam.GetProperty("id").GetGuid()}/check-in?expectedRevision=1", Cancellation));
        var schedule = await ScheduleAsync(league);

        schedule.GetProperty("draft").GetProperty("stale").GetBoolean().ShouldBeTrue();
        schedule.GetProperty("draftChange").GetProperty("removed")[0].GetProperty("name").GetString().ShouldBe("Sam Reed");
        var response = await PublishAsync(league, Revision(schedule));
        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        Errors(await JsonAsync(response), "draft").ShouldBe(["stale"]);
    }

    [Fact]
    [Trait("covers", "round-robin-pairings: Publishing twice")]
    public async Task A_repeated_publication_returns_the_same_revision()
    {
        var league = await LeagueAsync("Robin Vale", "Sam Reed", "Jamie Brook", "Taylor Finch");
        var draft = await JsonAsync(await GenerateAsync(league, await ScheduleAsync(league)));

        var published = await PublishAsync(league, Revision(draft));
        var repeated = await PublishAsync(league, Revision(draft));

        published.StatusCode.ShouldBe(HttpStatusCode.OK);
        (await JsonAsync(published)).GetProperty("current").GetProperty("number").GetInt32().ShouldBe(1);
        repeated.StatusCode.ShouldBe(HttpStatusCode.OK);
        (await JsonAsync(repeated)).GetProperty("history").GetArrayLength().ShouldBe(1);
    }

    [Fact]
    [Trait("covers", "round-robin-pairings: Withdraw and republish")]
    public async Task Withdrawing_with_a_reason_regenerating_after_an_absence_and_republishing_keeps_the_history()
    {
        var league = await LeagueAsync("Robin Vale", "Sam Reed", "Jamie Brook", "Taylor Finch");
        var published = await JsonAsync(await PublishAsync(league, Revision(await JsonAsync(await GenerateAsync(league, await ScheduleAsync(league))))));

        var withdrawn = await WithdrawAsync(league, Revision(published), "Late absence");
        var sam = (await JsonAsync(await league.Owner.Client.GetAsync($"{league.Owner.Path}/tournaments/{league.Tournament}/entries", Cancellation)))
            .GetProperty("entries").EnumerateArray().Single(entry => entry.GetProperty("guestName").GetString() == "Sam Reed");
        await api.SettledAsync(() => league.Owner.Client.PostAsJsonAsync(
            $"{league.Owner.Path}/tournaments/{league.Tournament}/entries/{sam.GetProperty("id").GetGuid()}/cancellation", new { expectedRevision = 1 }, Cancellation));
        var regenerated = await JsonAsync(await GenerateAsync(league, await ScheduleAsync(league)));
        var republished = await JsonAsync(await PublishAsync(league, Revision(regenerated)));

        withdrawn.StatusCode.ShouldBe(HttpStatusCode.OK);
        regenerated.GetProperty("draft").GetProperty("pairings").GetProperty("entrants").GetInt32().ShouldBe(3);
        republished.GetProperty("current").GetProperty("number").GetInt32().ShouldBe(2);
        var first = republished.GetProperty("history")[1];
        first.GetProperty("number").GetInt32().ShouldBe(1);
        first.GetProperty("withdrawalReason").GetString().ShouldBe("Late absence");
    }

    [Fact]
    [Trait("covers", "round-robin-pairings: A reason is required")]
    public async Task Withdrawing_without_a_reason_is_rejected()
    {
        var league = await LeagueAsync("Robin Vale", "Sam Reed");
        var published = await JsonAsync(await PublishAsync(league, Revision(await JsonAsync(await GenerateAsync(league, await ScheduleAsync(league))))));

        var response = await WithdrawAsync(league, Revision(published), null);

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        Errors(await JsonAsync(response), "reason").ShouldBe(["required"]);
    }

    [Fact]
    [Trait("covers", "round-robin-pairings: Another tab published first")]
    public async Task A_write_based_on_an_older_revision_is_a_conflict()
    {
        var league = await LeagueAsync("Robin Vale", "Sam Reed");
        var draft = await JsonAsync(await GenerateAsync(league, await ScheduleAsync(league)));
        await PublishAsync(league, Revision(draft));

        var response = await WithdrawAsync(league, Revision(draft), "Late absence");

        response.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        (await JsonAsync(response)).GetProperty("schedule").GetProperty("current").GetProperty("number").GetInt32().ShouldBe(1);
    }

    [Fact]
    [Trait("covers", "round-robin-pairings: A cancellation crossed the publication")]
    public async Task A_field_change_that_crossed_the_publication_is_reported()
    {
        var league = await LeagueAsync("Robin Vale", "Sam Reed", "Jamie Brook");
        await PublishAsync(league, Revision(await JsonAsync(await GenerateAsync(league, await ScheduleAsync(league)))));
        var sam = (await JsonAsync(await league.Owner.Client.GetAsync($"{league.Owner.Path}/tournaments/{league.Tournament}/entries", Cancellation)))
            .GetProperty("entries").EnumerateArray().Single(entry => entry.GetProperty("guestName").GetString() == "Sam Reed");
        // The lock has not reached Registration yet: older terms, without it, are still the ones it applies.
        await api.ExecuteAsync("""update registration."Fields" set "Terms_FieldLocked" = false where "Id" = $1""", league.Tournament);
        (await api.SettledAsync(() => league.Owner.Client.PostAsJsonAsync(
            $"{league.Owner.Path}/tournaments/{league.Tournament}/entries/{sam.GetProperty("id").GetGuid()}/cancellation", new { expectedRevision = 1 }, Cancellation)))
            .StatusCode.ShouldBe(HttpStatusCode.OK);

        var schedule = await ScheduleAsync(league);

        schedule.GetProperty("crossedChange").GetProperty("removed")[0].GetProperty("name").GetString().ShouldBe("Sam Reed");
        schedule.GetProperty("current").GetProperty("pairings").GetProperty("matches").GetInt32().ShouldBe(3);
    }

    [Fact]
    public async Task Tournaments_keeps_the_published_schedule()
    {
        var league = await LeagueAsync("Robin Vale", "Sam Reed");
        await PublishAsync(league, Revision(await JsonAsync(await GenerateAsync(league, await ScheduleAsync(league)))));

        // The league's terms were delivered by hand, so Tournaments has no tournament here: its projection is what counts.
        (await api.CountAsync("""select count(*) from tournaments."Schedules" where "TournamentId" = $1 and "PublishedRevision" = 1""", league.Tournament)).ShouldBe(1);
    }

    [Fact]
    public async Task Another_organisation_sees_no_schedule()
    {
        var league = await LeagueAsync("Robin Vale", "Sam Reed");
        var other = await OwnerAsync();

        var response = await other.Client.GetAsync($"{other.Path}/tournaments/{league.Tournament}/schedule", Cancellation);

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }
}
