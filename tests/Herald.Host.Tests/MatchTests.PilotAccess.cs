using System.Net;
using System.Net.Http.Json;
using Herald.ModuleHosting;
using Shouldly;

namespace Herald.Host.Tests;

// pilot-access: an application acting through its grant, on the matches of two leagues of one organisation.
public partial class MatchTests
{
    private sealed record Bot(HttpClient Client, Guid Grant);

    private async Task<Bot> GrantAsync(League league, Guid[]? tournaments, params string[] groups)
    {
        var (application, grant) = (Guid.NewGuid(), Guid.NewGuid());
        (await league.Client.PutAsJsonAsync($"{league.Organisation}/applications/{grant}",
            new { name = "Results bot", applicationId = application, tournaments, groups }, Cancellation)).StatusCode.ShouldBe(HttpStatusCode.OK);
        return new(api.AsApplication(application), grant);
    }

    private static Guid TournamentOf(League league) => Guid.Parse(league.Path[(league.Path.LastIndexOf('/') + 1)..]);

    private async Task<(League League, System.Text.Json.JsonElement Matches)> LeagueOfFourAsync(HttpClient? client = null, Guid? organisation = null)
    {
        var league = await OpenAsync("individual", client, organisation);
        foreach (var name in new[] { "Robin Vale", "Sam Reed", "Jamie Brook", "Taylor Finch" })
        {
            await EnterAsync(league, name);
        }

        return (league, (await StartAsync(league)).GetProperty("matches"));
    }

    private static async Task<HttpResponseMessage> BotResultAsync(Bot bot, string match, string outcome = "first") =>
        await bot.Client.PostAsJsonAsync($"{match}/result", new { operationId = Guid.NewGuid(), expectedRevision = 1, outcome }, Cancellation);

    [Fact]
    [Trait("covers", "pilot-access: Outside the grant")]
    public async Task An_application_granted_results_for_one_league_is_refused_in_another_without_its_content()
    {
        var (saturday, saturdayMatches) = await LeagueOfFourAsync();
        var organisation = Guid.Parse(saturday.Organisation[(saturday.Organisation.LastIndexOf('/') + 1)..]);
        var (sunday, sundayMatches) = await LeagueOfFourAsync(saturday.Client, organisation);
        var bot = await GrantAsync(saturday, [TournamentOf(saturday)], "read", "results");

        var allowed = await SettledAsync(() => BotResultAsync(bot, MatchPath(saturday, saturdayMatches[0])));
        var refused = await BotResultAsync(bot, MatchPath(sunday, sundayMatches[0]));
        var unread = await bot.Client.GetAsync(MatchPath(sunday, sundayMatches[0]), Cancellation);

        allowed.StatusCode.ShouldBe(HttpStatusCode.OK);
        refused.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
        var problem = await JsonAsync(refused);
        problem.GetProperty("type").GetString().ShouldBe(HeraldApi.OperationNotGranted);
        problem.GetProperty("detail").GetString().ShouldBe("The grant does not cover this tournament for the 'results' operations.");
        unread.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
        (await unread.Content.ReadAsStringAsync(Cancellation)).ShouldNotContain("Robin Vale");
        (await JsonAsync(await saturday.Client.GetAsync(MatchPath(sunday, sundayMatches[0]), Cancellation))).GetProperty("result").ValueKind
            .ShouldBe(System.Text.Json.JsonValueKind.Null);
    }

    [Fact]
    public async Task An_application_without_the_group_is_refused_naming_it_and_can_never_manage_grants()
    {
        var (league, matches) = await LeagueOfFourAsync();
        var bot = await GrantAsync(league, null, "read");

        var refused = await BotResultAsync(bot, MatchPath(league, matches[0]));
        var listed = await bot.Client.GetAsync($"{league.Organisation}/applications", Cancellation);
        var read = await bot.Client.GetAsync(MatchPath(league, matches[0]), Cancellation);

        refused.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
        (await JsonAsync(refused)).GetProperty("detail").GetString().ShouldBe("The grant does not include the 'results' operations.");
        listed.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
        read.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    public async Task An_application_granted_selected_tournaments_cannot_list_or_create_tournaments_or_reach_the_organisations_guests()
    {
        var (league, _) = await LeagueOfFourAsync();
        var bot = await GrantAsync(league, [TournamentOf(league)], "read", "setup");

        (await bot.Client.GetAsync($"{league.Organisation}/tournaments", Cancellation)).StatusCode.ShouldBe(HttpStatusCode.Forbidden);
        (await bot.Client.PostAsJsonAsync($"{league.Organisation}/tournaments",
            new { tournamentId = Guid.NewGuid(), configuration = new { title = "Bot Cup" } }, Cancellation)).StatusCode.ShouldBe(HttpStatusCode.Forbidden);
        (await bot.Client.GetAsync($"{league.Organisation}/guests?kind=player&name=Robin", Cancellation)).StatusCode.ShouldBe(HttpStatusCode.Forbidden);
        (await bot.Client.GetAsync(league.Path, Cancellation)).StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    [Trait("covers", "pilot-access: Another organisation")]
    public async Task An_application_reading_another_organisations_private_tournament_by_its_identifier_sees_the_generic_denial()
    {
        var (granting, _) = await LeagueOfFourAsync();
        var bot = await GrantAsync(granting, null, "read", "results");
        var owner = api.As(Guid.NewGuid());
        var organisation = Guid.NewGuid();
        await owner.CreateAsync(organisation, "Southside Gaming");
        var tournament = Guid.NewGuid();
        (await owner.PostAsJsonAsync($"/api/organisations/{organisation}/tournaments",
            new { tournamentId = tournament, configuration = new { title = "Private Cup", visibility = "private" } }, Cancellation)).StatusCode.ShouldBe(HttpStatusCode.Created);

        var response = await bot.Client.GetAsync($"/api/organisations/{organisation}/tournaments/{tournament}", Cancellation);

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await JsonAsync(response)).GetProperty("type").GetString().ShouldBe(HeraldApi.OrganisationNotAvailable);
    }

    [Fact]
    [Trait("covers", "pilot-access: After revocation")]
    [Trait("covers", "pilot-access: A result by an application")]
    public async Task After_revocation_the_application_is_refused_and_its_earlier_result_stays_attributed_to_it()
    {
        var (league, matches) = await LeagueOfFourAsync();
        var bot = await GrantAsync(league, null, "read", "results");
        var recorded = await JsonAsync(await SettledAsync(() => BotResultAsync(bot, MatchPath(league, matches[0]))));
        await league.Client.PostAsync($"{league.Organisation}/applications/{bot.Grant}/revocation", null, Cancellation);

        var after = await BotResultAsync(bot, MatchPath(league, matches[1]));
        var match = await JsonAsync(await league.Client.GetAsync(MatchPath(league, matches[0]), Cancellation));

        recorded.GetProperty("result").GetProperty("recordedBy").GetString().ShouldBe("Results bot (granted by Alex Morgan)");
        after.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        match.GetProperty("result").GetProperty("outcome").GetString().ShouldBe("first");
        match.GetProperty("result").GetProperty("recordedBy").GetString().ShouldBe("Results bot (granted by Alex Morgan)");
    }
}
