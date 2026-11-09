using Herald.ModuleHosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Testcontainers.PostgreSql;

namespace Herald.ModuleHosting.Tests;

// A probe module's DbContext with one organisation-owned entity, the shape every module will use.
public sealed class ProbeDbContext(DbContextOptions<ProbeDbContext> options, OrganisationContext organisation)
    : OrganisationScopedDbContext(options, organisation)
{
    public const string Schema = "probe_isolation";

    public DbSet<ProbeNote> Notes => Set<ProbeNote>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.MapModule(Schema);
        OrganisationOwned<ProbeNote>(modelBuilder);
    }
}

public sealed class ProbeNote
{
    public Guid Id { get; init; } = Guid.NewGuid();

    public required string Text { get; set; }
}

public sealed class PostgresFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder("postgres:18.3").Build();

    public async ValueTask InitializeAsync()
    {
        await _container.StartAsync();
        await using var setUp = Scope(null);
        await setUp.Database.EnsureCreatedAsync();
    }

    public async ValueTask DisposeAsync() => await _container.DisposeAsync();

    public string ConnectionString => _container.GetConnectionString();

    // One DI scope per call, as one request or message has.
    public ProbeDbContext Scope(Guid? organisationId)
    {
        var services = new ServiceCollection()
            .AddOrganisationContext()
            .AddSingleton(NpgsqlDataSource.Create(ConnectionString))
            .AddDbContext<ProbeDbContext>((provider, options) => options.UseNpgsql(provider.GetRequiredService<NpgsqlDataSource>()))
            .BuildServiceProvider()
            .CreateScope().ServiceProvider;
        if (organisationId is { } id)
        {
            services.GetRequiredService<OrganisationContext>().Enter(id);
        }

        return services.GetRequiredService<ProbeDbContext>();
    }
}

[CollectionDefinition(Name)]
public sealed class PostgresTests : ICollectionFixture<PostgresFixture>
{
    public const string Name = "PostgreSQL";
}
