using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Herald.Contracts.Competition.V1;
using Shouldly;

namespace Herald.Host.Tests;

// The match-lineups and match-results specs through the Admin API: matches appear when the competition starts, frozen rosters arrive
// from Registration and the lineup size from Tournaments (h1-match-lineups D-1, D-4).
[Collection(OrganisationApiTests.Name)]
public partial class MatchTests(OrganisationApi api)
{
    private sealed record League(HttpClient Client, string Organisation, string Path);

    private static CancellationToken Cancellation => TestContext.Current.CancellationToken;

    private static object Configuration(string entryKind) => new
    {
        title = "Saturday League",
        gameVariant = "Example strategy · Standard variant",
        entryKind,
        capacity = 8,
        minimumRosterSize = entryKind == "team" ? 5 : (int?)null,
        maximumRosterSize = entryKind == "team" ? 7 : (int?)null,
        activePlayersPerSide = entryKind == "team" ? 5 : (int?)null,
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

    private Task<HttpResponseMessage> SettledAsync(Func<Task<HttpResponseMessage>> request) => api.SettledAsync(request);

    private async Task<League> OpenAsync(string entryKind, HttpClient? client = null)
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

    private async Task<Guid> EnterAsync(League league, string name, string kind = "player")
    {
        var guest = await GuestAsync(league, name, kind);
        var entry = Guid.NewGuid();
        (await SettledAsync(() => league.Client.PutAsJsonAsync($"{league.Path}/entries/{entry}", new { guestId = guest }, Cancellation))).StatusCode.ShouldBe(HttpStatusCode.OK);
        return entry;
    }

    // A team of seven guest players; returns their identifiers.
    private async Task<List<Guid>> TeamAsync(League league, string name)
    {
        var team = await EnterAsync(league, name, "team");
        List<Guid> players = [];
        for (var i = 1; i <= 7; i++)
        {
            var guest = await GuestAsync(league, $"{name} player {i}", "player");
            var roster = await JsonAsync(await league.Client.GetAsync($"{league.Path}/entries/{team}/roster", Cancellation));
            (await SettledAsync(() => league.Client.PutAsJsonAsync($"{league.Path}/entries/{team}/roster/members/{guest}", new { expectedRevision = Revision(roster) }, Cancellation)))
                .StatusCode.ShouldBe(HttpStatusCode.OK);
            players.Add(guest);
        }

        return players;
    }

    private async Task<JsonElement> StartAsync(League league)
    {
        await SettledAsync(() => league.Client.PostAsJsonAsync($"{league.Path}/registration/closure", new { expectedRevision = 3 }, Cancellation));
        var schedule = await JsonAsync(await league.Client.GetAsync($"{league.Path}/schedule", Cancellation));
        var draft = await JsonAsync(await SettledAsync(() => league.Client.PostAsJsonAsync(
            $"{league.Path}/schedule/draft", new { operationId = Guid.NewGuid(), expectedRevision = Revision(schedule), seeding = "admissionOrder" }, Cancellation)));
        await SettledAsync(() => league.Client.PostAsJsonAsync($"{league.Path}/schedule/publication", new { expectedRevision = Revision(draft) }, Cancellation));
        var tournament = await JsonAsync(await league.Client.GetAsync(league.Path, Cancellation));
        (await SettledAsync(() => league.Client.PostAsJsonAsync($"{league.Path}/competition/start", new { expectedRevision = Revision(tournament) }, Cancellation)))
            .StatusCode.ShouldBe(HttpStatusCode.OK);
        return await JsonAsync(await league.Client.GetAsync($"{league.Path}/schedule", Cancellation));
    }

    private static string MatchPath(League league, JsonElement match) => $"{league.Path}/matches/{match.GetProperty("matchId").GetGuid()}";

    private static async Task<HttpResponseMessage> LineupAsync(League league, string match, string side, IEnumerable<Guid> players, int revision) =>
        await league.Client.PutAsJsonAsync($"{match}/lineups/{side}", new { expectedRevision = revision, players }, Cancellation);

