using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Herald.ModuleHosting;

internal interface IModuleMigration
{
    Task ApplyAsync(IServiceProvider services, CancellationToken cancellation);
}

internal sealed class ModuleMigration<TDbContext> : IModuleMigration
    where TDbContext : DbContext
{
    public async Task ApplyAsync(IServiceProvider services, CancellationToken cancellation)
    {
        await using var scope = services.CreateAsyncScope();
        await scope.ServiceProvider.GetRequiredService<TDbContext>().Database.MigrateAsync(cancellation);
    }
}

// A hosted service, so commands such as `codegen write` that never start the host need no database.
internal sealed class ModuleMigrationsOnStartup(IServiceProvider services) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        foreach (var migration in services.GetServices<IModuleMigration>())
        {
            await migration.ApplyAsync(services, cancellationToken);
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}

public static class ModuleMigrations
{
    // Development only (m0-messaging design): elsewhere migrations are a deployment step.
    // Register it before UseWolverine, so modules' tables exist before any handler runs.
    public static IServiceCollection AddModuleMigrationsOnStartup(this IServiceCollection services) =>
        services.AddHostedService<ModuleMigrationsOnStartup>();
}
