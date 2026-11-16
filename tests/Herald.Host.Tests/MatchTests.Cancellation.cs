using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Herald.Contracts.Tournaments.V1;
using Shouldly;

namespace Herald.Host.Tests;

// The tournament's cancellation as Registration and Competition apply it (h1-tournament-cancel-and-dates D-1, D-3).
public partial class MatchTests
{
    private async Task<HttpResponseMessage> CancelTournamentAsync(League league, string reason = "Venue unavailable") =>
        await SettledAsync(async () => await league.Client.PostAsJsonAsync(
            $"{league.Path}/cancellation", new { reason, expectedRevision = Revision(await JsonAsync(await league.Client.GetAsync(league.Path, Cancellation))) }, Cancellation));

    private static async Task<JsonElement> FieldAsync(League league) => await JsonAsync(await league.Client.GetAsync($"{league.Path}/entries", Cancellation));

    [Fact]
    public async Task A_cancellation_before_start_cancels_every_entry_and_rejects_a_late_entry()
    {
        var league = await OpenAsync("individual");
        await EnterAsync(league, "Robin Vale");
        await EnterAsync(league, "Sam Reed");
        var tournament = Guid.Parse(league.Path.Split('/')[^1]);

        (await CancelTournamentAsync(league)).StatusCode.ShouldBe(HttpStatusCode.OK);
        var guest = await GuestAsync(league, "Alex Kim", "player");
        var late = await league.Client.PutAsJsonAsync($"{league.Path}/entries/{Guid.NewGuid()}", new { guestId = guest }, Cancellation);

        api.Sent<TournamentCancelled>().Where(message => message.TournamentId == tournament).Distinct().ShouldHaveSingleItem().AfterStart.ShouldBeFalse();
        var entries = (await FieldAsync(league)).GetProperty("entries").EnumerateArray().ToList();
        entries.Count.ShouldBe(2);
        entries.ShouldAllBe(entry => entry.GetProperty("state").GetString() == "cancelled" && entry.GetProperty("cancellationCause").GetString() == "tournamentCancelled");
        late.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        Errors(await JsonAsync(late), "tournament").ShouldBe(["cancelled"]);
    }

    [Fact]
    [Trait("covers", "tournament-lifecycle: A late result")]
    public async Task A_cancellation_after_start_voids_the_unresolved_matches_and_a_late_result_is_rejected()
    {
        var league = await OpenAsync("individual");
        await EnterAsync(league, "Robin Vale");
        await EnterAsync(league, "Sam Reed");
        await EnterAsync(league, "Jamie Brook");
        var paths = (await StartAsync(league)).GetProperty("matches").EnumerateArray().Select(match => MatchPath(league, match)).ToList();
        var (path, open) = (paths[0], paths[1]);
        (await SettledAsync(() => ResultAsync(league, path, "first", 1))).StatusCode.ShouldBe(HttpStatusCode.OK);
        var tournament = Guid.Parse(league.Path.Split('/')[^1]);

        (await CancelTournamentAsync(league, "Venue flooded")).StatusCode.ShouldBe(HttpStatusCode.OK);
        var late = await ResultAsync(league, open, "first", 1);

        api.Sent<TournamentCancelled>().Where(message => message.TournamentId == tournament).Distinct().ShouldHaveSingleItem().AfterStart.ShouldBeTrue();
        late.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        Errors(await JsonAsync(late), "tournament").ShouldBe(["cancelled"]);
        var after = await ScheduleAsync(league);
        after.GetProperty("cancelled").GetBoolean().ShouldBeTrue();
        (await JsonAsync(await league.Client.GetAsync(path, Cancellation))).GetProperty("result").GetProperty("cause").GetString().ShouldBe("played");
        var voided = (await JsonAsync(await league.Client.GetAsync(open, Cancellation))).GetProperty("result");
        (voided.GetProperty("cause").GetString(), voided.GetProperty("outcome").GetString()).ShouldBe(("voidedCancelled", "none"));
    }

    [Fact]
    public async Task A_cancellation_before_start_withdraws_the_published_schedule_with_its_reason()
    {
        var league = await OpenAsync("individual");
        await EnterAsync(league, "Robin Vale");
        await EnterAsync(league, "Sam Reed");
        await SettledAsync(() => league.Client.PostAsJsonAsync($"{league.Path}/registration/closure", new { expectedRevision = 3 }, Cancellation));
        var drafting = Revision(await ScheduleAsync(league));
        var draft = await JsonAsync(await SettledAsync(() => league.Client.PostAsJsonAsync(
            $"{league.Path}/schedule/draft", new { operationId = Guid.NewGuid(), seeding = "admissionOrder", expectedRevision = drafting }, Cancellation)));
        (await SettledAsync(() => league.Client.PostAsJsonAsync($"{league.Path}/schedule/publication", new { expectedRevision = Revision(draft) }, Cancellation)))
            .StatusCode.ShouldBe(HttpStatusCode.OK);

        (await CancelTournamentAsync(league)).StatusCode.ShouldBe(HttpStatusCode.OK);

        var schedule = await ScheduleAsync(league);
        schedule.GetProperty("current").ValueKind.ShouldBe(JsonValueKind.Null);
        schedule.GetProperty("history").EnumerateArray().ShouldHaveSingleItem().GetProperty("withdrawalReason").GetString().ShouldBe("Tournament cancelled");
    }

    [Fact]
    [Trait("covers", "tournament-lifecycle: Show archived")]
    public async Task An_archived_finalised_tournament_is_listed_only_with_show_archived_and_reopened_only_after_unarchiving()
    {
        var (league, _, _) = await WonAsync();
        (await SettledAsync(async () => await FinaliseAsync(league, ResultsRevision(await ScheduleAsync(league))))).StatusCode.ShouldBe(HttpStatusCode.OK);
        var tournament = await JsonAsync(await league.Client.GetAsync(league.Path, Cancellation));

        (await SettledAsync(() => league.Client.PostAsJsonAsync($"{league.Path}/archiving", new { expectedRevision = Revision(tournament) }, Cancellation)))
            .StatusCode.ShouldBe(HttpStatusCode.OK);
        var listed = await JsonAsync(await league.Client.GetAsync($"{league.Organisation}/tournaments", Cancellation));
        var shown = await JsonAsync(await league.Client.GetAsync($"{league.Organisation}/tournaments?archived=true", Cancellation));
        var refused = await ReopenAsync(league, "Appeal upheld");

        listed.GetArrayLength().ShouldBe(0);
        shown.EnumerateArray().ShouldHaveSingleItem().GetProperty("competition").GetString().ShouldBe("finalised");
        refused.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        Errors(await JsonAsync(refused), "competition").ShouldBe(["archived"]);
        (await SettledAsync(() => league.Client.PostAsJsonAsync($"{league.Path}/unarchiving", new { expectedRevision = Revision(tournament) + 1 }, Cancellation)))
            .StatusCode.ShouldBe(HttpStatusCode.OK);
        (await SettledAsync(() => ReopenAsync(league, "Appeal upheld"))).StatusCode.ShouldBe(HttpStatusCode.OK);
    }
}
