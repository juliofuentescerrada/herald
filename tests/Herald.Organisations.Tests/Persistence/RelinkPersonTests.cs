using Herald.ModuleHosting;
using Herald.Organisations.Domain;
using Herald.Organisations.Features.RelinkPerson;
using Herald.Organisations.Persistence;
using Microsoft.EntityFrameworkCore;
using Shouldly;

namespace Herald.Organisations.Tests.Persistence;

[Collection(OrganisationsDatabaseTests.Name)]
public class RelinkPersonTests(OrganisationsDatabase database)
{
    private static readonly DateTimeOffset _now = new(2026, 11, 9, 12, 0, 0, TimeSpan.Zero);

    private static CancellationToken Cancellation => TestContext.Current.CancellationToken;

    private static IdentityKey NewIdentity() => new(Guid.NewGuid(), Guid.NewGuid());

    private async Task<(Person Person, OrganisationId Organisation)> OwnerAsync(IdentityKey identity)
    {
        var person = Person.Register(identity, "Alex");
        var organisation = new OrganisationId(Guid.NewGuid());
        await using var db = database.Scope(organisation.Value);
        db.Persons.Add(person);
        db.Organisations.Add(Organisation.Create(organisation, OrganisationName.Create("Northside Gaming"), person.Id, _now));
        await db.SaveChangesAsync(Cancellation);
        return (person, organisation);
    }

    private async Task<PersonId?> ResolveAsync(IdentityKey identity)
    {
        await using var db = database.Scope(null);
        return (await db.Persons.Identified(new Caller(identity.DirectoryId, identity.ObjectId)).SingleOrDefaultAsync(Cancellation))?.Id;
    }

    private async Task<string?> RelinkAsync(Guid personId, IdentityKey identity, string reason = "verified by the invitation thread")
    {
        await using var db = database.Scope(null);
        return await RelinkPerson.RunAsync(db, personId, identity, "operator", reason, _now, Cancellation);
    }

    [Fact]
    public async Task The_relinked_identity_resolves_to_the_same_person_and_organisations()
    {
        var old = NewIdentity();
        var replacement = NewIdentity();
        var (person, organisation) = await OwnerAsync(old);

        (await RelinkAsync(person.Id.Value, replacement)).ShouldBeNull();

        (await ResolveAsync(replacement)).ShouldBe(person.Id);
        (await ResolveAsync(old)).ShouldBeNull();
        await using var db = database.Scope(organisation.Value);
        (await db.Memberships.SingleAsync(Cancellation)).PersonId.ShouldBe(person.Id);
    }

    [Fact]
    public async Task The_relink_is_recorded_with_both_identities_operator_and_reason()
    {
        var old = NewIdentity();
        var replacement = NewIdentity();
        var (person, _) = await OwnerAsync(old);

        await RelinkAsync(person.Id.Value, replacement);

        await using var db = database.Scope(null);
        var relink = await db.IdentityRelinks.SingleAsync(r => r.PersonId == person.Id, Cancellation);
        relink.ShouldBe(relink with { Previous = old, Current = replacement, Operator = "operator", Reason = "verified by the invitation thread", At = _now });
    }

    [Fact]
    public async Task An_identity_that_belongs_to_another_person_is_refused_and_nothing_changes()
    {
        var old = NewIdentity();
        var occupied = NewIdentity();
        var (person, _) = await OwnerAsync(old);
        var (other, _) = await OwnerAsync(occupied);

        (await RelinkAsync(person.Id.Value, occupied)).ShouldNotBeNull();

        (await ResolveAsync(old)).ShouldBe(person.Id);
        (await ResolveAsync(occupied)).ShouldBe(other.Id);
        await using var db = database.Scope(null);
        (await db.IdentityRelinks.AnyAsync(r => r.PersonId == person.Id, Cancellation)).ShouldBeFalse();
    }

    [Fact]
    public async Task An_unknown_person_or_a_missing_reason_is_refused()
    {
        var (person, _) = await OwnerAsync(NewIdentity());

        (await RelinkAsync(Guid.NewGuid(), NewIdentity())).ShouldNotBeNull();
        (await RelinkAsync(person.Id.Value, NewIdentity(), reason: " ")).ShouldNotBeNull();
    }
}
