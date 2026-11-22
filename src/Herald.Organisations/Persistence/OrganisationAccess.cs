using Herald.ModuleHosting;
using Herald.Organisations.Domain;
using Microsoft.EntityFrameworkCore;

namespace Herald.Organisations.Persistence;

// Answers the host's access step for every organisation-scoped request; never cached, so removal or revocation applies next call.
internal sealed class OrganisationAccess(OrganisationsDbContext db) : IOrganisationAccess
{
    public Task<Access?> FindAccessAsync(Guid organisationId, Caller caller, CancellationToken cancellationToken) =>
        caller.Kind == CallerKind.Person ? FindMemberAsync(organisationId, caller, cancellationToken) : FindGrantAsync(organisationId, caller, cancellationToken);

    public async Task<string?> FindNameAsync(Guid organisationId, CancellationToken cancellationToken)
    {
        var id = new OrganisationId(organisationId);
        return (await db.Organisations.AsNoTracking().Where(organisation => organisation.Id == id)
            .Select(organisation => organisation.Name).SingleOrDefaultAsync(cancellationToken))?.Value;
    }

    private async Task<Access?> FindMemberAsync(Guid organisationId, Caller caller, CancellationToken cancellationToken) =>
        // Reviewed bypass: this check runs before any organisation context exists.
        await db.Memberships.IgnoreQueryFilters()
            .Where(membership => EF.Property<Guid>(membership, OrganisationScopedDbContext.OrganisationProperty) == organisationId)
            .Join(db.Persons.Identified(caller), membership => membership.PersonId, person => person.Id, (_, person) => new { person.Id, person.DisplayName })
            .Select(person => new Access(person.Id.Value, person.DisplayName, null))
            .SingleOrDefaultAsync(cancellationToken);

    private async Task<Access?> FindGrantAsync(Guid organisationId, Caller caller, CancellationToken cancellationToken)
    {
        // Reviewed bypass, as above: the active grant of this application in this organisation, if any, and its granting owner.
        var found = await db.ApplicationGrants.IgnoreQueryFilters().AsNoTracking()
            .Where(g => EF.Property<Guid>(g, OrganisationScopedDbContext.OrganisationProperty) == organisationId
                && EF.Property<Guid>(g, nameof(IdentityKey.DirectoryId)) == caller.DirectoryId
                && EF.Property<Guid>(g, nameof(IdentityKey.ObjectId)) == caller.ObjectId
                && g.RevokedAt == null)
            .Join(db.Persons, g => g.GrantedBy, person => person.Id, (grant, person) => new { grant, person.DisplayName })
            .SingleOrDefaultAsync(cancellationToken);
        return found is null
            ? null
            : new Access(
                found.grant.Id.Value,
                $"{found.grant.Name.Value} (granted by {found.DisplayName})",
                new Grant(found.grant.Id.Value, found.grant.Tournaments?.ToHashSet(), found.grant.Groups.ToHashSet()));
    }
}
