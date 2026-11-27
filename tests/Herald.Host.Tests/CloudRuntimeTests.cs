using System.Net;
using System.Reflection;
using Herald.Contracts.Tournaments.V1;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using OpenTelemetry.Metrics;
using OpenTelemetry.Trace;
using Shouldly;
using Wolverine.AzureServiceBus;
using Wolverine.Configuration;
using Wolverine.Runtime;
using Wolverine.Tracking;

namespace Herald.Host.Tests;

[Collection(PostgresTests.Name)]
public class CloudRuntimeTests(PostgresFixture postgres)
{
    [Fact]
    [Trait("covers", "cloud-runtime: A host configured without a broker delivers an integration event")]
    public async Task A_host_configured_without_a_broker_delivers_an_integration_event_through_its_durable_local_queue()
    {
        // No messaging connection string: configuring Service Bus would fail to start the host.
        await using var host = new HostFactory(postgres.ConnectionString, "Production");
        using var withoutBroker = host.WithWebHostBuilder(builder => builder
            .UseSetting("Herald:Messaging:Broker", "None")
            .UseSetting("ConnectionStrings:messaging", ""));
        _ = withoutBroker.CreateClient();
        var runtime = withoutBroker.Services.GetRequiredService<IWolverineRuntime>();
        var terms = new TournamentEntryTermsChanged(Guid.NewGuid(), Guid.NewGuid(), 1, RegistrationState.Open, 8, EntryKind.Individual, Admission.Automatic);

        var session = await withoutBroker.Services.GetRequiredService<IHost>().TrackActivity().PublishMessageAndWaitAsync(terms);

        session.Executed.SingleEnvelope<TournamentEntryTermsChanged>().Destination.ShouldBe(new Uri("local://registration/"));
        runtime.Endpoints.EndpointFor(new Uri("local://registration/"))!.Mode.ShouldBe(EndpointMode.Durable);
        runtime.Options.Transports.OfType<AzureServiceBusTransport>().ShouldBeEmpty();
    }

    [Fact]
    [Trait("covers", "cloud-runtime: Health endpoints in a deployment")]
    public async Task A_deployed_host_answers_its_probes_and_hides_its_OpenAPI_documents()
    {
        await using var host = new HostFactory(postgres.ConnectionString, "Production");
        using var deployed = host.WithWebHostBuilder(builder => builder.UseSetting("CONTAINER_APP_NAME", "ca-herald-api"));
        var client = deployed.CreateClient();
        var cancellation = TestContext.Current.CancellationToken;

        (await client.GetAsync("/alive", cancellation)).StatusCode.ShouldBe(HttpStatusCode.OK);
        (await client.GetAsync("/health", cancellation)).StatusCode.ShouldBe(HttpStatusCode.OK);
        (await client.GetAsync("/openapi/admin.json", cancellation)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    [Trait("covers", "cloud-runtime: Traces are sampled at the configured ratio")]
    public async Task With_Application_Insights_the_host_samples_traces_at_the_configured_ratio()
    {
        await using var host = new HostFactory(postgres.ConnectionString, "Production");
        using var exporting = host.WithWebHostBuilder(builder => builder
            .UseSetting("APPLICATIONINSIGHTS_CONNECTION_STRING", "InstrumentationKey=00000000-0000-0000-0000-000000000000;IngestionEndpoint=http://localhost:9/")
            .UseSetting("Herald:Telemetry:TraceSampleRatio", "0.25"));
        _ = exporting.CreateClient();
        var tracer = exporting.Services.GetRequiredService<TracerProvider>();

        // The SDK keeps its sampler internal; its description names the policy and the ratio.
        var sampler = (Sampler)tracer.GetType().GetProperty("Sampler", BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public)!.GetValue(tracer)!;

        sampler.ShouldBeOfType<ParentBasedSampler>();
        sampler.Description.ShouldContain("TraceIdRatioBasedSampler{0.250000}");

        // Metrics and logs are exported too, with no sampler of their own. The log exporter's trace-based sampling,
        // switched off in ServiceDefaults, lives in options the SDK builds internally, so it is not observable here.
        exporting.Services.GetService<MeterProvider>().ShouldNotBeNull();
        exporting.Services.GetServices<ILoggerProvider>().ShouldContain(provider => provider.GetType().Name == "OpenTelemetryLoggerProvider");
    }

    [Fact]
    public void An_unknown_broker_stops_the_host()
    {
        using var host = new HostFactory(postgres.ConnectionString)
            .WithWebHostBuilder(builder => builder.UseSetting("Herald:Messaging:Broker", "Kafka"));

        Should.Throw<InvalidOperationException>(() => host.Server).Message.ShouldContain("Kafka");
    }
}
