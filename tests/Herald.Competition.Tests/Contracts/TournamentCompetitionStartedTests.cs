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
}
