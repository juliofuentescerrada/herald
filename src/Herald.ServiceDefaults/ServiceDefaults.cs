using Azure.Monitor.OpenTelemetry.Exporter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using OpenTelemetry;
using OpenTelemetry.Metrics;
using OpenTelemetry.Trace;

namespace Herald.ServiceDefaults;

public static class ServiceDefaults
{
    private const string LiveTag = "live";

    // Set by Azure hosting; their presence means a deployment.
    private static readonly string[] _hostingMarkers = ["CONTAINER_APP_NAME", "WEBSITE_SITE_NAME"];

    /// <summary>The Azure hosting marker this configuration carries, or null outside a deployment.</summary>
    public static string? HostingMarker(IConfiguration configuration) =>
        _hostingMarkers.FirstOrDefault(name => !string.IsNullOrEmpty(configuration[name]));

    public static TBuilder AddServiceDefaults<TBuilder>(this TBuilder builder)
        where TBuilder : IHostApplicationBuilder
    {
        builder.Logging.AddOpenTelemetry(logging =>
        {
            logging.IncludeFormattedMessage = true;
            logging.IncludeScopes = true;
        });

        var telemetry = builder.Services.AddOpenTelemetry()
            .WithMetrics(metrics => metrics
                .AddAspNetCoreInstrumentation()
                .AddHttpClientInstrumentation()
                .AddRuntimeInstrumentation())
            .WithTracing(tracing => tracing
                .AddSource(builder.Environment.ApplicationName)
                .AddAspNetCoreInstrumentation()
                .AddHttpClientInstrumentation());

        // Aspire sets the endpoint locally; without it (tests) nothing is exported.
        if (!string.IsNullOrWhiteSpace(builder.Configuration["OTEL_EXPORTER_OTLP_ENDPOINT"]))
        {
            telemetry.UseOtlpExporter();
        }

        // A deployed slot exports to Application Insights, traces sampled (m4-cloud-runtime D-4); logs and metrics are not.
        if (builder.Configuration["APPLICATIONINSIGHTS_CONNECTION_STRING"] is { Length: > 0 } connectionString)
        {
            var ratio = builder.Configuration.GetValue("Herald:Telemetry:TraceSampleRatio", 1.0);
            telemetry
                .WithTracing(tracing => tracing
                    .AddAzureMonitorTraceExporter(options => options.ConnectionString = connectionString)
                    // After the exporter, which sets its own rate-limited sampler: the last sampler set wins.
                    .SetSampler(new ParentBasedSampler(new TraceIdRatioBasedSampler(ratio))))
                .WithMetrics(metrics => metrics.AddAzureMonitorMetricExporter(options => options.ConnectionString = connectionString));
            builder.Logging.AddOpenTelemetry(logging => logging.AddAzureMonitorLogExporter(options =>
            {
                options.ConnectionString = connectionString;
                // Otherwise logs of unsampled traces are dropped with them.
                options.EnableTraceBasedLogsSampler = false;
            }));
        }

        builder.Services.AddHealthChecks()
            .AddCheck("self", () => HealthCheckResult.Healthy(), [LiveTag]);

        builder.Services.AddServiceDiscovery();
        builder.Services.ConfigureHttpClientDefaults(http =>
        {
            http.AddStandardResilienceHandler();
            http.AddServiceDiscovery();
        });

        return builder;
    }

    public static WebApplication MapDefaultEndpoints(this WebApplication app)
    {
        // The end-to-end suite (E2E) waits on /health before its journeys; Container Apps probes a deployed slot
        // (m4-cloud-runtime D-3). The OpenAPI documents stay Development-only.
        if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("E2E") || HostingMarker(app.Configuration) is not null)
        {
            app.MapHealthChecks("/health");
            app.MapHealthChecks("/alive", new HealthCheckOptions
            {
                Predicate = check => check.Tags.Contains(LiveTag),
            });
        }

        return app;
    }
}
