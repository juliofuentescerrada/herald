using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Herald.Contracts.Competition.V1;
using Shouldly;

namespace Herald.Host.Tests;

// The competition-finalisation spec through the Admin API (h1-finalisation D-1 to D-3).
public partial class MatchTests
{
    private static async Task<JsonElement> ScheduleAsync(League league) => await JsonAsync(await league.Client.GetAsync($"{league.Path}/schedule", Cancellation));

    private static async Task<HttpResponseMessage> FinaliseAsync(League league, int reviewed, int? expected = null) =>
        await league.Client.PostAsJsonAsync(
            $"{league.Path}/finalisation", new { reviewedRevision = reviewed, expectedRevision = expected ?? Revision(await ScheduleAsync(league)) }, Cancellation);

    private static async Task<HttpResponseMessage> ReopenAsync(League league, string? reason) =>
        await league.Client.PostAsJsonAsync($"{league.Path}/reopening", new { reason, expectedRevision = Revision(await ScheduleAsync(league)) }, Cancellation);

    private static int ResultsRevision(JsonElement schedule) => schedule.GetProperty("resultsRevision").GetInt32();

    [Fact]
    [Trait("covers", "competition-finalisation: The tournament list after finalisation")]
    public async Task An_owner_finalises_current_reviewed_standings_once_and_a_retry_returns_the_final_competition()
    {
        var (league, _, tournament) = await WonAsync();
        var schedule = await ScheduleAsync(league);

        var finalised = await SettledAsync(() => FinaliseAsync(league, ResultsRevision(schedule), Revision(schedule)));
        var retried = await SettledAsync(() => FinaliseAsync(league, ResultsRevision(schedule), Revision(schedule)));

        finalised.StatusCode.ShouldBe(HttpStatusCode.OK);
        retried.StatusCode.ShouldBe(HttpStatusCode.OK);
        var final = await JsonAsync(retried);
        final.GetProperty("finalised").GetBoolean().ShouldBeTrue();
        var revision = final.GetProperty("finals").EnumerateArray().ShouldHaveSingleItem();
        (revision.GetProperty("number").GetInt32(), revision.GetProperty("resultsRevision").GetInt32()).ShouldBe((1, 2));
        var sent = api.Sent<CompetitionFinalised>().Where(message => message.TournamentId == tournament).Distinct().ShouldHaveSingleItem();
        (sent.ResultsRevision, sent.FinalRevision).ShouldBe((2, 1));
        var standings = await JsonAsync(await league.Client.GetAsync($"{league.Path}/standings", Cancellation));
        (Revision(standings), standings.GetProperty("final").GetProperty("number").GetInt32(), standings.GetProperty("noChampion").GetBoolean()).ShouldBe((2, 1, false));
        (await JsonAsync(await league.Client.GetAsync(league.Path, Cancellation))).GetProperty("competition").GetString().ShouldBe("finalised");
    }

    [Fact]
    [Trait("covers", "competition-finalisation: A correction after finalisation")]
    public async Task A_correction_or_a_departure_of_a_finalised_competition_is_rejected_until_it_is_reopened()
    {
        var (league, path, _) = await WonAsync();
        (await SettledAsync(async () => await FinaliseAsync(league, ResultsRevision(await ScheduleAsync(league))))).StatusCode.ShouldBe(HttpStatusCode.OK);
        var entrant = (await ScheduleAsync(league)).GetProperty("entrants")[0].GetProperty("entryId").GetGuid();

        var correction = await CorrectAsync(league, path, new { operationId = Guid.NewGuid(), expectedRevision = 2, cause = "played", outcome = "draw", correctionReason = "Score sheet misread" });
        var departure = await league.Client.PostAsJsonAsync(
            $"{league.Path}/entrants/{entrant}/withdrawal", new { operationId = Guid.NewGuid(), expectedRevision = Revision(await ScheduleAsync(league)), reason = "Moved away" }, Cancellation);

        correction.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        Errors(await JsonAsync(correction), "competition").ShouldBe(["finalised"]);
        departure.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        Errors(await JsonAsync(departure), "competition").ShouldBe(["finalised"]);
        (await JsonAsync(await league.Client.GetAsync(path, Cancellation))).GetProperty("result").GetProperty("outcome").GetString().ShouldBe("first");
    }

