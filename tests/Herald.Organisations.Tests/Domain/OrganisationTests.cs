using Herald.Organisations.Domain;
using Shouldly;

namespace Herald.Organisations.Tests.Domain;

public class OrganisationTests
{
    private static readonly DateTimeOffset _now = new(2026, 11, 9, 12, 0, 0, TimeSpan.Zero);
    private readonly OrganisationId _id = new(Guid.NewGuid());
    private readonly PersonId _creator = PersonId.New();

    [Fact]
    public void The_creator_becomes_the_single_owner()
    {
        var organisation = Organisation.Create(_id, OrganisationName.Create("Northside Gaming"), _creator, _now);

        organisation.Memberships.ShouldHaveSingleItem().ShouldSatisfyAllConditions(
            membership => membership.PersonId.ShouldBe(_creator),
            membership => membership.Role.ShouldBe(MembershipRole.Owner));
        organisation.Owner.ShouldBe(_creator);
    }

    [Fact]
    public void Creation_records_who_created_it_and_when()
    {
        var organisation = Organisation.Create(_id, OrganisationName.Create("Northside Gaming"), _creator, _now);

        organisation.CreatedBy.ShouldBe(_creator);
        organisation.CreatedAt.ShouldBe(_now);
        organisation.DomainEvents.ShouldBe([new OrganisationCreated(_id, _creator, _now)]);
    }

    [Fact]
    public void The_same_name_by_the_same_person_repeats_the_creation()
    {
        var organisation = Organisation.Create(_id, OrganisationName.Create("Northside Gaming"), _creator, _now);

        organisation.Repeats(OrganisationName.Create(" Northside Gaming "), _creator).ShouldBeTrue();
    }

    [Fact]
    public void Another_name_or_another_person_does_not_repeat_the_creation()
    {
        var organisation = Organisation.Create(_id, OrganisationName.Create("Northside Gaming"), _creator, _now);

        organisation.Repeats(OrganisationName.Create("Southside Club"), _creator).ShouldBeFalse();
        organisation.Repeats(OrganisationName.Create("Northside Gaming"), PersonId.New()).ShouldBeFalse();
    }
}
