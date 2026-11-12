namespace Herald.Seed;

public enum ScenarioOutcome
{
    Seeded,
    AlreadyPresent,
}

public sealed record ScenarioResult(string Name, ScenarioOutcome Outcome);

// Runs the scenarios in order against the target database.
public static class Seeder
{
    public static async Task<IReadOnlyList<ScenarioResult>> RunAsync(
        string connectionString, IReadOnlyDictionary<string, Persona> personas, DateTimeOffset now, IEnumerable<Scenario>? scenarios = null)
    {
        await using var seeding = new Seeding(connectionString);
        var clock = new Clock(now);
        var results = new List<ScenarioResult>();
        foreach (var scenario in scenarios ?? Scenarios.All)
        {
            var admin = new Admin(seeding, personas[scenario.PersonaKey]);
            if ((await admin.OwnedOrganisationsAsync()).Contains(scenario.OrganisationId))
            {
                results.Add(new(scenario.Name, ScenarioOutcome.AlreadyPresent));
                continue;
            }

            try
            {
                await admin.CreateOrganisationAsync(scenario.OrganisationId, scenario.OrganisationName);
                await scenario.Steps(admin, scenario.OrganisationId, clock);
            }
            catch (SeedStepException failure)
            {
                throw new InvalidOperationException($"Scenario '{scenario.Name}' failed. {failure.Message}", failure);
            }

            results.Add(new(scenario.Name, ScenarioOutcome.Seeded));
        }

        return results;
    }
}
