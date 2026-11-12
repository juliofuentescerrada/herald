using System.Text.Json;
using Herald.Contracts.Registration.V1;
using Shouldly;

namespace Herald.Tournaments.Tests.Contracts;

public class TournamentFieldChangedTests
{
    [Fact]
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
}
