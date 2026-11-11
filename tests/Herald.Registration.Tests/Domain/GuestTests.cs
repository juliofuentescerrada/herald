using Herald.Registration.Domain;
using Shouldly;

namespace Herald.Registration.Tests.Domain;

public class GuestTests
{
    private static readonly DateTimeOffset _at = new(2026, 11, 11, 9, 0, 0, TimeSpan.Zero);
    private readonly GuestId _id = new(Guid.NewGuid());
    private readonly Guid _owner = Guid.NewGuid();

    [Fact]
    public void A_guest_is_created_with_its_trimmed_name_and_who_and_when()
    {
        var guest = Guest.Create(_id, GuestKind.Player, "  Robin Vale ", _owner, _at);

        guest.Name.ShouldBe("Robin Vale");
        guest.Kind.ShouldBe(GuestKind.Player);
        guest.CreatedBy.ShouldBe(_owner);
        guest.CreatedAt.ShouldBe(_at);
        guest.DomainEvents.ShouldBe([new GuestCreated(_id, GuestKind.Player, _owner, _at)]);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("   ")]
    public void A_name_is_required(string? name)
    {
        Guest.Check(name).ShouldBe([new BrokenRule("name", "required")]);
        Should.Throw<ArgumentException>(() => Guest.Create(_id, GuestKind.Player, name!, _owner, _at));
    }

    [Fact]
    public void A_name_of_81_characters_is_too_long() =>
        Guest.Check(new string('a', 81)).ShouldBe([new BrokenRule("name", "too-long")]);

    [Fact]
    public void A_name_of_80_characters_is_accepted() =>
        Guest.Check(new string('a', 80)).ShouldBeEmpty();

    [Theory]
    [InlineData("Robin Vale", "robin vale")]
    [InlineData("  robin   VALE ", "robin vale")]
    [InlineData("Róbin Valé", "robin vale")]
    [InlineData("Zoë  Ørsted", "zoe ørsted")]
    public void Case_accents_and_spaces_do_not_tell_two_names_apart(string name, string normalised) =>
        Guest.Normalise(name).ShouldBe(normalised);

    [Fact]
    public void A_creation_repeats_only_with_the_same_kind_and_name()
    {
        var guest = Guest.Create(_id, GuestKind.Team, "Northside", _owner, _at);

        guest.Repeats(GuestKind.Team, " Northside ").ShouldBeTrue();
        guest.Repeats(GuestKind.Player, "Northside").ShouldBeFalse();
        guest.Repeats(GuestKind.Team, "Southside").ShouldBeFalse();
    }
}
