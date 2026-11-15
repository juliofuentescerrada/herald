using Herald.Seed;
using Microsoft.Extensions.Configuration;
using Shouldly;

namespace Herald.Seed.Tests;

// The synthetic-data spec: data made through the endpoints, deterministic, owned by personas, safe to repeat.
[Collection(SeededDatabasesTests.Name)]
public class SyntheticDataTests(SeededDatabases databases)
{
    private static Persona Main => SeededDatabases.Personas[Personas.Main];

    private static Persona Rival => SeededDatabases.Personas[Personas.Rival];

    private static Guid Organisation(string scenario) => Scenarios.All.Single(candidate => candidate.Name == scenario).OrganisationId;

    private static string Tournament(string scenario, string key) =>
        $"/api/organisations/{Organisation(scenario)}/tournaments/{Ids.For("tournament", key)}";

    [Fact]
    [Trait("covers", "synthetic-data: A seeded team tournament reaches Registration")]
    public async Task A_seeded_team_tournament_reaches_registration_with_rosters_recorded_by_the_persona()
    {
        var database = await databases.NewDatabaseAsync();
        await SeededDatabases.SeedAsync(database);

        await using var reader = new Reader(database);
        var field = await reader.GetAsync(Main, $"{Tournament("tournaments-by-state", "teams")}/entries");
        var readiness = field.GetProperty("entries").EnumerateArray().Select(entry => entry.GetProperty("rosterReadiness").GetString()).ToList();
        readiness.Count(state => state == "complete").ShouldBe(2);
        readiness.Count(state => state == "incomplete").ShouldBe(2);
        // Herald records its own person identifier as the actor: every roster change is by whoever entered the teams.
        (await SeededDatabases.CountAsync(database, """
            select count(*) from registration."RosterChanges" change
            join registration."Entries" entry on entry."Id" = change."EntryId"
            where change."ChangedBy" <> entry."EnteredBy"
            """)).ShouldBe(0);
        // Eight in the team league, eight in the cup, fourteen in the running league and fourteen in the running cup.
        (await SeededDatabases.CountAsync(database, """select count(*) from registration."RosterChanges" """)).ShouldBe(44);
    }

    [Fact]
    public async Task The_seeded_running_league_has_a_scheduled_match_between_two_frozen_rosters_of_seven()
    {
        var database = await databases.NewDatabaseAsync();
        await SeededDatabases.SeedAsync(database);

        await using var reader = new Reader(database);
        var path = Tournament("tournaments-by-state", "running-teams");
        var match = (await reader.GetAsync(Main, $"{path}/schedule")).GetProperty("matches").EnumerateArray().ShouldHaveSingleItem();
        var details = await reader.GetAsync(Main, $"{path}/matches/{match.GetProperty("matchId").GetGuid()}");

        details.GetProperty("state").GetString().ShouldBe("scheduled");
        details.GetProperty("activePlayers").GetInt32().ShouldBe(5);
        details.GetProperty("first").GetProperty("roster").GetArrayLength().ShouldBe(7);
        details.GetProperty("second").GetProperty("roster").GetArrayLength().ShouldBe(7);
    }

    [Fact]
    public async Task The_seeded_individual_league_is_running_with_two_matches_won_and_shared_positions()
    {
        var database = await databases.NewDatabaseAsync();
        await SeededDatabases.SeedAsync(database);

        await using var reader = new Reader(database);
        var league = Tournament("tournaments-by-state", "running-players");
        var matches = (await reader.GetAsync(Main, $"{league}/schedule")).GetProperty("matches").EnumerateArray().ToList();
        var standings = await reader.GetAsync(Main, $"{league}/standings");

        matches.Count.ShouldBe(6);
        matches[0].GetProperty("result").GetProperty("outcome").GetString().ShouldBe("first");
        matches.Count(match => match.GetProperty("state").GetString() == "resolved").ShouldBe(2);
        standings.GetProperty("rows").EnumerateArray()
            .Select(row => (row.GetProperty("position").GetInt32(), row.GetProperty("entrant").GetProperty("name").GetString(), row.GetProperty("points").GetInt32()))
            .ShouldBe([(1, "Ada Fenwick", 3), (1, "Dario Venn", 3), (3, "Bram Holloway", 0), (3, "Cleo Marsh", 0)]);
    }

