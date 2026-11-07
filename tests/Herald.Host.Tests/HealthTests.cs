using System.Net;
using Npgsql;
using Shouldly;
using Testcontainers.PostgreSql;

namespace Herald.Host.Tests;

[Collection(PostgresTests.Name)]
public class HealthTests(PostgresFixture postgres)
{
    [Fact]
    public async Task The_host_is_healthy_when_the_database_is_reachable()
    {
        await using var host = new HostFactory(postgres.ConnectionString);

        var response = await host.CreateClient().GetAsync("/health", TestContext.Current.CancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        (await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken)).ShouldBe("Healthy");
    }

    [Fact]
    public async Task The_host_is_unhealthy_but_alive_when_the_database_stops_answering()
    {
        // Its own database: pausing the shared one would break the other tests.
        await using var database = new PostgreSqlBuilder("postgres:18.3").Build();
        await database.StartAsync(TestContext.Current.CancellationToken);
        var connectionString = new NpgsqlConnectionStringBuilder(database.GetConnectionString()) { Timeout = 2, CommandTimeout = 2 }.ConnectionString;
        await using var host = new HostFactory(connectionString);
        var client = host.CreateClient();
        (await client.GetAsync("/health", TestContext.Current.CancellationToken)).StatusCode.ShouldBe(HttpStatusCode.OK);

        await database.PauseAsync(TestContext.Current.CancellationToken);
        try
        {
            var health = await client.GetAsync("/health", TestContext.Current.CancellationToken);
            var alive = await client.GetAsync("/alive", TestContext.Current.CancellationToken);

            health.StatusCode.ShouldBe(HttpStatusCode.ServiceUnavailable);
            alive.StatusCode.ShouldBe(HttpStatusCode.OK);
        }
        finally
        {
            await database.UnpauseAsync(TestContext.Current.CancellationToken);
        }
    }
}
