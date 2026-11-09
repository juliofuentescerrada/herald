using Herald.Organisations.Domain;
using Shouldly;

namespace Herald.Organisations.Tests.Domain;

public class PersonTests
{
    private readonly IdentityKey _identity = new(Guid.NewGuid(), Guid.NewGuid());

    [Fact]
    public void Two_people_with_the_same_display_name_are_different_persons()
    {
        var first = Person.Register(_identity, "Alex");
        var second = Person.Register(new IdentityKey(_identity.DirectoryId, Guid.NewGuid()), "Alex");

        first.Id.ShouldNotBe(second.Id);
    }

    [Fact]
    public void Refreshing_the_display_name_keeps_the_person_and_identity()
    {
        var person = Person.Register(_identity, "Alex");
        var id = person.Id;

        person.RefreshDisplayName(" Alex Smith ");

        person.Id.ShouldBe(id);
        person.Identity.ShouldBe(_identity);
        person.DisplayName.ShouldBe("Alex Smith");
    }

    [Fact]
    public void A_relink_moves_the_identity_and_records_both_keys()
    {
        var person = Person.Register(_identity, "Alex");
        var replacement = new IdentityKey(_identity.DirectoryId, Guid.NewGuid());
        var at = new DateTimeOffset(2026, 11, 9, 12, 0, 0, TimeSpan.Zero);

        var relink = person.Relink(replacement, "operator", "lost account, verified by email thread", at);

        person.Identity.ShouldBe(replacement);
        relink.ShouldSatisfyAllConditions(
            r => r.PersonId.ShouldBe(person.Id),
            r => r.Previous.ShouldBe(_identity),
            r => r.Current.ShouldBe(replacement),
            r => r.At.ShouldBe(at));
    }

    [Fact]
    public void A_relink_without_a_reason_is_refused()
    {
        var person = Person.Register(_identity, "Alex");

        Should.Throw<ArgumentException>(() => person.Relink(new IdentityKey(Guid.NewGuid(), Guid.NewGuid()), "operator", " ", DateTimeOffset.UtcNow));
        person.Identity.ShouldBe(_identity);
    }
}
