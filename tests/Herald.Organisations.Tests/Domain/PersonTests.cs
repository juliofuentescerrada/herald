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
}
