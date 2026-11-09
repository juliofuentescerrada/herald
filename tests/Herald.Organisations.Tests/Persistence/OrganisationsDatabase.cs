using Herald.ModuleHosting;
using Herald.Organisations.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Testcontainers.PostgreSql;

namespace Herald.Organisations.Tests.Persistence;

public sealed class OrganisationsDatabase : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder("postgres:18.3").Build();

    public async ValueTask InitializeAsync()
    {
        await _container.StartAsync();
        await using var setUp = Scope(null);
        await setUp.Database.MigrateAsync();
    }

    public async ValueTask DisposeAsync() => await _container.DisposeAsync();

    // One DI scope per call, as one request or message has.
    public OrganisationsDbContext Scope(Guid? organisationId)
    {
        var services = new ServiceCollection()
            .AddOrganisationContext()
            .AddDbContext<OrganisationsDbContext>(options => options.UseNpgsql(
                _container.GetConnectionString(),
                npgsql => npgsql.MigrationsHistoryTable("__EFMigrationsHistory", OrganisationsDbContext.Schema)))
            .BuildServiceProvider()
            .CreateScope().ServiceProvider;
        if (organisationId is { } id)
        {
            services.GetRequiredService<OrganisationContext>().Enter(id);
        }

        return services.GetRequiredService<OrganisationsDbContext>();
    }
}

[CollectionDefinition(Name)]
public sealed class OrganisationsDatabaseTests : ICollectionFixture<OrganisationsDatabase>
{
    public const string Name = "Organisations database";
}
