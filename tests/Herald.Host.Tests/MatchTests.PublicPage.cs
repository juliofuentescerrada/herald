using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Shouldly;

namespace Herald.Host.Tests;

// The public-tournament-page spec through the Public API: anonymous reads of a published public or unlisted tournament, and the
// same "not available" answer for everything else (h1-public-read D-1 to D-3). Part of MatchTests for its league helpers.
public partial class MatchTests
{
    private static string PublicPath(League league) => $"/api/public/tournaments/{league.Path.Split('/')[^1]}";

    private async Task<HttpResponseMessage> VisitAsync(League league) => await api.Anonymous().GetAsync(PublicPath(league), Cancellation);

    private async Task<HttpResponseMessage> ChangeVisibilityAsync(League league, string visibility) =>
        await SettledAsync(async () => await league.Client.PostAsJsonAsync(
            $"{league.Path}/visibility", new { visibility, expectedRevision = Revision(await JsonAsync(await league.Client.GetAsync(league.Path, Cancellation))) }, Cancellation));

    private static async Task<(HttpStatusCode, string?, string?, string?)> NotAvailableOf(HttpResponseMessage response)
    {
        var problem = await JsonAsync(response);
        return (response.StatusCode, response.Headers.CacheControl?.ToString(), problem.GetProperty("type").GetString(), problem.GetProperty("title").GetString());
    }

    [Fact]
    [Trait("covers", "public-tournament-page: Before start")]
    public async Task A_visitor_reads_a_published_public_tournament_before_start_without_rounds_or_standings()
    {
        var league = await OpenAsync("individual");
        await EnterAsync(league, "Robin Vale");

        var response = await VisitAsync(league);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        response.Headers.CacheControl!.NoStore.ShouldBeTrue();
        var page = await JsonAsync(response);
        (page.GetProperty("title").GetString(), page.GetProperty("organiser").GetString(), page.GetProperty("timeZone").GetString()).ShouldBe(("Saturday League", "Northside Gaming", "Europe/Madrid"));
        (page.GetProperty("registration").GetString(), page.GetProperty("competition").GetString()).ShouldBe(("open", "preparation"));
        page.GetProperty("rounds").GetArrayLength().ShouldBe(0);
        page.GetProperty("standings").ValueKind.ShouldBe(JsonValueKind.Null);
        page.GetProperty("changes").EnumerateArray().ShouldContain(change => change.GetProperty("kind").GetString() == "tournamentPublished");
    }

    [Fact]
    [Trait("covers", "public-tournament-page: Running")]
    public async Task A_visitor_reads_a_running_unlisted_league_with_causes_and_provisional_standings()
    {
        var (league, schedule) = await IndividualLeagueAsync();
        (await ChangeVisibilityAsync(league, "unlisted")).StatusCode.ShouldBe(HttpStatusCode.OK);
        foreach (var match in schedule.GetProperty("matches").EnumerateArray().Take(3))
        {
            (await SettledAsync(() => ResultAsync(league, MatchPath(league, match), "first", 1))).StatusCode.ShouldBe(HttpStatusCode.OK);
        }

        var page = await JsonAsync(await VisitAsync(league));

        page.GetProperty("visibility").GetString().ShouldBe("unlisted");
        var matches = page.GetProperty("rounds").EnumerateArray().SelectMany(round => round.GetProperty("matches").EnumerateArray()).ToList();
        matches.Count.ShouldBe(6);
        matches.Count(match => match.GetProperty("cause").GetString() == "played").ShouldBe(3);
        var standings = page.GetProperty("standings");
        (standings.GetProperty("final").GetBoolean(), standings.GetProperty("resultsRevision").GetInt32(), standings.GetProperty("resolvedMatches").GetInt32()).ShouldBe((false, 4, 3));
        standings.GetProperty("updatedAt").GetDateTimeOffset().ShouldBeGreaterThan(DateTimeOffset.UtcNow.AddMinutes(-5));
        var first = standings.GetProperty("rows")[0];
        first.GetProperty("lines").EnumerateArray().Sum(line => line.GetProperty("points").GetInt32()).ShouldBe(first.GetProperty("points").GetInt32());
        standings.GetProperty("rows").EnumerateArray().Sum(row => row.GetProperty("remaining").GetArrayLength()).ShouldBe(6);
    }

