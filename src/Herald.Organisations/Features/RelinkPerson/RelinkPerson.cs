using Herald.ModuleHosting;
using Herald.Organisations.Domain;
using Herald.Organisations.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Herald.Organisations.Features.RelinkPerson;

// D-6: the platform operator moves a verified person to a new directory identity. Run by the
// `relink-person` host command; never merges persons or copies memberships.
public static class RelinkPerson
{
    // Null on success, otherwise why nothing changed.
    public static async Task<string?> RunAsync(
        OrganisationsDbContext db, Guid personId, IdentityKey identity, string @operator, string reason, DateTimeOffset at,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(@operator) || string.IsNullOrWhiteSpace(reason))
        {
            return "A relink needs the operator and the reason.";
        }

        var person = await db.Persons.SingleOrDefaultAsync(p => p.Id == new PersonId(personId), cancellationToken);
        if (person is null)
        {
            return $"No person {personId}.";
        }

        if (person.Identity == identity)
        {
            return "The person already has this identity.";
        }

        // The unique index refuses a concurrent claim of the same key as well.
        if (await db.Persons.Identified(new Caller(identity.DirectoryId, identity.ObjectId)).AnyAsync(cancellationToken))
        {
            return "The new identity already belongs to another person.";
        }

        db.IdentityRelinks.Add(person.Relink(identity, @operator, reason, at));
        await db.SaveChangesAsync(cancellationToken);
        return null;
    }
}