    [Fact]
    [Trait("covers", "match-lineups: Four players")]
    [Trait("covers", "match-lineups: A later round first")]
    public async Task A_started_individual_league_has_six_scheduled_matches_and_a_round_three_match_starts_first()
    {
        var league = await OpenAsync("individual");
        foreach (var name in new[] { "Robin Vale", "Sam Reed", "Jamie Brook", "Taylor Finch" })
        {
            await EnterAsync(league, name);
        }

        var schedule = await StartAsync(league);
        var matches = schedule.GetProperty("matches").EnumerateArray().ToList();
        var last = MatchPath(league, matches[^1]);
        var started = await league.Client.PostAsJsonAsync($"{last}/start", new { expectedRevision = 1 }, Cancellation);

        matches.Count.ShouldBe(6);
        matches.Select(match => match.GetProperty("round").GetInt32()).Distinct().Count().ShouldBe(3);
        matches.ShouldAllBe(match => match.GetProperty("state").GetString() == "scheduled");
        matches[0].GetProperty("first").GetProperty("name").GetString().ShouldBe("Robin Vale");
        started.StatusCode.ShouldBe(HttpStatusCode.OK);
        var details = await JsonAsync(started);
        details.GetProperty("round").GetInt32().ShouldBe(3);
        details.GetProperty("state").GetString().ShouldBe("inPlay");
    }

    [Fact]
    [Trait("covers", "team-rosters: Two teams frozen")]
    [Trait("covers", "match-lineups: Four starters")]
    [Trait("covers", "match-lineups: A side without a lineup")]
    [Trait("covers", "match-lineups: A valid team start")]
    [Trait("covers", "match-lineups: Starting from the Match page")]
    public async Task An_owner_records_two_lineups_of_five_from_frozen_rosters_and_the_start_locks_them()
    {
        var league = await OpenAsync("team");
        var falcons = await TeamAsync(league, "River Falcons");
        var stars = await TeamAsync(league, "North Stars");
        var schedule = await StartAsync(league);
        var path = MatchPath(league, schedule.GetProperty("matches")[0]);

        var match = await JsonAsync(await league.Client.GetAsync(path, Cancellation));
        var four = await JsonAsync(await LineupAsync(league, path, "first", falcons[..4], Revision(match)));
        var first = await JsonAsync(await LineupAsync(league, path, "first", falcons[..5], Revision(match)));
        var blocked = await JsonAsync(await league.Client.PostAsJsonAsync($"{path}/start", new { expectedRevision = Revision(first) }, Cancellation));
        var second = await JsonAsync(await LineupAsync(league, path, "second", stars[..5], Revision(first)));
        var started = await league.Client.PostAsJsonAsync($"{path}/start", new { expectedRevision = Revision(second) }, Cancellation);
        var details = await JsonAsync(started);
        var late = await JsonAsync(await LineupAsync(league, path, "first", falcons[2..], Revision(details)));

        match.GetProperty("activePlayers").GetInt32().ShouldBe(5);
        match.GetProperty("first").GetProperty("roster").GetArrayLength().ShouldBe(7);
        match.GetProperty("second").GetProperty("roster").GetArrayLength().ShouldBe(7);
        match.GetProperty("blockers").EnumerateArray().Select(blocker => blocker.GetString()).ShouldBe(["first-lineup-missing", "second-lineup-missing"]);
        Errors(four, "players").ShouldBe(["count"]);
        Errors(blocked, "second-lineup").ShouldBe(["missing"]);
        started.StatusCode.ShouldBe(HttpStatusCode.OK);
        details.GetProperty("state").GetString().ShouldBe("inPlay");
        details.GetProperty("start").GetProperty("firstLineup").GetInt32().ShouldBe(1);
        details.GetProperty("first").GetProperty("lineups")[0].GetProperty("players").GetArrayLength().ShouldBe(5);
        Errors(late, "match").ShouldBe(["started"]);
    }

    [Fact]
    public async Task A_lineup_from_an_older_revision_is_a_conflict_with_the_current_match()
    {
        var league = await OpenAsync("team");
        var falcons = await TeamAsync(league, "River Falcons");
        await TeamAsync(league, "North Stars");
        var path = MatchPath(league, (await StartAsync(league)).GetProperty("matches")[0]);
        await LineupAsync(league, path, "first", falcons[..5], 1);

        var stale = await LineupAsync(league, path, "first", falcons[2..], 1);

        stale.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        Revision((await JsonAsync(stale)).GetProperty("match")).ShouldBe(2);
    }

