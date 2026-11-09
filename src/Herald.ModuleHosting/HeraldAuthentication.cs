using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Herald.ModuleHosting;

// Admin callers present a token from the External ID directory for Herald's API (ADR 0014).
public static class HeraldAuthentication
{
    public const string OrganiserPolicy = "organiser";

    // The policy also requires `tid` and `oid` as identifiers, so an admin endpoint always has a Caller.
    // The application role that assignment to Herald's API grants: no role, no admin endpoint.
    public const string OrganiserRole = "Organiser";

    public static IServiceCollection AddHeraldAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        var section = configuration.GetSection("Herald:Authentication");

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.Authority = section["Authority"];
                options.Audience = section["Audience"];
                // Keep the directory's claim names: Herald reads `tid`, `oid`, `name` and `roles` as issued.
                options.MapInboundClaims = false;
                options.TokenValidationParameters.NameClaimType = "name";
                options.TokenValidationParameters.RoleClaimType = "roles";
            });
        // Checked when the host starts, not when it is built: `codegen` and `openapi` build it without configuration.
        services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
            .Validate(options => !string.IsNullOrEmpty(options.Authority), Missing(section, "Authority"))
            .Validate(options => !string.IsNullOrEmpty(options.Audience), Missing(section, "Audience"))
            .ValidateOnStart();
        services.AddAuthorizationBuilder()
            .AddPolicy(OrganiserPolicy, policy => policy.RequireAuthenticatedUser().RequireRole(OrganiserRole)
                .RequireAssertion(context => Caller.From(context.User) is not null));

        return services;
    }

    private static string Missing(IConfigurationSection section, string key) =>
        $"'{section.Path}:{key}' is missing: see docs/operations/identity.md.";
}
