using Herald.ModuleHosting;
using Herald.Organisations.Domain;
using Microsoft.EntityFrameworkCore;

namespace Herald.Organisations.Persistence;

// Answers the host's access step for every organisation-scoped request; never cached, so removal or revocation applies next call.
internal sealed class OrganisationAccess(OrganisationsDbContext db) : IOrganisationAccess
{
    public async Task<Access?> FindAccessAsync(Guid organisationId, Caller caller, CancellationToken cancellationToken) =>
        caller.Kind switch
        {
            CallerKind.Person => await FindMemberAsync(organisationId, caller, cancellationToken) is { } personId ? new Access(personId) : null,
            _ => await FindGrantAsync(organisationId, caller, cancellationToken) is { } grant ? new Access(grant.Id, grant) : null,
        };

    private async Task<Guid?> FindMemberAsync(Guid organisationId, Caller caller, CancellationToken cancellationToken) =>
        // Reviewed bypass: this check runs before any organisation context exists.
        (await db.Memberships.IgnoreQueryFilters()
            .Where(membership => EF.Property<Guid>(membership, OrganisationScopedDbContext.OrganisationProperty) == organisationId
                && db.Persons.Identified(caller).Any(person => person.Id == membership.PersonId))
            .Select(membership => (PersonId?)membership.PersonId)
            .SingleOrDefaultAsync(cancellationToken))?.Value;

    private async Task<Grant?> FindGrantAsync(Guid organisationId, Caller caller, CancellationToken cancellationToken)
    {
        // Reviewed bypass, as above: the active grant of this application in this organisation, if any.
        var grant = await db.ApplicationGrants.IgnoreQueryFilters().AsNoTracking()
            .Where(g => EF.Property<Guid>(g, OrganisationScopedDbContext.OrganisationProperty) == organisationId
                && EF.Property<Guid>(g, nameof(IdentityKey.DirectoryId)) == caller.DirectoryId
                && EF.Property<Guid>(g, nameof(IdentityKey.ObjectId)) == caller.ObjectId
                && g.RevokedAt == null)
            .SingleOrDefaultAsync(cancellationToken);
        return grant is null
            ? null
            : new Grant(grant.Id.Value, grant.Tournaments?.ToHashSet(), grant.Groups.ToHashSet());
    }
}
