using Herald.Competition.Persistence;
using Herald.Host;
using Herald.ModuleHosting;
using Herald.Organisations.Persistence;
using Herald.Registration.Persistence;
using Herald.Standings.Persistence;
using Herald.Tournaments.Persistence;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace Herald.Seed;

// Drops Herald's own schemas before the host migrates and seeds again (m4-cloud-runtime D-6). Not the database: the
// migrator owns the schemas it created, so this needs no server privilege (Steward's ADR 0010).
public static class Reset
{
    // Read from the modules, so a new module's schema is not forgotten in a copied list.
    public static readonly IReadOnlyList<string> Schemas =
    [
        OrganisationsDbContext.Schema,
        TournamentsDbContext.Schema,
        RegistrationDbContext.Schema,
        CompetitionDbContext.Schema,
        StandingsDbContext.Schema,
        ModuleDatabase.MessageStoreSchema,
    ];

    public static async Task DropSchemasAsync(string connectionString, IConfiguration configuration)
    {
        // Signs in as the host does: a password locally, the slot's identity in a deployment.
        var builder = new NpgsqlDataSourceBuilder(connectionString);
        DatabaseAuthentication.Configure(builder, configuration);
        await using var dataSource = builder.Build();
        await using var command = dataSource.CreateCommand(string.Join("; ", Schemas.Select(schema => $"DROP SCHEMA IF EXISTS \"{schema}\" CASCADE")));
        await command.ExecuteNonQueryAsync();
    }
}
