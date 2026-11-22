using Herald.Contracts.Tournaments.V1;
using Microsoft.Extensions.DependencyInjection;
using Shouldly;
using Wolverine.AzureServiceBus;
using Wolverine.Configuration;
using Wolverine.Runtime;
using Wolverine.Runtime.Routing;

namespace Herald.Host.Tests;

[Collection(PostgresTests.Name)]
public class CloudRuntimeTests(PostgresFixture postgres)
{
    [Fact]
    [Trait("covers", "cloud-runtime: A host configured without a broker delivers an integration event")]
    public async Task A_host_configured_without_a_broker_routes_integration_events_through_durable_local_queues()
    {
        // No messaging connection string: configuring Service Bus would fail to start the host.
        await using var host = new HostFactory(postgres.ConnectionString, "Production");
        using var withoutBroker = host.WithWebHostBuilder(builder => builder
            .UseSetting("Herald:Messaging:Broker", "None")
            .UseSetting("ConnectionStrings:messaging", ""));
        _ = withoutBroker.CreateClient();
        var runtime = withoutBroker.Services.GetRequiredService<IWolverineRuntime>();

        var route = runtime.RoutingFor(typeof(TournamentEntryTermsChanged)).Routes.OfType<MessageRoute>().ShouldHaveSingleItem();

        route.Uri.ShouldBe(new Uri("local://registration/"));
        runtime.Endpoints.EndpointFor(route.Uri)!.Mode.ShouldBe(EndpointMode.Durable);
        runtime.Options.Transports.OfType<AzureServiceBusTransport>().ShouldBeEmpty();
    }

    [Fact]
    public void An_unknown_broker_stops_the_host()
    {
        using var host = new HostFactory(postgres.ConnectionString)
            .WithWebHostBuilder(builder => builder.UseSetting("Herald:Messaging:Broker", "Kafka"));

        Should.Throw<InvalidOperationException>(() => host.Server).Message.ShouldContain("Kafka");
    }
}