    [Fact]
    [Trait("covers", "public-tournament-page: Cancelled")]
    public async Task A_tournament_cancelled_after_start_says_when_shows_the_voided_matches_and_has_no_champion()
    {
        var (league, schedule) = await IndividualLeagueAsync();
        (await SettledAsync(() => ResultAsync(league, MatchPath(league, schedule.GetProperty("matches")[0]), "first", 1))).StatusCode.ShouldBe(HttpStatusCode.OK);
        (await CancelTournamentAsync(league, "Venue flooded")).StatusCode.ShouldBe(HttpStatusCode.OK);

        var response = await VisitAsync(league);
        var page = await JsonAsync(response);

        page.GetProperty("competition").GetString().ShouldBe("cancelled");
        page.GetProperty("cancelledAt").ValueKind.ShouldBe(JsonValueKind.String);
        var causes = page.GetProperty("rounds").EnumerateArray().SelectMany(round => round.GetProperty("matches").EnumerateArray())
            .Select(match => match.GetProperty("cause").GetString()).ToList();
        causes.Count(cause => cause == "played").ShouldBe(1);
        causes.Where(cause => cause != "played").ShouldAllBe(cause => cause != null);
        page.GetProperty("standings").GetProperty("noChampion").GetBoolean().ShouldBeTrue();
        (await response.Content.ReadAsStringAsync(Cancellation)).ShouldNotContain("Venue flooded");
    }

    [Fact]
    [Trait("covers", "public-tournament-page: A withdrawal with a reason")]
    public async Task A_withdrawn_entrant_is_flagged_and_the_reason_appears_nowhere_on_the_page()
    {
        var (league, schedule) = await IndividualLeagueAsync();
        (await SettledAsync(() => DepartAsync(league, EntryOf(schedule, "Sam Reed"), "withdrawal", Revision(schedule), "Family emergency"))).StatusCode.ShouldBe(HttpStatusCode.OK);

        var response = await VisitAsync(league);
        var text = await response.Content.ReadAsStringAsync(Cancellation);
        var page = JsonDocument.Parse(text).RootElement;

        page.GetProperty("standings").GetProperty("rows").EnumerateArray().Single(row => row.GetProperty("name").GetString() == "Sam Reed")
            .GetProperty("status").GetString().ShouldBe("withdrawn");
        text.ShouldNotContain("Family emergency");
        text.ShouldNotContain(EntryOf(schedule, "Sam Reed").ToString());
    }

    [Fact]
    [Trait("covers", "public-tournament-page: A team tournament")]
    public async Task A_running_team_tournament_names_the_teams_and_no_roster_player()
    {
        var league = await OpenAsync("team");
        await TeamAsync(league, "River Falcons");
        await TeamAsync(league, "North Stars");
        await StartAsync(league);

        var text = await (await VisitAsync(league)).Content.ReadAsStringAsync(Cancellation);

        text.ShouldContain("River Falcons");
        text.ShouldContain("North Stars");
        text.ShouldNotContain("player 1");
    }

    [Fact]
    [Trait("covers", "public-tournament-page: A private tournament")]
    [Trait("covers", "public-tournament-page: Public to private")]
    public async Task A_private_a_draft_and_an_unknown_tournament_give_the_same_not_available_answer()
    {
        var league = await OpenAsync("individual");
        (await VisitAsync(league)).StatusCode.ShouldBe(HttpStatusCode.OK);
        (await ChangeVisibilityAsync(league, "private")).StatusCode.ShouldBe(HttpStatusCode.OK);
        var draft = Guid.NewGuid();
        (await league.Client.PostAsJsonAsync($"{league.Organisation}/tournaments", new { tournamentId = draft, configuration = Configuration("individual") }, Cancellation))
            .StatusCode.ShouldBe(HttpStatusCode.Created);

        var unknown = await NotAvailableOf(await api.Anonymous().GetAsync($"/api/public/tournaments/{Guid.NewGuid()}", Cancellation));

        unknown.ShouldBe((HttpStatusCode.NotFound, "no-store", "tournament-not-available", "This tournament is not available"));
        (await NotAvailableOf(await VisitAsync(league))).ShouldBe(unknown);
        (await NotAvailableOf(await api.Anonymous().GetAsync($"/api/public/tournaments/{draft}", Cancellation))).ShouldBe(unknown);
    }

    [Fact]
    [Trait("covers", "public-tournament-page: Private to public")]
    public async Task Before_making_a_private_tournament_public_the_owner_previews_its_title_dates_and_entrant_aliases()
    {
        var (league, _) = await IndividualLeagueAsync();
        (await ChangeVisibilityAsync(league, "private")).StatusCode.ShouldBe(HttpStatusCode.OK);

        var preview = await JsonAsync(await league.Client.GetAsync($"{league.Path}/public-preview", Cancellation));
        var other = await api.As(Guid.NewGuid()).GetAsync($"{league.Path}/public-preview", Cancellation);

        var page = preview.GetProperty("page");
        (page.GetProperty("title").GetString(), page.GetProperty("plannedStartAt").GetString()).ShouldBe(("Saturday League", "2026-11-14T10:00:00"));
        preview.GetProperty("aliases").EnumerateArray().Select(alias => alias.GetString()).ShouldBe(["Jamie Brook", "Robin Vale", "Sam Reed", "Taylor Finch"]);
        other.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await VisitAsync(league)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }
}
