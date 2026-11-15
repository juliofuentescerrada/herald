using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Shouldly;

namespace Herald.Host.Tests;

// The competition-start spec through the Admin API: Tournaments decides from its projections, Registration and
// Competition follow through the outbox (h1-competition-start D-2, D-3).
[Collection(OrganisationApiTests.Name)]
public class CompetitionStartTests(OrganisationApi api)
{
    private sealed record League(HttpClient Client, string Organisation, string Path);

    private static CancellationToken Cancellation => TestContext.Current.CancellationToken;

    private static object Configuration(string entryKind) => new
    {
        title = "Friday League",
        gameVariant = "Example strategy · Standard variant",
        entryKind,
        capacity = 8,
        minimumRosterSize = entryKind == "team" ? 3 : (int?)null,
        maximumRosterSize = entryKind == "team" ? 5 : (int?)null,
        activePlayersPerSide = entryKind == "team" ? 2 : (int?)null,
        registrationOpensAt = "2026-11-10T09:00:00",
        registrationClosesAt = "2026-11-13T18:00:00",
        plannedStartAt = "2026-11-14T10:00:00",
        timeZone = "Europe/Madrid",
        location = "onSite",
        venue = "Madrid",
        admission = "automatic",
        checkIn = "optional",
        visibility = "public",
    };

    private static async Task<JsonElement> JsonAsync(HttpResponseMessage response) =>
        await response.Content.ReadFromJsonAsync<JsonElement>(Cancellation);

    private static string[] Errors(JsonElement problem, string field) =>
        [.. problem.GetProperty("errors").GetProperty(field).EnumerateArray().Select(value => value.GetString()!)];

    private static int Revision(JsonElement element) => element.GetProperty("revision").GetInt32();

    private static string[] Unmet(JsonElement tournament) =>
        [.. tournament.GetProperty("start").GetProperty("conditions").EnumerateArray()
            .Where(condition => !condition.GetProperty("met").GetBoolean()).Select(condition => condition.GetProperty("rule").GetString()!)];

    private Task<HttpResponseMessage> SettledAsync(Func<Task<HttpResponseMessage>> request) => api.SettledAsync(request);

    private async Task<League> OpenAsync(string entryKind = "individual", HttpClient? client = null)
    {
        client ??= api.As(Guid.NewGuid());
        var organisation = Guid.NewGuid();
        (await client.CreateAsync(organisation, "Northside Gaming")).StatusCode.ShouldBe(HttpStatusCode.Created);
        var id = Guid.NewGuid();
        var league = new League(client, $"/api/organisations/{organisation}", $"/api/organisations/{organisation}/tournaments/{id}");
        (await client.PostAsJsonAsync($"{league.Organisation}/tournaments", new { tournamentId = id, configuration = Configuration(entryKind) }, Cancellation)).StatusCode.ShouldBe(HttpStatusCode.Created);
        await SettledAsync(() => client.PostAsJsonAsync($"{league.Path}/publication", new { expectedRevision = 1 }, Cancellation));
        await SettledAsync(() => client.PostAsJsonAsync($"{league.Path}/registration/opening", new { expectedRevision = 2 }, Cancellation));
        return league;
    }

    private static async Task<Guid> GuestAsync(League league, string name, string kind)
    {
        var guest = Guid.NewGuid();
        (await league.Client.PutAsJsonAsync($"{league.Organisation}/guests/{guest}", new { kind, name, confirmNew = true }, Cancellation)).StatusCode.ShouldBe(HttpStatusCode.OK);
        return guest;
    }

    // Enters a guest and returns its entry identifier.
    private async Task<Guid> EnterAsync(League league, string name, string kind = "player")
    {
        var guest = await GuestAsync(league, name, kind);
        var entry = Guid.NewGuid();
        (await SettledAsync(() => league.Client.PutAsJsonAsync($"{league.Path}/entries/{entry}", new { guestId = guest }, Cancellation))).StatusCode.ShouldBe(HttpStatusCode.OK);
        return entry;
    }

