using System.Text.Json;
using Herald.Contracts.Competition.V1;
using Shouldly;

namespace Herald.Tournaments.Tests.Contracts;

public class TournamentScheduleChangedTests
{
    [Fact]
    public void A_withdrawn_schedule_reads_with_no_published_revision()
    {
        var message = new TournamentScheduleChanged(Guid.NewGuid(), Guid.NewGuid(), 5, PublishedRevision: null, EligibleRevision: null);

        var read = JsonSerializer.Deserialize<TournamentScheduleChanged>(JsonSerializer.Serialize(message))!;

        read.ShouldBe(message);
    }
}
