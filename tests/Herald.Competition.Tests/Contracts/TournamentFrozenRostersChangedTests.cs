using System.Text.Json;
using Herald.Contracts.Registration.V1;
using Shouldly;

namespace Herald.Competition.Tests.Contracts;

public class TournamentFrozenRostersChangedTests
{
    [Fact]
    public void A_version_1_message_reads_back_as_sent()
    {
        var organisation = Guid.NewGuid();
        var tournament = Guid.NewGuid();
        var entry = Guid.NewGuid();
        var player = Guid.NewGuid();
        var json = $$"""
            {"OrganisationId":"{{organisation}}","TournamentId":"{{tournament}}","Revision":3,"Rosters":[{"EntryId":"{{entry}}","Revision":4,"Members":[{"GuestPlayerId":"{{player}}","Name":"Alex Kim"}]}]}
            """;

        var message = JsonSerializer.Deserialize<TournamentFrozenRostersChanged>(json)!;

        message.OrganisationId.ShouldBe(organisation);
        message.Revision.ShouldBe(3);
        var roster = message.Rosters.ShouldHaveSingleItem();
        (roster.EntryId, roster.Revision).ShouldBe((entry, 4));
        roster.Members.ShouldHaveSingleItem().ShouldBe(new FrozenRosterMember(player, "Alex Kim"));
        JsonSerializer.Serialize(JsonSerializer.Deserialize<TournamentFrozenRostersChanged>(JsonSerializer.Serialize(message))).ShouldBe(JsonSerializer.Serialize(message));
    }
}
