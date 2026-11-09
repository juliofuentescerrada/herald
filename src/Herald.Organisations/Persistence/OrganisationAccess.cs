using Herald.ModuleHosting;
using Microsoft.EntityFrameworkCore;

namespace Herald.Organisations.Persistence;

// Answers the host's membership step for every organisation-scoped request; never cached, so removal applies next call.
internal sealed class OrganisationAccess(OrganisationsDbContext db) : IOrganisationAccess
{
    public Task<bool> IsMemberAsync(Guid organisationId, Caller caller, CancellationToken cancellationToken) =>
        // Reviewed bypass: this check runs before any organisation context exists.
        db.Memberships.IgnoreQueryFilters()
            .AnyAsync(
                membership => EF.Property<Guid>(membership, OrganisationScopedDbContext.OrganisationProperty) == organisationId
                    && db.Persons.Identified(caller).Any(person => person.Id == membership.PersonId),
                cancellationToken);
}
