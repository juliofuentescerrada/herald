using Herald.Contracts.Competition.V1;
using Herald.Contracts.Registration.V1;
using Herald.Contracts.Standings.V1;
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
    [InlineData(typeof(TournamentStandingsChanged), "local://tournaments/")]
    [InlineData(typeof(TournamentArchiveChanged), "local://competition/")]
    public async Task An_integration_event_goes_to_its_consumers_durable_local_queue(Type integrationEvent, string queue)
    {
        await using var host = new HostFactory(postgres.ConnectionString);
        _ = host.CreateClient();
        var runtime = host.Services.GetRequiredService<IWolverineRuntime>();

        var route = runtime.RoutingFor(integrationEvent).Routes.OfType<MessageRoute>().ShouldHaveSingleItem();

        route.Uri.ShouldBe(new Uri(queue));
        runtime.Endpoints.EndpointFor(route.Uri)!.Mode.ShouldBe(EndpointMode.Durable);
    }

    [Theory]
    [InlineData(typeof(TournamentResultsChanged))]
    [InlineData(typeof(CompetitionFinalised))]
    [InlineData(typeof(CompetitionReopened))]
    public async Task Results_and_finalisation_facts_go_to_both_their_consumers_durable_local_queues(Type integrationEvent)
    {
        await using var host = new HostFactory(postgres.ConnectionString);
        _ = host.CreateClient();
        var runtime = host.Services.GetRequiredService<IWolverineRuntime>();

        var routes = runtime.RoutingFor(integrationEvent).Routes.OfType<MessageRoute>().Select(route => route.Uri).ToList();

        routes.ShouldBe([new Uri("local://tournaments/"), new Uri("local://standings/")], ignoreOrder: true);
    }

    [Fact]
    public async Task A_cancellation_goes_to_Registrations_and_Competitions_durable_local_queues()
    {
        await using var host = new HostFactory(postgres.ConnectionString);
        _ = host.CreateClient();
        var runtime = host.Services.GetRequiredService<IWolverineRuntime>();

        var routes = runtime.RoutingFor(typeof(TournamentCancelled)).Routes.OfType<MessageRoute>().Select(route => route.Uri).ToList();

        routes.ShouldBe([new Uri("local://registration/"), new Uri("local://competition/")], ignoreOrder: true);
    }
}