    [Fact]
    public async Task The_seeded_running_cup_has_a_sanctioned_starter_and_the_running_trophy_a_withdrawn_player()
    {
        var database = await databases.NewDatabaseAsync();
        await SeededDatabases.SeedAsync(database);

        await using var reader = new Reader(database);
        var cup = await reader.GetAsync(Main, $"{Tournament("tournaments-by-state", "running-operations-teams")}/schedule");
        var trophy = await reader.GetAsync(Main, $"{Tournament("tournaments-by-state", "running-operations-players")}/schedule");

        var attention = cup.GetProperty("operations").GetProperty("attention").EnumerateArray().ShouldHaveSingleItem();
        (attention.GetProperty("entrant").GetProperty("name").GetString(), attention.GetProperty("player").GetProperty("name").GetString()).ShouldBe(("Copper Owls", "Ada Fenwick"));
        trophy.GetProperty("entrants").EnumerateArray().Select(entrant => (entrant.GetProperty("name").GetString(), entrant.GetProperty("status").GetString()))
            .ShouldBe([("Kira Dunmore", "active"), ("Lior Ashby", "withdrawn"), ("Mara Quill", "active"), ("Nils Brandt", "active")]);
        trophy.GetProperty("operations").GetProperty("rounds")[0].GetProperty("state").GetString().ShouldBe("completed");
        trophy.GetProperty("operations").GetProperty("resolved").GetInt32().ShouldBe(4);
    }

    [Fact]
    public async Task The_seeded_exceptional_league_has_one_match_of_each_cause()
    {
        var database = await databases.NewDatabaseAsync();
        await SeededDatabases.SeedAsync(database);

        await using var reader = new Reader(database);
        var matches = (await reader.GetAsync(Main, $"{Tournament("tournaments-by-state", "running-exceptional")}/schedule")).GetProperty("matches").EnumerateArray().ToList();

        matches.Take(4).Select(match => match.GetProperty("result").GetProperty("cause").GetString()).ShouldBe(["concession", "singleAbsence", "doubleAbsence", "noContest"]);
        matches.Skip(4).ShouldAllBe(match => match.GetProperty("state").GetString() == "scheduled");
    }

    [Fact]
    public async Task The_seeded_cup_has_its_schedule_published_and_its_start_blocked_by_one_roster()
    {
        var database = await databases.NewDatabaseAsync();
        await SeededDatabases.SeedAsync(database);

        await using var reader = new Reader(database);
        var start = (await reader.GetAsync(Main, Tournament("tournaments-by-state", "cup"))).GetProperty("start");

        start.GetProperty("conditions").EnumerateArray().Where(condition => !condition.GetProperty("met").GetBoolean())
            .Select(condition => condition.GetProperty("rule").GetString()).ShouldBe(["rosters-within-bounds"]);
        start.GetProperty("rostersOutsideBounds")[0].GetProperty("teamName").GetString().ShouldBe("Granite Herons");
    }

    [Fact]
    [Trait("covers", "synthetic-data: The tool finishes only when the outbox is empty")]
    public async Task Seeding_finishes_with_no_integration_event_left_pending()
    {
        var database = await databases.NewDatabaseAsync();
        await SeededDatabases.SeedAsync(database);

        (await SeededDatabases.CountAsync(database, "select count(*) from wolverine.wolverine_outgoing_envelopes")).ShouldBe(0);
        (await SeededDatabases.CountAsync(database, "select count(*) from wolverine.wolverine_incoming_envelopes where status <> 'Handled'")).ShouldBe(0);
    }

    [Fact]
    [Trait("covers", "synthetic-data: The same scenario seeded twice on fresh databases")]
    public async Task The_same_scenarios_on_two_fresh_databases_produce_the_same_data()
    {
        var first = await databases.NewDatabaseAsync();
        var second = await databases.NewDatabaseAsync();
        await SeededDatabases.SeedAsync(first);
        await SeededDatabases.SeedAsync(second);

        const string Guests = """select "Id" || ' ' || "Name" from registration."Guests" order by 1""";
        const string Entries = """select "Id" || ' ' || "State" from registration."Entries" order by 1""";
        (await SeededDatabases.ColumnAsync(second, Guests)).ShouldBe(await SeededDatabases.ColumnAsync(first, Guests));
        (await SeededDatabases.ColumnAsync(second, Entries)).ShouldBe(await SeededDatabases.ColumnAsync(first, Entries));
    }

