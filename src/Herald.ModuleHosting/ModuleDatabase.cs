using Microsoft.EntityFrameworkCore;
using Npgsql;
using Wolverine.EntityFrameworkCore;

namespace Herald.ModuleHosting;

// A module's DbContext keeps its state in its own schema and its envelopes in the shared message store.
public static class ModuleDatabase
{
    // Wolverine 6.62.0 cannot keep envelopes per module (m0-messaging design), so every module shares this store.
    public const string MessageStoreSchema = "wolverine";

    private const string MigrationsHistoryTable = "__EFMigrationsHistory";

    public static void MapModule(this ModelBuilder modelBuilder, string schema)
    {
        modelBuilder.HasDefaultSchema(schema);
        // Explicit, so the design-time model and its migrations match the runtime one.
        modelBuilder.MapWolverineEnvelopeStorage(MessageStoreSchema);
    }

    public static DbContextOptions<TDbContext> DesignTimeOptions<TDbContext>(string schema)
        where TDbContext : DbContext =>
        new DbContextOptionsBuilder<TDbContext>()
            .UseNpgsql("Host=localhost", npgsql => npgsql.MigrationsHistoryTable(MigrationsHistoryTable, schema))
            .Options;

    internal static void Configure(DbContextOptionsBuilder database, NpgsqlDataSource dataSource, string schema) =>
        database.UseNpgsql(dataSource, npgsql => npgsql.MigrationsHistoryTable(MigrationsHistoryTable, schema));
}
