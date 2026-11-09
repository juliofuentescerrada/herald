using System.Reflection;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Wolverine.Http;

namespace Herald.ModuleHosting;

// The HTTP side every host of Herald modules shares: modules' Wolverine endpoints and their OpenAPI description.
public static class HeraldApi
{
    // Every endpoint declares exactly one of these with [EndpointGroupName]; each is its own OpenAPI document.
    public const string Public = "public";
    public const string Admin = "admin";
    public static readonly IReadOnlyList<string> Documents = [Public, Admin];

    public static IServiceCollection AddHeraldApi(this IServiceCollection services)
    {
        services.AddWolverineHttp();
        // Numbers are numbers: the web default also reads them from strings and describes them as `integer | string`.
        services.ConfigureHttpJsonOptions(options => options.SerializerOptions.NumberHandling = JsonNumberHandling.Strict);
        foreach (var document in Documents)
        {
            // By default .NET adds ungrouped endpoints to every document; here each holds only its group.
            services.AddOpenApi(document, options => options.ShouldInclude = description => description.GroupName == document);
        }

        return services;
    }

    public static WebApplication MapHeraldApi(this WebApplication app)
    {
        // Admin endpoints need an assigned organiser; public ones stay anonymous (ADR 0014).
        app.MapWolverineEndpoints(options => options.ConfigureEndpoints(chain =>
        {
            if (chain.Method.Method.GetCustomAttribute<EndpointGroupNameAttribute>()?.EndpointGroupName == Admin)
            {
                chain.Metadata.RequireAuthorization(HeraldAuthentication.OrganiserPolicy);
            }
        }));
        // Development only for now, like /health: what Azure exposes is decided in M4.
        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
        }

        return app;
    }
}