    [Fact]
    public async Task A_stale_review_is_rejected_with_the_current_results_revision_and_the_competition_stays_running()
    {
        var (league, path, _) = await WonAsync();
        var reviewed = ResultsRevision(await ScheduleAsync(league));
        (await SettledAsync(() => CorrectAsync(league, path, new { operationId = Guid.NewGuid(), expectedRevision = 2, cause = "played", outcome = "draw", correctionReason = "Score sheet misread" })))
            .StatusCode.ShouldBe(HttpStatusCode.OK);

        var stale = await FinaliseAsync(league, reviewed);

        stale.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        var problem = await JsonAsync(stale);
        Errors(problem, "review").ShouldBe(["stale"]);
        ResultsRevision(problem.GetProperty("schedule")).ShouldBe(reviewed + 1);
        (await ScheduleAsync(league)).GetProperty("finalised").GetBoolean().ShouldBeFalse();
    }

    [Fact]
    public async Task An_unresolved_match_is_named_and_a_finalisation_from_an_older_schedule_revision_is_a_conflict()
    {
        var league = await OpenAsync("individual");
        await EnterAsync(league, "Robin Vale");
        await EnterAsync(league, "Sam Reed");
        var schedule = await StartAsync(league);
        var match = schedule.GetProperty("matches")[0].GetProperty("matchId").GetGuid();

        var unresolved = await FinaliseAsync(league, ResultsRevision(schedule));
        var conflict = await FinaliseAsync(league, ResultsRevision(schedule), Revision(schedule) - 1);

        unresolved.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        Errors(await JsonAsync(unresolved), $"match-{match}").ShouldBe(["unresolved"]);
        conflict.StatusCode.ShouldBe(HttpStatusCode.Conflict);
    }

    [Fact]
    [Trait("covers", "competition-finalisation: No reason")]
    public async Task An_owner_reopens_with_a_reason_corrects_and_finalises_again_keeping_the_earlier_final_revision()
    {
        var (league, path, tournament) = await WonAsync();
        (await SettledAsync(async () => await FinaliseAsync(league, ResultsRevision(await ScheduleAsync(league))))).StatusCode.ShouldBe(HttpStatusCode.OK);

        var unreasoned = await ReopenAsync(league, " ");
        var reopened = await SettledAsync(() => ReopenAsync(league, "Result appeal upheld"));
        (await SettledAsync(() => CorrectAsync(league, path, new { operationId = Guid.NewGuid(), expectedRevision = 2, cause = "played", outcome = "draw", correctionReason = "Appeal upheld" })))
            .StatusCode.ShouldBe(HttpStatusCode.OK);
        var again = await SettledAsync(async () => await FinaliseAsync(league, ResultsRevision(await ScheduleAsync(league))));

        unreasoned.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        Errors(await JsonAsync(unreasoned), "reason").ShouldBe(["required"]);
        reopened.StatusCode.ShouldBe(HttpStatusCode.OK);
        (await JsonAsync(reopened)).GetProperty("finalised").GetBoolean().ShouldBeFalse();
        var finals = (await JsonAsync(again)).GetProperty("finals").EnumerateArray().ToList();
        finals.Select(final => (final.GetProperty("number").GetInt32(), final.GetProperty("resultsRevision").GetInt32())).ShouldBe([(2, 3), (1, 2)]);
        finals[1].GetProperty("reopenReason").GetString().ShouldBe("Result appeal upheld");
        api.Sent<CompetitionReopened>().Where(message => message.TournamentId == tournament).Distinct().ShouldHaveSingleItem().FinalRevision.ShouldBe(1);
        var standings = await JsonAsync(await league.Client.GetAsync($"{league.Path}/standings", Cancellation));
        standings.GetProperty("final").GetProperty("number").GetInt32().ShouldBe(2);
        standings.GetProperty("finals").EnumerateArray().Select(final => final.GetProperty("reopened").GetBoolean()).ShouldBe([false, true]);
        (await JsonAsync(await league.Client.GetAsync(league.Path, Cancellation))).GetProperty("competition").GetString().ShouldBe("finalised");
    }

    [Fact]
    public async Task Another_organisation_cannot_finalise_or_reopen_a_competition()
    {
        var (league, _, _) = await WonAsync();
        var other = api.As(Guid.NewGuid());

        (await other.PostAsJsonAsync($"{league.Path}/finalisation", new { reviewedRevision = 2, expectedRevision = 1 }, Cancellation)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await other.PostAsJsonAsync($"{league.Path}/reopening", new { reason = "Appeal", expectedRevision = 1 }, Cancellation)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }
}
