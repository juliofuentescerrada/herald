using Herald.Contracts.Registration.V1;
using Herald.Contracts.Tournaments.V1;
using Microsoft.Extensions.DependencyInjection;
using Shouldly;
using Wolverine.Configuration;
using Wolverine.Runtime;
using Wolverine.Runtime.Routing;

namespace Herald.Host.Tests;

[Collection(PostgresTests.Name)]
public class IntegrationEventRoutingTests(PostgresFixture postgres)
{
    [Theory]
    [InlineData(typeof(TournamentEntryTermsChanged), "local://registration/")]
    [InlineData(typeof(TournamentFieldChanged), "local://tournaments/")]
    public async Task An_integration_event_goes_to_its_consumers_durable_local_queue(Type integrationEvent, string queue)
    {
        await using var host = new HostFactory(postgres.ConnectionString);
        _ = host.CreateClient();
        var runtime = host.Services.GetRequiredService<IWolverineRuntime>();

        var route = runtime.RoutingFor(integrationEvent).Routes.OfType<MessageRoute>().ShouldHaveSingleItem();

        route.Uri.ShouldBe(new Uri(queue));
        runtime.Endpoints.EndpointFor(route.Uri)!.Mode.ShouldBe(EndpointMode.Durable);
    }
}
