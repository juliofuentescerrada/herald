using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Shouldly;

namespace Herald.Host.Tests;

// The round-operations spec through the Admin API: departures resolve unplayed matches in one write, players become unavailable
// (h1-round-operations D-2, D-3). Part of MatchTests for its league helpers.
public partial class MatchTests
{
    private static Guid EntryOf(JsonElement schedule, string name) =>
        schedule.GetProperty("entrants").EnumerateArray().Single(entrant => entrant.GetProperty("name").GetString() == name).GetProperty("entryId").GetGuid();

    private static IEnumerable<JsonElement> MatchesOf(JsonElement schedule, string name) =>
        schedule.GetProperty("matches").EnumerateArray().Where(match => Name(match.GetProperty("first")) == name || Name(match.GetProperty("second")) == name);

    private static Task<HttpResponseMessage> DepartAsync(League league, Guid entry, string kind, int revision, string? reason, Guid? operation = null) =>
        league.Client.PostAsJsonAsync($"{league.Path}/entrants/{entry}/{kind}", new { operationId = operation ?? Guid.NewGuid(), expectedRevision = revision, reason }, Cancellation);

    private async Task<(League League, JsonElement Schedule)> IndividualLeagueAsync()
    {
        var league = await OpenAsync("individual");
        foreach (var name in new[] { "Robin Vale", "Sam Reed", "Jamie Brook", "Taylor Finch" })
        {
            await EnterAsync(league, name);
        }

        return (league, await StartAsync(league));
    }

    [Fact]
    [Trait("covers", "round-operations: A withdrawal with matches left")]
    public async Task An_owner_withdraws_an_entrant_and_its_scheduled_matches_are_resolved_as_its_absence_in_one_write()
    {
        (var league, var schedule) = await IndividualLeagueAsync();
        var played = MatchesOf(schedule, "Sam Reed").Single(match => match.GetProperty("round").GetInt32() == 1);
        (await SettledAsync(() => ResultAsync(league, MatchPath(league, played), "draw", 1))).StatusCode.ShouldBe(HttpStatusCode.OK);
        schedule = await JsonAsync(await league.Client.GetAsync($"{league.Path}/schedule", Cancellation));
        var operation = Guid.NewGuid();

        var response = await SettledAsync(() => DepartAsync(league, EntryOf(schedule, "Sam Reed"), "withdrawal", Revision(schedule), "Moved away", operation));
        var withdrawn = await JsonAsync(response);
        var repeated = await DepartAsync(league, EntryOf(schedule, "Sam Reed"), "withdrawal", Revision(schedule), "Moved away", operation);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var sam = withdrawn.GetProperty("entrants").EnumerateArray().Single(entrant => entrant.GetProperty("name").GetString() == "Sam Reed");
        (sam.GetProperty("status").GetString(), sam.GetProperty("reason").GetString()).ShouldBe(("withdrawn", "Moved away"));
        var matches = MatchesOf(withdrawn, "Sam Reed").ToList();
        matches.Single(match => match.GetProperty("round").GetInt32() == 1).GetProperty("result").GetProperty("cause").GetString().ShouldBe("played");
        matches.Where(match => match.GetProperty("round").GetInt32() > 1).Select(match => match.GetProperty("result").GetProperty("cause").GetString()).ShouldBe(["singleAbsence", "singleAbsence"]);
        withdrawn.GetProperty("operations").GetProperty("resolved").GetInt32().ShouldBe(3);
        repeated.StatusCode.ShouldBe(HttpStatusCode.OK);
        Revision(await JsonAsync(repeated)).ShouldBe(Revision(withdrawn));
    }

    [Fact]
    [Trait("covers", "round-operations: No reason")]
    public async Task A_departure_without_a_reason_twice_or_from_an_older_revision_changes_nothing()
    {
        (var league, var schedule) = await IndividualLeagueAsync();
        var sam = EntryOf(schedule, "Sam Reed");

        var noReason = await DepartAsync(league, sam, "withdrawal", Revision(schedule), " ");
        var stale = await DepartAsync(league, sam, "disqualification", Revision(schedule) - 1, "Abusive conduct");
        var disqualified = await JsonAsync(await SettledAsync(() => DepartAsync(league, sam, "disqualification", Revision(schedule), "Abusive conduct")));
        var again = await DepartAsync(league, sam, "withdrawal", Revision(disqualified), "Moved away");

        noReason.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        Errors(await JsonAsync(noReason), "reason").ShouldBe(["required"]);
        stale.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        disqualified.GetProperty("entrants").EnumerateArray().Single(entrant => entrant.GetProperty("entryId").GetGuid() == sam).GetProperty("status").GetString().ShouldBe("disqualified");
        Errors(await JsonAsync(again), "entrant").ShouldBe(["departed"]);
    }