    [Fact]
    [Trait("covers", "synthetic-data: An open registration stays open")]
    public async Task An_open_registration_is_open_and_closes_after_the_time_of_seeding()
    {
        var database = await databases.NewDatabaseAsync();
        await SeededDatabases.SeedAsync(database);

        await using var reader = new Reader(database);
        var tournament = await reader.GetAsync(Main, Tournament("tournaments-by-state", "open"));
        tournament.GetProperty("registration").GetString().ShouldBe("open");
        DateTime.Parse(tournament.GetProperty("configuration").GetProperty("registrationClosesAt").GetString()!, System.Globalization.CultureInfo.InvariantCulture)
            .ShouldBeGreaterThan(SeededDatabases.Now.UtcDateTime);
    }

    [Fact]
    [Trait("covers", "synthetic-data: Signing in as the seeded persona")]
    [Trait("covers", "synthetic-data: Isolation between personas")]
    public async Task The_main_persona_owns_its_organisations_and_cannot_read_the_rivals()
    {
        var database = await databases.NewDatabaseAsync();
        await SeededDatabases.SeedAsync(database);

        await using var reader = new Reader(database);
        var me = await reader.GetAsync(Main, "/api/me");
        me.GetProperty("organisations").EnumerateArray().Select(organisation => organisation.GetProperty("id").GetGuid())
            .ShouldBe([Organisation("empty-organisation"), Organisation("tournaments-by-state")], ignoreOrder: true);
        (await reader.GetAsync(Main, Tournament("second-organisation", "rival-open"))).TryGetProperty("revision", out _).ShouldBeFalse();
        (await reader.GetAsync(Rival, Tournament("second-organisation", "rival-open"))).GetProperty("registration").GetString().ShouldBe("open");
    }

    [Fact]
    [Trait("covers", "synthetic-data: Seeding a database that is already seeded")]
    [Trait("covers", "local-environment: Starting the AppHost again on a kept volume")]
    public async Task Seeding_a_seeded_database_skips_every_scenario_and_changes_nothing()
    {
        var database = await databases.NewDatabaseAsync();
        await SeededDatabases.SeedAsync(database);
        var entries = await SeededDatabases.CountAsync(database, """select count(*) from registration."Entries" """);

        var again = await SeededDatabases.SeedAsync(database);

        again.ShouldAllBe(result => result.Outcome == ScenarioOutcome.AlreadyPresent);
        (await SeededDatabases.CountAsync(database, """select count(*) from registration."Entries" """)).ShouldBe(entries);
    }

    [Fact]
    [Trait("covers", "synthetic-data: An endpoint change breaks a scenario")]
    public async Task A_step_the_endpoints_reject_fails_the_seeding_and_names_its_scenario_and_step()
    {
        var database = await databases.NewDatabaseAsync();
        Scenario[] broken = [new("broken", Personas.Main, "Broken Club", (admin, organisation, _) => admin.PublishAsync(organisation, Guid.NewGuid()))];

        var failure = await Should.ThrowAsync<InvalidOperationException>(() => Seeder.RunAsync(database, SeededDatabases.Personas, SeededDatabases.Now, broken));

        failure.Message.ShouldContain("Scenario 'broken' failed");
        failure.Message.ShouldContain("Could not read a tournament: 404");
    }

    [Fact]
    [Trait("covers", "local-environment: Starting the AppHost without personas")]
    public async Task Without_a_main_persona_the_seeding_reports_that_it_was_skipped_and_succeeds()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?> { ["ConnectionStrings:herald"] = "Host=unreachable.invalid" }).Build();
        using var output = new StringWriter();
        using var error = new StringWriter();

        (await SeedCommand.RunAsync(configuration, output, error)).ShouldBe(0);
        output.ToString().ShouldContain("Seeding skipped: no main persona is configured");
    }

    [Fact]
    [Trait("covers", "synthetic-data: Production refused")]
    public async Task Production_is_refused_before_any_connection()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["environment"] = "Production",
            ["ConnectionStrings:herald"] = "Host=unreachable.invalid;Database=herald",
            ["Herald:Seed:Personas:Main:DirectoryId"] = Main.DirectoryId.ToString(),
            ["Herald:Seed:Personas:Main:ObjectId"] = Main.ObjectId.ToString(),
        }).Build();
        using var output = new StringWriter();
        using var error = new StringWriter();

        (await SeedCommand.RunAsync(configuration, output, error)).ShouldBe(SeedCommand.Refused);
        error.ToString().ShouldContain("Production");
    }
}
