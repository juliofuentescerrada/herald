using System.Security.Claims;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Herald.ModuleHosting;

// Who is calling, as the directory identifies them: never email or name (ADR 0014).
public sealed record Caller(Guid DirectoryId, Guid ObjectId)
{
    public static Caller? From(ClaimsPrincipal principal) =>
        Guid.TryParse(principal.FindFirst("tid")?.Value, out var directoryId)
        && Guid.TryParse(principal.FindFirst("oid")?.Value, out var objectId)
            ? new Caller(directoryId, objectId)
            : null;
}

// Implemented by the Organisations module; other modules see only the OrganisationContext it produces.
public interface IOrganisationAccess
{
    Task<bool> IsMemberAsync(Guid organisationId, Caller caller, CancellationToken cancellationToken);
}

// The organisation the current request or message acts for; one per scope, entered once.
public sealed class OrganisationContext
{
    public Guid? OrganisationId { get; private set; }

    public void Enter(Guid organisationId)
    {
        if (OrganisationId is { } current && current != organisationId)
        {
            throw new InvalidOperationException("This scope already acts for another organisation.");
        }

        OrganisationId = organisationId;
    }
}

public static class OrganisationContextRegistration
{
    // A factory, so Wolverine's generated code resolves the scope's instance instead of constructing its own.
    public static IServiceCollection AddOrganisationContext(this IServiceCollection services)
    {
        services.TryAddScoped(_ => new OrganisationContext());
        return services;
    }
}
