using System.Net;
using Shouldly;

namespace Herald.Host.Tests;

[Collection(PostgresTests.Name)]
public class HealthTests(PostgresFixture postgres)
{
    // Nothing listens on port 1, so the database never answers.
    private const string UnreachableDatabase = "Host=localhost;Port=1;Database=herald;Username=herald;Password=herald;Timeout=2";

    [Fact]
    public async Task The_host_is_healthy_when_the_database_is_reachable()
    {
        await using var host = new HostFactory(postgres.ConnectionString);

        var response = await host.CreateClient().GetAsync("/health", TestContext.Current.CancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        (await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken)).ShouldBe("Healthy");
    }

    [Fact]
    public async Task The_host_is_unhealthy_but_alive_when_the_database_does_not_answer()
    {
        await using var host = new HostFactory(UnreachableDatabase);
        var client = host.CreateClient();

        var health = await client.GetAsync("/health", TestContext.Current.CancellationToken);
        var alive = await client.GetAsync("/alive", TestContext.Current.CancellationToken);

        health.StatusCode.ShouldBe(HttpStatusCode.ServiceUnavailable);
        alive.StatusCode.ShouldBe(HttpStatusCode.OK);
    }
}
