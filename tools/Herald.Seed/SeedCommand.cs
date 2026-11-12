using Microsoft.Extensions.Configuration;

namespace Herald.Seed;

// The tool's checks in order: never production, then a main persona, then a connection string (D-6, D-3).
public static class SeedCommand
{
    public const int Refused = 2;

    public static async Task<int> RunAsync(IConfiguration configuration, TextWriter output, TextWriter error)
    {
        var environment = configuration["environment"] ?? configuration["DOTNET_ENVIRONMENT"] ?? configuration["ASPNETCORE_ENVIRONMENT"] ?? "Development";
        if (string.Equals(environment, "Production", StringComparison.OrdinalIgnoreCase))
        {
            await error.WriteLineAsync($"Refusing to seed: the environment is '{environment}'. Synthetic data never goes to production.");
            return Refused;
        }

        var personas = Personas.From(configuration);
        if (personas is null)
        {
            await output.WriteLineAsync("Seeding skipped: no main persona is configured (Herald:Seed:Personas:Main:DirectoryId and :ObjectId).");
            return 0;
        }

        var connectionString = configuration.GetConnectionString("herald");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            await error.WriteLineAsync("The 'herald' connection string is missing (ConnectionStrings__herald).");
            return 1;
        }

        try
        {
            foreach (var result in await Seeder.RunAsync(connectionString, personas, DateTimeOffset.UtcNow))
            {
                await output.WriteLineAsync(result.Outcome == ScenarioOutcome.Seeded ? $"seeded            {result.Name}" : $"already present   {result.Name}");
            }

            return 0;
        }
        catch (InvalidOperationException failure)
        {
            await error.WriteLineAsync(failure.Message);
            return 1;
        }
    }
}