    private async Task<HttpResponseMessage> AddMemberAsync(League league, Guid team, string name)
    {
        var guest = await GuestAsync(league, name, "player");
        var roster = await JsonAsync(await league.Client.GetAsync($"{league.Path}/entries/{team}/roster", Cancellation));
        return await SettledAsync(() => league.Client.PutAsJsonAsync($"{league.Path}/entries/{team}/roster/members/{guest}", new { expectedRevision = Revision(roster) }, Cancellation));
    }

    private static async Task<JsonElement> TournamentAsync(League league) => await JsonAsync(await league.Client.GetAsync(league.Path, Cancellation));

    private async Task CloseAndPublishAsync(League league)
    {
        await SettledAsync(() => league.Client.PostAsJsonAsync($"{league.Path}/registration/closure", new { expectedRevision = 3 }, Cancellation));
        var schedule = await JsonAsync(await league.Client.GetAsync($"{league.Path}/schedule", Cancellation));
        var draft = await JsonAsync(await SettledAsync(() => league.Client.PostAsJsonAsync(
            $"{league.Path}/schedule/draft", new { operationId = Guid.NewGuid(), expectedRevision = Revision(schedule), seeding = "admissionOrder" }, Cancellation)));
        (await SettledAsync(() => league.Client.PostAsJsonAsync($"{league.Path}/schedule/publication", new { expectedRevision = Revision(draft) }, Cancellation))).StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    private async Task<HttpResponseMessage> StartAsync(League league, int? expectedRevision = null) =>
        await SettledAsync(async () => await league.Client.PostAsJsonAsync(
            $"{league.Path}/competition/start", new { expectedRevision = expectedRevision ?? Revision(await TournamentAsync(league)) }, Cancellation));

    [Fact]
    [Trait("covers", "competition-start: Start with four eligible players")]
    [Trait("covers", "competition-start: Cancelling after start")]
    [Trait("covers", "round-robin-pairings: Withdrawing after start")]
    public async Task An_owner_starts_a_ready_league_and_the_field_and_schedule_are_fixed()
    {
        var league = await OpenAsync();
        var entries = new List<Guid>();
        foreach (var name in new[] { "Robin Vale", "Sam Reed", "Jamie Brook", "Taylor Finch" })
        {
            entries.Add(await EnterAsync(league, name));
        }

        await CloseAndPublishAsync(league);
        Unmet(await TournamentAsync(league)).ShouldBeEmpty();

        var started = await StartAsync(league);
        var repeated = await StartAsync(league, expectedRevision: 4);
        var cancelled = await SettledAsync(() => league.Client.PostAsJsonAsync($"{league.Path}/entries/{entries[0]}/cancellation", new { expectedRevision = 1 }, Cancellation));
        var schedule = await JsonAsync(await league.Client.GetAsync($"{league.Path}/schedule", Cancellation));
        var withdrawn = await league.Client.PostAsJsonAsync($"{league.Path}/schedule/withdrawal", new { expectedRevision = Revision(schedule), reason = "Late absence" }, Cancellation);

        started.StatusCode.ShouldBe(HttpStatusCode.OK);
        var details = await JsonAsync(started);
        details.GetProperty("competition").GetString().ShouldBe("running");
        details.GetProperty("start").GetProperty("startedOnScheduleRevision").GetInt32().ShouldBe(1);
        details.GetProperty("start").GetProperty("startedAt").ValueKind.ShouldBe(JsonValueKind.String);
        repeated.StatusCode.ShouldBe(HttpStatusCode.OK);
        Revision(await JsonAsync(repeated)).ShouldBe(Revision(details));
        Errors(await JsonAsync(cancelled), "field").ShouldBe(["competition-started"]);
        schedule.GetProperty("startedOnRevision").GetInt32().ShouldBe(1);
        Errors(await JsonAsync(withdrawn), "schedule").ShouldBe(["competition-started"]);
        (await JsonAsync(await league.Client.GetAsync($"{league.Organisation}/tournaments", Cancellation)))[0].GetProperty("competition").GetString().ShouldBe("running");
    }

    [Fact]
    public async Task A_league_with_open_registration_and_no_schedule_reports_and_rejects_each_unmet_condition()
    {
        var league = await OpenAsync();
        await EnterAsync(league, "Robin Vale");

        var tournament = await TournamentAsync(league);
        var start = await StartAsync(league);

        Unmet(tournament).ShouldBe(["registration-closed", "two-eligible", "schedule-current"]);
        start.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        Errors(await JsonAsync(start), "competition").ShouldBe(["registration-closed", "two-eligible", "schedule-current"]);
        (await TournamentAsync(league)).GetProperty("competition").GetString().ShouldBe("preparation");
    }

    [Fact]
    public async Task A_start_from_an_older_revision_is_a_conflict_with_the_current_tournament()
    {
        var league = await OpenAsync();

        var start = await StartAsync(league, expectedRevision: 1);

        start.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        Revision((await JsonAsync(start)).GetProperty("tournament")).ShouldBe(3);
    }

    [Fact]
    public async Task Another_organisations_tournament_cannot_be_started()
    {
        var league = await OpenAsync();
        var other = api.As(Guid.NewGuid());

        (await other.PostAsJsonAsync($"{league.Path}/competition/start", new { expectedRevision = 3 }, Cancellation)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    [Trait("covers", "competition-start: A roster below the minimum")]
    [Trait("covers", "competition-start: A same-name warning")]
    [Trait("covers", "team-rosters: Adding after start")]
    public async Task A_short_roster_blocks_the_start_until_completed_and_the_roster_then_freezes()
    {
        var league = await OpenAsync("team");
        var falcons = await EnterAsync(league, "River Falcons", "team");
        var lights = await EnterAsync(league, "Harbour Lights", "team");
        foreach (var name in new[] { "Alex Kim", "Robin Vale", "Sam Reed" })
        {
            (await AddMemberAsync(league, falcons, name)).StatusCode.ShouldBe(HttpStatusCode.OK);
        }

        (await AddMemberAsync(league, lights, "alex  kim")).StatusCode.ShouldBe(HttpStatusCode.OK);
        (await AddMemberAsync(league, lights, "Jamie Brook")).StatusCode.ShouldBe(HttpStatusCode.OK);
        await CloseAndPublishAsync(league);

        var blocked = (await TournamentAsync(league)).GetProperty("start");
        (await AddMemberAsync(league, lights, "Taylor Finch")).StatusCode.ShouldBe(HttpStatusCode.OK);
        var ready = await TournamentAsync(league);
        var started = await StartAsync(league);
        var frozen = await AddMemberAsync(league, lights, "Casey Wood");
        var roster = await JsonAsync(await league.Client.GetAsync($"{league.Path}/entries/{lights}/roster", Cancellation));

        blocked.GetProperty("rostersOutsideBounds").EnumerateArray().Select(team => (team.GetProperty("teamName").GetString(), team.GetProperty("members").GetInt32()))
            .ShouldBe([("Harbour Lights", 2)]);
        Unmet(ready).ShouldBeEmpty();
        var shared = ready.GetProperty("start").GetProperty("sharedMemberNames")[0];
        shared.GetProperty("teamNames").EnumerateArray().Select(team => team.GetString()).Order().ShouldBe(["Harbour Lights", "River Falcons"]);
        started.StatusCode.ShouldBe(HttpStatusCode.OK);
        Errors(await JsonAsync(frozen), "roster").ShouldBe(["frozen"]);
        roster.GetProperty("frozenRevision").GetInt32().ShouldBe(3);
        roster.GetProperty("members").GetArrayLength().ShouldBe(3);
    }
}
