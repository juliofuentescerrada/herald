using System.Security.Claims;
using Herald.BuildingBlocks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Herald.ModuleHosting;

public enum CallerKind
{
    // A signed-in person with the organiser role, acting through their memberships.
    Person,

    // A pilot server application with client credentials, acting through an owner's grant (D-12).
    Application,
}

// Who is calling, as the directory identifies them: never email or name (ADR 0014).
public sealed record Caller(Guid DirectoryId, Guid ObjectId, CallerKind Kind = CallerKind.Person)
{
    // Null without directory identifiers or without one of Herald's roles. An application's token is its own: no delegated `scp`.
    public static Caller? From(ClaimsPrincipal principal)
    {
        if (!Guid.TryParse(principal.FindFirst("tid")?.Value, out var directoryId)
            || !Guid.TryParse(principal.FindFirst("oid")?.Value, out var objectId))
        {
            return null;
        }

        var roles = principal.FindAll("roles").Select(claim => claim.Value).ToHashSet(StringComparer.Ordinal);
        if (roles.Contains(HeraldAuthentication.OrganiserRole))
        {
            return new Caller(directoryId, objectId);
        }

        return roles.Contains(HeraldAuthentication.PilotApplicationRole) && principal.FindFirst("scp") is null
            ? new Caller(directoryId, objectId, CallerKind.Application)
            : null;
    }
}

// An application's active grant in one organisation: the tournaments it covers (null for all of them) and its groups.
public sealed record Grant(Guid Id, IReadOnlySet<Guid>? Tournaments, IReadOnlySet<OperationGroup> Groups);

// The actor a request acts as: a member's person identifier, or an application's grant identifier with the grant.
public sealed record Access(Guid ActorId, Grant? Grant = null);

// Implemented by the Organisations module; other modules see only the OrganisationContext it produces.
public interface IOrganisationAccess
{
    // The caller's access to the organisation, or null when it has none: no membership, or no active grant.
    Task<Access?> FindAccessAsync(Guid organisationId, Caller caller, CancellationToken cancellationToken);
}

// The organisation the current request or message acts for; one per scope, entered once.
public sealed class OrganisationContext
{
    public Guid? OrganisationId { get; private set; }

    // Who acts in this scope, for modules that record who made a change: a person, or an application's grant; null outside a request.
    public Guid? ActorId { get; private set; }

    // Set when an application acts: what its owner allowed.
    public Grant? Grant { get; private set; }

    public void Enter(Guid organisationId, Guid? actorId = null, Grant? grant = null)
    {
        if (OrganisationId is { } current && current != organisationId)
        {
            throw new InvalidOperationException("This scope already acts for another organisation.");
        }

        OrganisationId = organisationId;
        ActorId = actorId ?? ActorId;
        Grant = grant ?? Grant;
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
