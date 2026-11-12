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
        (await SeededDatabases.CountAsync(database, """select count(*) from registration."RosterChanges" """)).ShouldBe(8);
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
