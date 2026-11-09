using Herald.Organisations.Domain;
using Microsoft.EntityFrameworkCore;
using Shouldly;

namespace Herald.Organisations.Tests.Persistence;

[Collection(OrganisationsDatabaseTests.Name)]
public class PersistenceTests(OrganisationsDatabase database)
{
    private static readonly DateTimeOffset _now = new(2026, 11, 9, 12, 0, 0, TimeSpan.Zero);

    private static IdentityKey NewIdentity() => new(Guid.NewGuid(), Guid.NewGuid());

    [Fact]
    public async Task An_organisation_is_stored_with_its_owner_membership_in_its_own_organisation()
    {
        var person = Person.Register(NewIdentity(), "Alex");
        var id = new OrganisationId(Guid.NewGuid());
        await using (var db = database.Scope(id.Value))
        {
            db.Persons.Add(person);
            db.Organisations.Add(Organisation.Create(id, OrganisationName.Create("Northside Gaming"), person.Id, _now));
            await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        await using var read = database.Scope(id.Value);
        var stored = await read.Organisations.Include(o => o.Memberships).SingleAsync(o => o.Id == id, TestContext.Current.CancellationToken);
        stored.Name.Value.ShouldBe("Northside Gaming");
        stored.CreatedAt.ShouldBe(_now);
        stored.Owner.ShouldBe(person.Id);
        (await read.Memberships.Select(m => EF.Property<Guid>(m, "OrganisationId")).SingleAsync(TestContext.Current.CancellationToken))
            .ShouldBe(id.Value);
    }

    [Fact]
    public async Task A_persons_identity_is_read_back_as_its_directory_key()
    {
        var identity = NewIdentity();
        var person = Person.Register(identity, "Alex");
        await using (var db = database.Scope(null))
        {
            db.Persons.Add(person);
            await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        await using var read = database.Scope(null);
        (await read.Persons.SingleAsync(p => p.Id == person.Id, TestContext.Current.CancellationToken)).Identity.ShouldBe(identity);
    }

    [Fact]
    public async Task Two_persons_cannot_share_an_identity()
    {
        var identity = NewIdentity();
        await using var db = database.Scope(null);
        db.Persons.AddRange(Person.Register(identity, "Alex"), Person.Register(identity, "Alex"));

        await Should.ThrowAsync<DbUpdateException>(() => db.SaveChangesAsync(TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task A_relink_is_stored_with_both_identities()
    {
        var person = Person.Register(NewIdentity(), "Alex");
        var replacement = NewIdentity();
        await using (var db = database.Scope(null))
        {
            db.Persons.Add(person);
            db.IdentityRelinks.Add(person.Relink(replacement, "operator", "verified out of band", _now));
            await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        await using var read = database.Scope(null);
        var relink = await read.IdentityRelinks.SingleAsync(r => r.PersonId == person.Id, TestContext.Current.CancellationToken);
        relink.Current.ShouldBe(replacement);
        (await read.Persons.SingleAsync(p => p.Id == person.Id, TestContext.Current.CancellationToken)).Identity.ShouldBe(replacement);
    }
}
