using System.Text.Json;
using Herald.Contracts.Registration.V1;
using Shouldly;

namespace Herald.Tournaments.Tests.Contracts;

public class TournamentFieldChangedTests
{
    [Fact]
    [Trait("covers", "entrant-check-in: An older field counts message is accepted")]
    public void A_version_1_message_sent_before_check_in_existed_reads_as_none_checked_in()
    {
        var organisation = Guid.NewGuid();
        var tournament = Guid.NewGuid();
        var json = $$"""
            {"OrganisationId":"{{organisation}}","TournamentId":"{{tournament}}","Revision":3,"Admitted":4,"Waiting":1,"Active":5}
            """;

        var message = JsonSerializer.Deserialize<TournamentFieldChanged>(json)!;

        message.ShouldBe(new TournamentFieldChanged(organisation, tournament, 3, 4, 1));
        message.CheckedIn.ShouldBe(0);
    }

    [Fact]
    public void A_message_sent_before_the_start_readiness_existed_reads_its_readiness_as_unknown()
    {
        var json = $$"""
            {"OrganisationId":"{{Guid.NewGuid()}}","TournamentId":"{{Guid.NewGuid()}}","Revision":3,"Admitted":4,"Waiting":1,"CheckedIn":2}
            """;

        var message = JsonSerializer.Deserialize<TournamentFieldChanged>(json)!;

        message.EligibleRevision.ShouldBeNull();
        message.Eligible.ShouldBeNull();
        message.Pending.ShouldBeNull();
        message.RostersOutsideBounds.ShouldBeNull();
        message.SharedMemberNames.ShouldBeNull();
    }

    [Fact]
    public void The_readiness_members_round_trip()
    {
        var message = new TournamentFieldChanged(Guid.NewGuid(), Guid.NewGuid(), 5, 4, 0, 4, 7, 4, 0,
            [new RosterOutsideBounds(Guid.NewGuid(), "Harbour Lights", 2)], [new SharedMemberName("Alex Kim", ["River Falcons", "North Stars"])]);

        var read = JsonSerializer.Deserialize<TournamentFieldChanged>(JsonSerializer.Serialize(message))!;

        read.RostersOutsideBounds.ShouldBe(message.RostersOutsideBounds);
        read.SharedMemberNames![0].TeamNames.ShouldBe(["River Falcons", "North Stars"]);
        (read with { RostersOutsideBounds = null, SharedMemberNames = null }).ShouldBe(message with { RostersOutsideBounds = null, SharedMemberNames = null });
    }
}
