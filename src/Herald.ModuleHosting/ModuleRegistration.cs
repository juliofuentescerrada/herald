using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Wolverine;
using Wolverine.EntityFrameworkCore;

namespace Herald.ModuleHosting;

// The one way a module plugs into the host, so probe modules in tests are hosted like the real ones.
// It runs inside the host's UseWolverine: Wolverine applies extensions registered through DI only
// once the service collection is read-only, too late for a module's own services.
public static class ModuleRegistration
{
    public static WolverineOptions AddHeraldModule<TDbContext>(this WolverineOptions options, string schema)
        where TDbContext : DbContext
    {
        options.Discovery.IncludeAssembly(typeof(TDbContext).Assembly);
        options.Services.AddDbContextWithWolverineIntegration<TDbContext>((services, database) =>
            ModuleDatabase.Configure(database, services.GetRequiredService<NpgsqlDataSource>(), schema));
        options.Services.AddSingleton<IModuleMigration, ModuleMigration<TDbContext>>();
        return options;
    }
}
