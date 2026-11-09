using Herald.ModuleHosting;
using Herald.Organisations.Domain;
using Microsoft.EntityFrameworkCore;

namespace Herald.Organisations.Persistence;

public static class PersonLookup
{
    // The person behind a token: identity columns only, never email or name (ADR 0014).
    public static IQueryable<Person> Identified(this IQueryable<Person> persons, Caller caller) =>
        persons.Where(person => EF.Property<Guid>(person, nameof(IdentityKey.DirectoryId)) == caller.DirectoryId
            && EF.Property<Guid>(person, nameof(IdentityKey.ObjectId)) == caller.ObjectId);
}