    [Fact]
    public async Task A_repeated_lineup_and_a_repeated_start_return_the_match_as_it_is()
    {
        var league = await OpenAsync("team");
        var falcons = await TeamAsync(league, "River Falcons");
        var stars = await TeamAsync(league, "North Stars");
        var path = MatchPath(league, (await StartAsync(league)).GetProperty("matches")[0]);
        await LineupAsync(league, path, "first", falcons[..5], 1);

        var repeatedLineup = await LineupAsync(league, path, "first", falcons[..5], 1);
        var second = await JsonAsync(await LineupAsync(league, path, "second", stars[..5], 2));
        await league.Client.PostAsJsonAsync($"{path}/start", new { expectedRevision = Revision(second) }, Cancellation);
        var repeatedStart = await league.Client.PostAsJsonAsync($"{path}/start", new { expectedRevision = Revision(second) }, Cancellation);

        repeatedLineup.StatusCode.ShouldBe(HttpStatusCode.OK);
        var lineup = await JsonAsync(repeatedLineup);
        Revision(lineup).ShouldBe(2);
        lineup.GetProperty("first").GetProperty("lineups").GetArrayLength().ShouldBe(1);
        repeatedStart.StatusCode.ShouldBe(HttpStatusCode.OK);
        var started = await JsonAsync(repeatedStart);
        started.GetProperty("state").GetString().ShouldBe("inPlay");
        Revision(started).ShouldBe(Revision(second) + 1);
    }