    [Fact]
    public async Task Another_organisations_entrants_and_players_are_not_found()
    {
        (var league, var schedule) = await IndividualLeagueAsync();
        var sam = EntryOf(schedule, "Sam Reed");
        var other = api.As(Guid.NewGuid());
        var body = new { operationId = Guid.NewGuid(), expectedRevision = Revision(schedule), reason = "Moved away" };

        (await other.PostAsJsonAsync($"{league.Path}/entrants/{sam}/withdrawal", body, Cancellation)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await other.PostAsJsonAsync($"{league.Path}/entrants/{sam}/disqualification", body, Cancellation)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await other.PostAsJsonAsync($"{league.Path}/entrants/{sam}/players/{Guid.NewGuid()}/withdrawal", body, Cancellation)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await other.PostAsJsonAsync($"{league.Path}/entrants/{sam}/players/{Guid.NewGuid()}/sanction", body, Cancellation)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await other.PostAsJsonAsync($"{league.Path}/entrants/{sam}/players/{Guid.NewGuid()}/sanction/lift", body, Cancellation)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    [Trait("covers", "round-operations: A sanctioned starter")]
    [Trait("covers", "match-lineups: A sanctioned starter")]
    public async Task A_sanctioned_starter_needs_attention_blocks_the_start_and_after_the_sanction_is_lifted_the_match_starts()
    {
        var league = await OpenAsync("team");
        var falcons = await TeamAsync(league, "River Falcons");
        var stars = await TeamAsync(league, "North Stars");
        var schedule = await StartAsync(league);
        var path = MatchPath(league, schedule.GetProperty("matches")[0]);
        var team = EntryOf(schedule, "River Falcons");
        await LineupAsync(league, path, "first", falcons[..5], 1);
        var match = await JsonAsync(await LineupAsync(league, path, "second", stars[..5], 2));
        var players = $"{league.Path}/entrants/{team}/players/{falcons[0]}";

        var noReason = await league.Client.PostAsJsonAsync($"{players}/sanction", new { expectedRevision = Revision(schedule) }, Cancellation);
        var sanctioned = await JsonAsync(await SettledAsync(() => league.Client.PostAsJsonAsync($"{players}/sanction", new { expectedRevision = Revision(schedule), reason = "Abusive conduct" }, Cancellation)));
        var blocked = await JsonAsync(await league.Client.PostAsJsonAsync($"{path}/start", new { expectedRevision = Revision(match) }, Cancellation));
        var lifted = await JsonAsync(await SettledAsync(() => league.Client.PostAsJsonAsync($"{players}/sanction/lift", new { expectedRevision = Revision(sanctioned) }, Cancellation)));
        var started = await league.Client.PostAsJsonAsync($"{path}/start", new { expectedRevision = Revision(match) }, Cancellation);

        Errors(await JsonAsync(noReason), "reason").ShouldBe(["required"]);
        var attention = sanctioned.GetProperty("operations").GetProperty("attention")[0];
        (Name(attention.GetProperty("entrant")), Name(attention.GetProperty("player"))).ShouldBe(("River Falcons", "River Falcons player 1"));
        sanctioned.GetProperty("entrants").EnumerateArray().Single(entrant => entrant.GetProperty("entryId").GetGuid() == team)
            .GetProperty("roster").EnumerateArray().Single(player => player.GetProperty("playerId").GetGuid() == falcons[0]).GetProperty("status").GetString().ShouldBe("sanctioned");
        Errors(blocked, "first-lineup").ShouldBe(["unavailable"]);
        Errors(blocked, $"player-{falcons[0]}").ShouldBe(["unavailable"]);
        Name(blocked.GetProperty("match").GetProperty("unavailable")[0]).ShouldBe("River Falcons player 1");
        lifted.GetProperty("operations").GetProperty("attention").GetArrayLength().ShouldBe(0);
        started.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    public async Task A_withdrawn_player_cannot_be_named_in_a_lineup_and_stays_on_the_frozen_roster()
    {
        var league = await OpenAsync("team");
        var falcons = await TeamAsync(league, "River Falcons");
        await TeamAsync(league, "North Stars");
        var schedule = await StartAsync(league);
        var path = MatchPath(league, schedule.GetProperty("matches")[0]);
        var team = EntryOf(schedule, "River Falcons");

        var withdrawn = await JsonAsync(await SettledAsync(() => league.Client.PostAsJsonAsync(
            $"{league.Path}/entrants/{team}/players/{falcons[6]}/withdrawal", new { expectedRevision = Revision(schedule) }, Cancellation)));
        var lineup = await JsonAsync(await LineupAsync(league, path, "first", falcons[2..], 1));

        var roster = withdrawn.GetProperty("entrants").EnumerateArray().Single(entrant => entrant.GetProperty("entryId").GetGuid() == team).GetProperty("roster");
        roster.GetArrayLength().ShouldBe(7);
        roster.EnumerateArray().Count(player => player.GetProperty("status").GetString() == "withdrawn").ShouldBe(1);
        Errors(lineup, $"player-{falcons[6]}").ShouldBe(["unavailable"]);
    }

    [Fact]
    public async Task A_withdrawn_entrant_keeps_its_points_in_the_standings_and_is_flagged()
    {
        var league = await PlayedLeagueAsync();
        var schedule = await JsonAsync(await league.Client.GetAsync($"{league.Path}/schedule", Cancellation));

        (await SettledAsync(() => DepartAsync(league, EntryOf(schedule, "Robin Vale"), "withdrawal", Revision(schedule), "Moved away"))).StatusCode.ShouldBe(HttpStatusCode.OK);
        var standings = await JsonAsync(await league.Client.GetAsync($"{league.Path}/standings", Cancellation));

        Revision(standings).ShouldBe(8);
        var first = standings.GetProperty("rows")[0];
        (Name(first.GetProperty("entrant")), first.GetProperty("points").GetInt32(), first.GetProperty("entrant").GetProperty("status").GetString())
            .ShouldBe(("Robin Vale", 9, "withdrawn"));
    }
}
