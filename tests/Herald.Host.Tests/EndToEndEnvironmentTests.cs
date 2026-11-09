using System.Net;
using Shouldly;

namespace Herald.Host.Tests;

[Collection(PostgresTests.Name)]
public class EndToEndEnvironmentTests(PostgresFixture postgres)
{
    [Fact]
    public async Task The_end_to_end_environment_runs_without_a_message_broker()
    {
        await using var host = new HostFactory(postgres.ConnectionString, HostEnvironments.EndToEnd);
        using var withoutBroker = host.WithWebHostBuilder(builder => builder.UseSetting("ConnectionStrings:messaging", ""));

        var response = await withoutBroker.CreateClient().GetAsync("/health", TestContext.Current.CancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Theory]
    [InlineData("CONTAINER_APP_NAME")]
    [InlineData("WEBSITE_SITE_NAME")]
    public void The_end_to_end_environment_refuses_to_start_in_a_deployment(string marker)
    {
        using var host = new HostFactory(postgres.ConnectionString, HostEnvironments.EndToEnd)
            .WithWebHostBuilder(builder => builder.UseSetting(marker, "herald"));

        Should.Throw<InvalidOperationException>(() => host.Server).Message.ShouldContain(marker);
    }
}
