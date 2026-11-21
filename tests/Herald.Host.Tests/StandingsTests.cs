using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Herald.Contracts.Competition.V1;
using Herald.Contracts.Standings.V1;
using Shouldly;

namespace Herald.Host.Tests;

// The standings spec through the Admin API: Competition's results reach Standings, which computes the table (h1-standings D-1, D-2).
// Part of MatchTests for its league helpers.
public partial class MatchTests
{
    private static string Name(JsonElement side) => side.GetProperty("name").GetString()!;

    // Records every match of a four-player league: Robin Vale wins all three, Sam Reed and Jamie Brook draw and each beats Taylor Finch.
    private async Task<League> PlayedLeagueAsync()
    {
        var league = await OpenAsync("individual");
        foreach (var name in new[] { "Robin Vale", "Sam Reed", "Jamie Brook", "Taylor Finch" })
        {
            await EnterAsync(league, name);
        }

        foreach (var match in (await StartAsync(league)).GetProperty("matches").EnumerateArray())
        {
            var (first, second) = (Name(match.GetProperty("first")), Name(match.GetProperty("second")));
            var outcome = first == "Robin Vale" || second == "Taylor Finch" ? "first"
                : second == "Robin Vale" || first == "Taylor Finch" ? "second"
                : "draw";
            (await SettledAsync(() => ResultAsync(league, MatchPath(league, match), outcome, 1))).StatusCode.ShouldBe(HttpStatusCode.OK);
        }

        return league;
    }

    [Fact]
    public async Task A_played_league_s_standings_rank_by_points_share_second_place_and_explain_each_entrant()
    {
        var league = await PlayedLeagueAsync();

        var standings = await JsonAsync(await league.Client.GetAsync($"{league.Path}/standings", Cancellation));

        Revision(standings).ShouldBe(7);
        (standings.GetProperty("resolvedMatches").GetInt32(), standings.GetProperty("matches").GetInt32()).ShouldBe((6, 6));
        var rows = standings.GetProperty("rows").EnumerateArray().ToList();
        rows.Select(row => (row.GetProperty("position").GetInt32(), row.GetProperty("shared").GetBoolean(), Name(row.GetProperty("entrant")), row.GetProperty("points").GetInt32()))
            .ShouldBe([(1, false, "Robin Vale", 9), (2, true, "Jamie Brook", 4), (2, true, "Sam Reed", 4), (4, false, "Taylor Finch", 0)]);
        var sam = rows[2];
        sam.GetProperty("lines").EnumerateArray().Sum(line => line.GetProperty("points").GetInt32()).ShouldBe(4);
        sam.GetProperty("lines").EnumerateArray().ShouldAllBe(line => line.GetProperty("cause").GetString() == "played");
    }

    [Fact]
    public async Task An_older_results_snapshot_leaves_the_standings_as_they_are()
    {
        var league = await PlayedLeagueAsync();
        var organisation = Guid.Parse(league.Organisation.Split('/')[^1]);
        var tournament = Guid.Parse(league.Path.Split('/')[^1]);

        await api.PublishAndWaitAsync(new TournamentResultsChanged(organisation, tournament, 4, [], [], []));
        var standings = await JsonAsync(await league.Client.GetAsync($"{league.Path}/standings", Cancellation));

        Revision(standings).ShouldBe(7);
        standings.GetProperty("rows").GetArrayLength().ShouldBe(4);
    }

    [Fact]
    public async Task Standings_are_not_found_before_start_or_for_another_organisation()
    {
        var league = await OpenAsync("individual");
        await EnterAsync(league, "Robin Vale");
        await EnterAsync(league, "Sam Reed");

        var before = await league.Client.GetAsync($"{league.Path}/standings", Cancellation);
        await StartAsync(league);
        var started = await league.Client.GetAsync($"{league.Path}/standings", Cancellation);
        var other = await api.As(Guid.NewGuid()).GetAsync($"{league.Path}/standings", Cancellation);

        before.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        started.StatusCode.ShouldBe(HttpStatusCode.OK);
        other.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    [Trait("covers", "standings: After a result")]
    public async Task Standings_publish_their_table_at_each_results_revision_and_again_when_it_becomes_final()
    {
        var league = await PlayedLeagueAsync();
        var tournament = Guid.Parse(league.Path.Split('/')[^1]);

        var tables = api.Sent<TournamentStandingsChanged>().Where(message => message.TournamentId == tournament).Distinct().ToList();
        var latest = tables.MaxBy(message => message.Revision).ShouldNotBeNull();
        latest.ResultsRevision.ShouldBe(7);
        (latest.ResolvedMatches, latest.Matches, latest.Final).ShouldBe((6, 6, null));
        latest.Rows.Select(row => (row.Position, row.Shared, row.Name, row.Points))
            .ShouldBe([(1, false, "Robin Vale", 9), (2, true, "Jamie Brook", 4), (2, true, "Sam Reed", 4), (4, false, "Taylor Finch", 0)]);

        (await SettledAsync(async () => await FinaliseAsync(league, ResultsRevision(await ScheduleAsync(league))))).StatusCode.ShouldBe(HttpStatusCode.OK);

        var final = api.Sent<TournamentStandingsChanged>().Where(message => message.TournamentId == tournament).MaxBy(message => message.Revision).ShouldNotBeNull();
        final.Revision.ShouldBeGreaterThan(latest.Revision);
        (final.ResultsRevision, final.Final?.Number).ShouldBe((7, 1));
    }
}