    [Fact]
    public async Task Another_organisations_match_is_not_found()
    {
        var league = await OpenAsync("individual");
        await EnterAsync(league, "Robin Vale");
        await EnterAsync(league, "Sam Reed");
        var path = MatchPath(league, (await StartAsync(league)).GetProperty("matches")[0]);
        var other = api.As(Guid.NewGuid());

        (await other.GetAsync(path, Cancellation)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await other.PutAsJsonAsync($"{path}/lineups/first", new { expectedRevision = 1, players = Array.Empty<Guid>() }, Cancellation)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await other.PostAsJsonAsync($"{path}/start", new { expectedRevision = 1 }, Cancellation)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    private static async Task<HttpResponseMessage> ResultAsync(League league, string match, string outcome, int revision, Guid? operation = null) =>
        await league.Client.PostAsJsonAsync($"{match}/result", new { operationId = operation ?? Guid.NewGuid(), expectedRevision = revision, outcome }, Cancellation);

    [Fact]
    [Trait("covers", "match-results: A scheduled individual match")]
    [Trait("covers", "match-results: A double submission")]
    [Trait("covers", "match-results: A second result")]
    public async Task An_owner_records_a_win_in_one_step_a_retry_returns_it_and_a_second_result_is_rejected()
    {
        var league = await OpenAsync("individual");
        foreach (var name in new[] { "Robin Vale", "Sam Reed", "Jamie Brook", "Taylor Finch" })
        {
            await EnterAsync(league, name);
        }

        var matches = (await StartAsync(league)).GetProperty("matches");
        var path = MatchPath(league, matches[0]);
        var operation = Guid.NewGuid();

        var won = await ResultAsync(league, path, "first", 1, operation);
        var retried = await ResultAsync(league, path, "first", 1, operation);
        var second = await ResultAsync(league, path, "second", 2);
        var drawn = await JsonAsync(await ResultAsync(league, MatchPath(league, matches[1]), "draw", 1));
        var schedule = await JsonAsync(await league.Client.GetAsync($"{league.Path}/schedule", Cancellation));

        won.StatusCode.ShouldBe(HttpStatusCode.OK);
        var details = await JsonAsync(won);
        details.GetProperty("state").GetString().ShouldBe("resolved");
        details.GetProperty("start").ValueKind.ShouldBe(JsonValueKind.Object);
        details.GetProperty("result").GetProperty("outcome").GetString().ShouldBe("first");
        details.GetProperty("result").GetProperty("cause").GetString().ShouldBe("played");
        retried.StatusCode.ShouldBe(HttpStatusCode.OK);
        Revision(await JsonAsync(retried)).ShouldBe(Revision(details));
        Errors(await JsonAsync(second), "match").ShouldBe(["resolved"]);
        drawn.GetProperty("result").GetProperty("outcome").GetString().ShouldBe("draw");
        schedule.GetProperty("matches")[0].GetProperty("result").GetProperty("outcome").GetString().ShouldBe("first");
        schedule.GetProperty("matches")[1].GetProperty("result").GetProperty("outcome").GetString().ShouldBe("draw");
    }

    [Fact]
    [Trait("covers", "match-results: A team match not started")]
    [Trait("covers", "match-results: Reserves")]
    public async Task A_team_result_needs_the_start_and_credits_only_the_locked_starters()
    {
        var league = await OpenAsync("team");
        var falcons = await TeamAsync(league, "River Falcons");
        var stars = await TeamAsync(league, "North Stars");
        var path = MatchPath(league, (await StartAsync(league)).GetProperty("matches")[0]);
        await LineupAsync(league, path, "first", falcons[..5], 1);
        await LineupAsync(league, path, "second", stars[..5], 2);

        var early = await JsonAsync(await ResultAsync(league, path, "first", 3));
        await league.Client.PostAsJsonAsync($"{path}/start", new { expectedRevision = 3 }, Cancellation);
        var played = await JsonAsync(await ResultAsync(league, path, "first", 4));

        Errors(early, "match").ShouldBe(["not-started"]);
        var appearances = played.GetProperty("appearances").EnumerateArray().Select(player => player.GetProperty("playerId").GetGuid()).ToList();
        appearances.Count.ShouldBe(10);
        appearances.ShouldNotContain(falcons[5]);
        appearances.ShouldNotContain(stars[6]);
    }

    [Fact]
    public async Task The_start_and_each_resolution_publish_the_next_results_revision()
    {
        var league = await OpenAsync("individual");
        foreach (var name in new[] { "Robin Vale", "Sam Reed", "Jamie Brook" })
        {
            await EnterAsync(league, name);
        }

        var matches = (await StartAsync(league)).GetProperty("matches");
        await SettledAsync(() => ResultAsync(league, MatchPath(league, matches[0]), "first", 1));
        await SettledAsync(() => ResultAsync(league, MatchPath(league, matches[1]), "draw", 1));

        var tournament = Guid.Parse(league.Path.Split('/')[^1]);
        var sent = api.Sent<TournamentResultsChanged>().Where(message => message.TournamentId == tournament).ToList();
        sent.Select(message => message.Revision).ShouldBe([1, 2, 3]);
        sent[0].Entrants.Count.ShouldBe(3);
        sent[0].Rests.Count.ShouldBe(3);
        sent[0].Matches.ShouldAllBe(match => match.State == ResultsMatchState.Scheduled && match.Outcome == null);
        var last = sent[^1].Matches.ToDictionary(match => match.MatchId);
        var won = last[matches[0].GetProperty("matchId").GetGuid()];
        (won.State, won.Outcome, won.Cause, won.Played).ShouldBe((ResultsMatchState.Resolved, ResultOutcome.First, "played", true));
        last[matches[1].GetProperty("matchId").GetGuid()].Outcome.ShouldBe(ResultOutcome.Draw);
    }

    [Fact]
    public async Task Results_recorded_at_once_in_one_tournament_all_succeed_with_consecutive_results_revisions()
    {
        var league = await OpenAsync("individual");
        foreach (var name in new[] { "Robin Vale", "Sam Reed", "Jamie Brook", "Taylor Finch" })
        {
            await EnterAsync(league, name);
        }

        var matches = (await StartAsync(league)).GetProperty("matches").EnumerateArray().Take(4).ToList();
        var answers = await api.SettledAsync(() => Task.WhenAll(matches.Select(match => ResultAsync(league, MatchPath(league, match), "first", 1))));

        answers.ShouldAllBe(answer => answer.StatusCode == HttpStatusCode.OK);
        var tournament = Guid.Parse(league.Path.Split('/')[^1]);
        api.Sent<TournamentResultsChanged>().Where(message => message.TournamentId == tournament).Select(message => message.Revision).Order().ShouldBe([1, 2, 3, 4, 5]);
        var standings = await JsonAsync(await league.Client.GetAsync($"{league.Path}/standings", Cancellation));
        (Revision(standings), standings.GetProperty("resolvedMatches").GetInt32()).ShouldBe((5, 4));
    }

    [Fact]
    public async Task A_result_from_an_older_revision_is_a_conflict_and_another_organisation_cannot_record_one()
    {
        var league = await OpenAsync("individual");
        await EnterAsync(league, "Robin Vale");
        await EnterAsync(league, "Sam Reed");
        var path = MatchPath(league, (await StartAsync(league)).GetProperty("matches")[0]);

        var stale = await ResultAsync(league, path, "first", 7);
        var other = await api.As(Guid.NewGuid()).PostAsJsonAsync($"{path}/result", new { operationId = Guid.NewGuid(), expectedRevision = 1, outcome = "first" }, Cancellation);

        stale.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        other.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    private static async Task<JsonElement> CauseAsync(League league, string match, object body) =>
        await JsonAsync(await league.Client.PostAsJsonAsync($"{match}/result", body, Cancellation));

    [Fact]
    [Trait("covers", "match-results: Before play")]
    [Trait("covers", "match-results: A double absence")]
    [Trait("covers", "match-results: No reason")]
    public async Task An_owner_records_a_concession_a_double_absence_and_a_no_contest_and_the_schedule_shows_each_cause()
    {
        var league = await OpenAsync("individual");
        foreach (var name in new[] { "Robin Vale", "Sam Reed", "Jamie Brook", "Taylor Finch" })
        {
            await EnterAsync(league, name);
        }

        var matches = (await StartAsync(league)).GetProperty("matches");
        var operation = Guid.NewGuid();
        var concession = new { operationId = operation, expectedRevision = 1, cause = "concession", entrant = "first", played = false };

        var conceded = await CauseAsync(league, MatchPath(league, matches[0]), concession);
        var repeated = await CauseAsync(league, MatchPath(league, matches[0]), concession);
        var afterwards = await CauseAsync(league, MatchPath(league, matches[0]), new { operationId = Guid.NewGuid(), expectedRevision = 2, cause = "noContest", played = false, reason = "Late" });
        var absent = await CauseAsync(league, MatchPath(league, matches[1]), new { operationId = Guid.NewGuid(), expectedRevision = 1, cause = "doubleAbsence" });
        var noReason = await CauseAsync(league, MatchPath(league, matches[2]), new { operationId = Guid.NewGuid(), expectedRevision = 1, cause = "noContest", played = false });
        var noOutcome = await CauseAsync(league, MatchPath(league, matches[2]), new { operationId = Guid.NewGuid(), expectedRevision = 1, cause = "played" });
        var noContest = await CauseAsync(league, MatchPath(league, matches[2]), new { operationId = Guid.NewGuid(), expectedRevision = 1, cause = "noContest", played = false, reason = "Venue closed" });
        var schedule = (await JsonAsync(await league.Client.GetAsync($"{league.Path}/schedule", Cancellation))).GetProperty("matches");

        conceded.GetProperty("state").GetString().ShouldBe("resolved");
        conceded.GetProperty("start").ValueKind.ShouldBe(JsonValueKind.Null);
        var result = conceded.GetProperty("result");
        (result.GetProperty("cause").GetString(), result.GetProperty("outcome").GetString(), result.GetProperty("played").GetBoolean()).ShouldBe(("concession", "second", false));
        conceded.GetProperty("appearances").GetArrayLength().ShouldBe(0);
        Revision(repeated).ShouldBe(Revision(conceded));
        var started = await JsonAsync(await league.Client.PostAsJsonAsync($"{MatchPath(league, matches[0])}/start", new { expectedRevision = 2 }, Cancellation));
        Errors(started, "match").ShouldBe(["resolved"]);
        Errors(afterwards, "match").ShouldBe(["resolved"]);
        absent.GetProperty("result").GetProperty("outcome").GetString().ShouldBe("none");
        Errors(noReason, "reason").ShouldBe(["required"]);
        Errors(noOutcome, "outcome").ShouldBe(["required"]);
        noContest.GetProperty("result").GetProperty("reason").GetString().ShouldBe("Venue closed");
        schedule.EnumerateArray().Take(3).Select(match => match.GetProperty("result").GetProperty("cause").GetString()).ShouldBe(["concession", "doubleAbsence", "noContest"]);
        schedule[2].GetProperty("result").GetProperty("reason").GetString().ShouldBe("Venue closed");
    }

    [Fact]
    [Trait("covers", "match-results: Play claimed on an unstarted team match")]
    [Trait("covers", "match-results: An absence after start")]
    [Trait("covers", "match-results: A no contest after play")]
    public async Task A_team_match_takes_play_only_once_started_and_no_absence_after_it()
    {
        var league = await OpenAsync("team");
        var falcons = await TeamAsync(league, "River Falcons");
        var stars = await TeamAsync(league, "North Stars");
        var path = MatchPath(league, (await StartAsync(league)).GetProperty("matches")[0]);
        await LineupAsync(league, path, "first", falcons[..5], 1);
        await LineupAsync(league, path, "second", stars[..5], 2);

        var early = await CauseAsync(league, path, new { operationId = Guid.NewGuid(), expectedRevision = 3, cause = "concession", entrant = "first", played = true });
        await league.Client.PostAsJsonAsync($"{path}/start", new { expectedRevision = 3 }, Cancellation);
        var absence = await CauseAsync(league, path, new { operationId = Guid.NewGuid(), expectedRevision = 4, cause = "singleAbsence", entrant = "second" });
        var noContest = await CauseAsync(league, path, new { operationId = Guid.NewGuid(), expectedRevision = 4, cause = "noContest", played = true, reason = "Venue closed" });

        Errors(early, "match").ShouldBe(["not-started"]);
        early.GetProperty("match").GetProperty("state").GetString().ShouldBe("scheduled");
        Errors(absence, "match").ShouldBe(["started"]);
        noContest.GetProperty("result").GetProperty("outcome").GetString().ShouldBe("none");
        noContest.GetProperty("appearances").GetArrayLength().ShouldBe(10);
    }
}
