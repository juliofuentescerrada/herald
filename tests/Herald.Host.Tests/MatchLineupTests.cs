using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Shouldly;

namespace Herald.Host.Tests;

// The match-lineups spec through the Admin API: matches appear when the competition starts, frozen rosters arrive
// from Registration and the lineup size from Tournaments (h1-match-lineups D-1, D-4).
[Collection(OrganisationApiTests.Name)]
public class MatchLineupTests(OrganisationApi api)
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
}
