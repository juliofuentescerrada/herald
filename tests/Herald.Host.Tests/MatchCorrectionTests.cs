using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Herald.Contracts.Competition.V1;
using Shouldly;

namespace Herald.Host.Tests;

// The result-corrections spec through the Admin API (h1-safe-corrections D-1, D-2).
public partial class MatchTests
{
    private static async Task<HttpResponseMessage> CorrectAsync(League league, string match, object body) =>
        await league.Client.PostAsJsonAsync($"{match}/result/correction", body, Cancellation);

    private async Task<(League League, string Path, Guid Tournament)> WonAsync()
    {
        var league = await OpenAsync("individual");
        await EnterAsync(league, "Robin Vale");
        await EnterAsync(league, "Sam Reed");
        var path = MatchPath(league, (await StartAsync(league)).GetProperty("matches")[0]);
        (await SettledAsync(() => ResultAsync(league, path, "first", 1))).StatusCode.ShouldBe(HttpStatusCode.OK);
        return (league, path, Guid.Parse(league.Path.Split('/')[^1]));
    }

    [Fact]
    [Trait("covers", "result-corrections: A win corrected to a draw")]
    [Trait("covers", "result-corrections: A lost response")]
    public async Task An_owner_corrects_a_win_to_a_draw_once_and_a_retry_returns_the_correction()
    {
        var (league, path, tournament) = await WonAsync();
        var body = new { operationId = Guid.NewGuid(), expectedRevision = 2, cause = "played", outcome = "draw", correctionReason = "Score sheet misread" };

        var corrected = await SettledAsync(() => CorrectAsync(league, path, body));
        var retried = await SettledAsync(() => CorrectAsync(league, path, body));

        corrected.StatusCode.ShouldBe(HttpStatusCode.OK);
        retried.StatusCode.ShouldBe(HttpStatusCode.OK);
        var match = await JsonAsync(retried);
        (Revision(match), match.GetProperty("result").GetProperty("outcome").GetString()).ShouldBe((3, "draw"));
        var replaced = match.GetProperty("replacedResults").EnumerateArray().ShouldHaveSingleItem();
        replaced.GetProperty("result").GetProperty("outcome").GetString().ShouldBe("first");
        replaced.GetProperty("correctionReason").GetString().ShouldBe("Score sheet misread");
        var sent = api.Sent<TournamentResultsChanged>().Where(message => message.TournamentId == tournament).ToList();
        sent.Select(message => message.Revision).ShouldBe([1, 2, 3]);
        sent[^1].Matches.Single(result => result.State == ResultsMatchState.Resolved).Outcome.ShouldBe(ResultOutcome.Draw);
        var standings = await JsonAsync(await league.Client.GetAsync($"{league.Path}/standings", Cancellation));
        Revision(standings).ShouldBe(3);
    }

    [Fact]
    public async Task Standings_preview_a_correction_from_the_results_they_applied_and_change_nothing()
    {
        var (league, path, _) = await WonAsync();
        var match = path.Split('/')[^1];

        var preview = await JsonAsync(await league.Client.GetAsync($"{league.Path}/standings/preview?match={match}&matchRevision=2&outcome=draw&cause=played", Cancellation));
        var behind = await JsonAsync(await league.Client.GetAsync($"{league.Path}/standings/preview?match={match}&matchRevision=3&outcome=draw&cause=played", Cancellation));
        var other = await api.As(Guid.NewGuid()).GetAsync($"{league.Path}/standings/preview?match={match}&matchRevision=2&outcome=draw&cause=played", Cancellation);

        (Revision(preview), preview.GetProperty("updating").GetBoolean()).ShouldBe((2, false));
        var robin = preview.GetProperty("entrants").EnumerateArray().Single(entrant => entrant.GetProperty("name").GetString() == "Robin Vale");
        (robin.GetProperty("pointsBefore").GetInt32(), robin.GetProperty("pointsAfter").GetInt32()).ShouldBe((3, 1));
        (behind.GetProperty("updating").GetBoolean(), behind.GetProperty("matchRevision").GetInt32()).ShouldBe((true, 2));
        other.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await JsonAsync(await league.Client.GetAsync($"{league.Path}/standings", Cancellation))).GetProperty("rows")[0].GetProperty("points").GetInt32().ShouldBe(3);
    }

    [Fact]
    [Trait("covers", "result-corrections: No reason")]
    [Trait("covers", "result-corrections: A scheduled match")]
    public async Task A_correction_without_a_reason_or_of_an_unresolved_match_is_rejected()
    {
        var league = await OpenAsync("individual");
        foreach (var name in new[] { "Robin Vale", "Sam Reed", "Jamie Brook", "Taylor Finch" })
        {
            await EnterAsync(league, name);
        }

        var matches = (await StartAsync(league)).GetProperty("matches");
        var won = MatchPath(league, matches[0]);
        await SettledAsync(() => ResultAsync(league, won, "first", 1));

        var unexplained = await CorrectAsync(league, won, new { operationId = Guid.NewGuid(), expectedRevision = 2, cause = "played", outcome = "draw" });
        var scheduled = await CorrectAsync(league, MatchPath(league, matches[1]),
            new { operationId = Guid.NewGuid(), expectedRevision = 1, cause = "played", outcome = "draw", correctionReason = "Score sheet misread" });

        unexplained.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        var problem = await JsonAsync(unexplained);
        Errors(problem, "correction-reason").ShouldBe(["required"]);
        problem.GetProperty("match").GetProperty("result").GetProperty("outcome").GetString().ShouldBe("first");
        Errors(await JsonAsync(scheduled), "match").ShouldBe(["not-resolved"]);
    }

    [Fact]
    [Trait("covers", "result-corrections: Changed elsewhere")]
    public async Task A_correction_from_an_older_revision_conflicts_and_another_organisation_cannot_correct()
    {
        var (league, path, _) = await WonAsync();
        var body = new { operationId = Guid.NewGuid(), expectedRevision = 1, cause = "played", outcome = "draw", correctionReason = "Score sheet misread" };

        var stale = await CorrectAsync(league, path, body);
        var other = await api.As(Guid.NewGuid()).PostAsJsonAsync($"{path}/result/correction", body with { }, Cancellation);

        stale.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        (await JsonAsync(stale)).GetProperty("currentRevision").GetInt32().ShouldBe(2);
        other.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await JsonAsync(await league.Client.GetAsync(path, Cancellation))).GetProperty("result").GetProperty("outcome").GetString().ShouldBe("first");
    }
}
