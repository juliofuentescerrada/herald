using Herald.ModuleHosting;
using Herald.Organisations.Domain;
using Microsoft.EntityFrameworkCore;

namespace Herald.Organisations.Persistence;

// Names the actors other modules record: persons by display name, and the current organisation's grants by the application's
// name and its granting owner. Grants are organisation-owned, so another organisation's grant is never named here.
internal sealed class ActorNames(OrganisationsDbContext db) : IActorNames
{
    public async Task<IReadOnlyDictionary<Guid, string>> NamesAsync(IReadOnlyCollection<Guid> actors, CancellationToken cancellationToken)
    {
        var people = actors.Select(actor => new PersonId(actor)).ToList();
        var grants = actors.Select(actor => new GrantId(actor)).ToList();
        var named = await db.ApplicationGrants.AsNoTracking()
            .Where(grant => grants.Contains(grant.Id))
            .Join(db.Persons, grant => grant.GrantedBy, person => person.Id, (grant, person) => new { grant.Id, grant.Name, person.DisplayName })
            .ToListAsync(cancellationToken);
        var names = await db.Persons.AsNoTracking()
            .Where(person => people.Contains(person.Id))
            .ToDictionaryAsync(person => person.Id.Value, person => person.DisplayName, cancellationToken);
        foreach (var grant in named)
        {
            names[grant.Id.Value] = $"{grant.Name.Value} (granted by {grant.DisplayName})";
        }

        return names;
    }
}
