using System.Text.Json;
using Herald.Contracts.Tournaments.V1;
using Shouldly;

namespace Herald.Competition.Tests.Contracts;

public class TournamentCompetitionStartedTests
{
    [Fact]
    public void A_version_1_message_reads_back_as_sent()
    {
        var organisation = Guid.NewGuid();
        var tournament = Guid.NewGuid();
        var by = Guid.NewGuid();
        var json = $$"""
            {"OrganisationId":"{{organisation}}","TournamentId":"{{tournament}}","Revision":6,"EligibleRevision":9,"ScheduleRevision":2,"StartedBy":"{{by}}","StartedAt":"2026-11-21T10:05:00+00:00"}
            """;

        var message = JsonSerializer.Deserialize<TournamentCompetitionStarted>(json)!;

        message.ShouldBe(new TournamentCompetitionStarted(organisation, tournament, 6, 9, 2, by, new DateTimeOffset(2026, 11, 21, 10, 5, 0, TimeSpan.Zero)));
        JsonSerializer.Deserialize<TournamentCompetitionStarted>(JsonSerializer.Serialize(message)).ShouldBe(message);
    }

    [Fact]
    public void A_message_without_the_lineup_size_reads_it_as_unknown()
    {
        var json = $$"""
            {"OrganisationId":"{{Guid.NewGuid()}}","TournamentId":"{{Guid.NewGuid()}}","Revision":6,"EligibleRevision":9,"ScheduleRevision":2,"StartedBy":"{{Guid.NewGuid()}}","StartedAt":"2026-11-21T10:05:00+00:00"}
            """;

        JsonSerializer.Deserialize<TournamentCompetitionStarted>(json)!.ActivePlayersPerSide.ShouldBeNull();
    }

    [Fact]
    public void A_team_start_carries_the_lineup_size()
    {
        var message = new TournamentCompetitionStarted(Guid.NewGuid(), Guid.NewGuid(), 6, 9, 2, Guid.NewGuid(), DateTimeOffset.UnixEpoch, 5);

        JsonSerializer.Deserialize<TournamentCompetitionStarted>(JsonSerializer.Serialize(message))!.ActivePlayersPerSide.ShouldBe(5);
    }
}
