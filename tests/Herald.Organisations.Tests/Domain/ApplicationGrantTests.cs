using Herald.BuildingBlocks;
using Herald.Organisations.Domain;
using Shouldly;

namespace Herald.Organisations.Tests.Domain;

public class ApplicationGrantTests
{
    private static readonly DateTimeOffset _now = new(2026, 11, 16, 12, 0, 0, TimeSpan.Zero);
    private readonly PersonId _owner = PersonId.New();
    private readonly IdentityKey _bot = new(Guid.NewGuid(), Guid.NewGuid());
    private readonly Guid _saturdayOpen = Guid.NewGuid();

    private ApplicationGrant ResultsBot() => ApplicationGrant.Grant(
        new GrantId(Guid.NewGuid()), GrantName.Create(" Results bot "), _bot, [_saturdayOpen],
        [OperationGroup.Results, OperationGroup.Read], _owner, _now);

    [Fact]
    public void A_grant_records_its_scope_and_who_granted_it_and_when()
    {
        var grant = ResultsBot();

        grant.ShouldSatisfyAllConditions(
            g => g.Name.Value.ShouldBe("Results bot"),
            g => g.Application.ShouldBe(_bot),
            g => g.Tournaments.ShouldBe([_saturdayOpen]),
            g => g.Groups.ShouldBe([OperationGroup.Read, OperationGroup.Results]),
            g => g.GrantedBy.ShouldBe(_owner),
            g => g.GrantedAt.ShouldBe(_now),
            g => g.Active.ShouldBeTrue());
    }

    [Fact]
    public void A_grant_without_tournaments_covers_all_of_them() =>
        ApplicationGrant.Grant(new GrantId(Guid.NewGuid()), GrantName.Create("Results bot"), _bot, null, [OperationGroup.Read], _owner, _now)
            .Tournaments.ShouldBeNull();

    [Fact]
    public void A_grant_needs_an_operation_group_and_a_selected_tournament_when_it_selects() =>
        Should.Throw<ArgumentException>(() => ApplicationGrant.Grant(
            new GrantId(Guid.NewGuid()), GrantName.Create("Results bot"), _bot, [], [OperationGroup.Read], _owner, _now));

    [Fact]
    public void Revoking_records_who_and_when_and_a_second_revocation_keeps_the_first()
    {
        var grant = ResultsBot();
        var other = PersonId.New();

        grant.Revoke(_owner, _now.AddHours(1));
        grant.Revoke(other, _now.AddHours(2));

        grant.ShouldSatisfyAllConditions(
            g => g.Active.ShouldBeFalse(),
            g => g.RevokedBy.ShouldBe(_owner),
            g => g.RevokedAt.ShouldBe(_now.AddHours(1)));
    }

    [Fact]
    public void The_same_content_in_any_order_repeats_the_grant() =>
        ResultsBot().Repeats(GrantName.Create("Results bot"), _bot, [_saturdayOpen], [OperationGroup.Read, OperationGroup.Results]).ShouldBeTrue();

    [Fact]
    public void Another_scope_does_not_repeat_the_grant() =>
        ResultsBot().Repeats(GrantName.Create("Results bot"), _bot, null, [OperationGroup.Read, OperationGroup.Results]).ShouldBeFalse();
}
