using System.Reflection;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
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

    // The same answer whether the organisation does not exist or the caller is not a member (ADR 0014).
    public const string OrganisationNotAvailable = "organisation-not-available";
    public static readonly IReadOnlyList<string> Documents = [Public, Admin];

    public static IServiceCollection AddHeraldApi(this IServiceCollection services)
    {
        services.AddWolverineHttp();
        services.AddOrganisationContext();
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
        // Runs after routing, authentication and authorisation, which WebApplication adds ahead of it.
        app.Use(EnterOrganisation);
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

    // Every organisation-scoped route names {organisationId}; membership is checked on every request, never cached.
    private static async Task EnterOrganisation(HttpContext http, RequestDelegate next)
    {
        if (http.GetRouteValue("organisationId") is string value)
        {
            var caller = Caller.From(http.User);
            var access = http.RequestServices.GetRequiredService<IOrganisationAccess>();
            if (!Guid.TryParse(value, out var organisationId) || caller is null
                || !await access.IsMemberAsync(organisationId, caller, http.RequestAborted))
            {
                await Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "Not found", type: OrganisationNotAvailable)
                    .ExecuteAsync(http);
                return;
            }

            http.RequestServices.GetRequiredService<OrganisationContext>().Enter(organisationId);
        }

        await next(http);
    }
}
