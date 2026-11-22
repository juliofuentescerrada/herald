using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
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

    // An application's request outside what its grant allows (design D-4): names the group, never the tournament's content.
    public const string OperationNotGranted = "operation-not-granted";
    public static readonly IReadOnlyList<string> Documents = [Public, Admin];

    public static IServiceCollection AddHeraldApi(this IServiceCollection services)
    {
        services.AddWolverineHttp();
        services.AddOrganisationContext();
        services.AddScoped<PendingOperation>();
        // Numbers are numbers: the web default also reads them from strings and describes them as `integer | string`.
        services.ConfigureHttpJsonOptions(options => options.SerializerOptions.NumberHandling = JsonNumberHandling.Strict);
        // Enumerations travel as their names, which is also how the OpenAPI documents describe them.
        services.ConfigureHttpJsonOptions(options => options.SerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase)));
        foreach (var document in Documents)
        {
            // By default .NET adds ungrouped endpoints to every document; here each holds only its group.
            services.AddOpenApi(document, options =>
            {
                options.ShouldInclude = description => description.GroupName == document;
                options.AddOperationTransformer<ProblemTypesTransformer>();
            });
        }

        return services;
    }

    public static WebApplication MapHeraldApi(this WebApplication app)
    {
        // Runs after routing, authentication and authorisation, which WebApplication adds ahead of it.
        app.Use(EnterOrganisation);
        // Admin endpoints need an assigned organiser; public ones stay anonymous (ADR 0014).
        app.MapWolverineEndpoints(options =>
        {
            // The request's scope, where the membership step entered the organisation; Wolverine's default is a new scope.
            options.ServiceProviderSource = ServiceProviderSource.FromHttpContextRequestServices;
            options.AddPolicy<ReceiptPolicy>();
            options.ConfigureEndpoints(chain =>
            {
                if (chain.Method.Method.GetCustomAttribute<EndpointGroupNameAttribute>()?.EndpointGroupName == Admin)
                {
                    chain.Metadata.RequireAuthorization(HeraldAuthentication.OrganiserPolicy);
                }

                // For the access step, which reads them from the endpoint to check an application's grant, and for the OpenAPI documents.
                foreach (var attribute in chain.Method.Method.GetCustomAttributes()
                    .Where(attribute => attribute is OperationGroupAttribute or PeopleOnlyAttribute or ProblemTypesAttribute))
                {
                    chain.Metadata.WithMetadata(attribute);
                }

                // Every receipt-carrying mutation can answer `operation-reused` (operation-receipts), so each describes a conflict.
                if (chain.Postprocessors.OfType<JasperFx.CodeGeneration.Frames.MethodCall>().Any(call => call.HandlerType == typeof(Receipts))
                    && !chain.Method.Method.GetCustomAttributes<ProducesResponseTypeAttribute>().Any(produces => produces.StatusCode == StatusCodes.Status409Conflict))
                {
                    chain.Metadata.Produces<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json");
                }

                // An application outside its grant is refused (design D-4): part of each grouped endpoint's contract.
                if (chain.Method.Method.GetCustomAttribute<OperationGroupAttribute>() is not null)
                {
                    chain.Metadata.Produces<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json");
                }
            });
        });
        app.MapGet("/api/organisations/{organisationId}/receipts/{operationId}", Receipts.ReadAsync)
            .RequireAuthorization(HeraldAuthentication.OrganiserPolicy)
            .Produces<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json");
        // Development only for now, like /health: what Azure exposes is decided in M4.
        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
        }

        return app;
    }

    // Every organisation-scoped route names {organisationId}; access is checked on every request, never cached, so a removed
    // membership or a revoked grant stops the next request.
    private static async Task EnterOrganisation(HttpContext http, RequestDelegate next)
    {
        var caller = Caller.From(http.User);
        if (http.GetRouteValue("organisationId") is string value)
        {
            var access = http.RequestServices.GetRequiredService<IOrganisationAccess>();
            if (!Guid.TryParse(value, out var organisationId) || caller is null
                || await access.FindAccessAsync(organisationId, caller, http.RequestAborted) is not { } found)
            {
                await Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "Not found", type: OrganisationNotAvailable)
                    .ExecuteAsync(http);
                return;
            }

            if (found.Grant is { } grant && Refusal(http, grant) is { } refusal)
            {
                await NotGranted(http, refusal);
                return;
            }

            http.RequestServices.GetRequiredService<OrganisationContext>().Enter(organisationId, found.ActorId, found.Grant, found.Name);
            var endpoint = http.GetEndpoint()?.Metadata;
            if (Receipts.IsMutation(http, endpoint?.GetMetadata<IEndpointGroupNameMetadata>()?.EndpointGroupName))
            {
                await WithReceiptAsync(http, next, endpoint?.GetMetadata<IEndpointNameMetadata>()?.EndpointName ?? http.Request.Path);
                return;
            }
        }
        else if (caller?.Kind == CallerKind.Application && IsAdmin(http))
        {
            // Creating an organisation and a person's own details are a person's (design D-1).
            await NotGranted(http, "An application acts only within an organisation that granted it access.");
            return;
        }

        await next(http);
    }

    // Why an application's request falls outside its grant, or null when the grant allows it (design D-4). Never names the
    // tournament: the refusal must not tell an application anything about one it was not granted.
    private static string? Refusal(HttpContext http, Grant grant)
    {
        var metadata = http.GetEndpoint()?.Metadata;
        if (metadata?.GetMetadata<OperationGroupAttribute>() is not { } declared || metadata.GetMetadata<PeopleOnlyAttribute>() is not null)
        {
            return "Applications cannot perform this operation.";
        }

        var group = JsonNamingPolicy.CamelCase.ConvertName(declared.Group.ToString());
        if (!grant.Groups.Contains(declared.Group))
        {
            return $"The grant does not include the '{group}' operations.";
        }

        var outside = http.GetRouteValue("tournamentId") is string value
            ? grant.Tournaments is { } tournaments && (!Guid.TryParse(value, out var tournament) || !tournaments.Contains(tournament))
            : declared.AllTournaments && grant.Tournaments is not null;
        return outside ? $"The grant does not cover this tournament for the '{group}' operations." : null;
    }

    // A mutation with an operation identity answers from its receipt when it has one (operation-receipts).
    private static async Task WithReceiptAsync(HttpContext http, RequestDelegate next, string operation)
    {
        if (await Receipts.BeforeAsync(http, operation) is { } answer)
        {
            await answer.ExecuteAsync(http);
            return;
        }

        try
        {
            await next(http);
        }
        catch (DbUpdateException)
        {
            if (await Receipts.AfterFailureAsync(http) is not { } replay)
            {
                throw;
            }

            await replay.ExecuteAsync(http);
        }
    }

    private static bool IsAdmin(HttpContext http) =>
        http.GetEndpoint()?.Metadata.GetMetadata<IEndpointGroupNameMetadata>()?.EndpointGroupName == Admin;

    private static Task NotGranted(HttpContext http, string detail) =>
        Results.Problem(statusCode: StatusCodes.Status403Forbidden, title: "Forbidden", type: OperationNotGranted, detail: detail)
            .ExecuteAsync(http);
}
