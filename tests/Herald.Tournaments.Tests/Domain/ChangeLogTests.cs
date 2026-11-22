using Herald.Tournaments.Domain;
using Shouldly;
using static Herald.Tournaments.Tests.Domain.TournamentConfigurationTests;

namespace Herald.Tournaments.Tests.Domain;

public class ChangeLogTests
{
    private static readonly DateTimeOffset _at = new(2026, 11, 16, 12, 0, 0, TimeSpan.Zero);
    private readonly Guid _owner = Guid.NewGuid();

    private Tournament Draft() => Tournament.Draft(new TournamentId(Guid.NewGuid()), CompleteIndividual, _owner, _at);

    // Published: revision 2.
    private Tournament Published()
    {
        var tournament = Draft();
        tournament.Publish(1, _owner, _at, "Alex Owner").Outcome.ShouldBe(WriteOutcome.Applied);
        return tournament;
    }

    [Fact]
    public void Publishing_records_a_public_entry_with_who_and_when()
    {
        var tournament = Published();

        tournament.Logged.ShouldBe([new ChangeLogEntry(tournament.Id, ChangeKind.TournamentPublished, tournament.Id.Value, 2, _owner, "Alex Owner", _at)]);
        tournament.Logged[0].Public.ShouldBeTrue();
    }

    [Fact]
    [Trait("covers", "change-log: A postponed start")]
    public void A_postponed_start_records_the_old_and_new_times_with_the_time_zone()
    {
        var tournament = Published();

        tournament.ChangeDates(new(PlannedStartAt: new DateTime(2026, 11, 21, 10, 0, 0)), 2, _owner, _at, "Alex Owner").Outcome.ShouldBe(WriteOutcome.Applied);

        var entry = tournament.Logged[^1];
        entry.Kind.ShouldBe(ChangeKind.DatesChanged);
        entry.SubjectRevision.ShouldBe(3);
        entry.ActorName.ShouldBe("Alex Owner");
        entry.At.ShouldBe(_at);
        entry.TimeZone.ShouldBe("Europe/Madrid");
        entry.Changes.ShouldBe([new ChangedValue("plannedStartAt", "2026-11-14T10:00:00", "2026-11-21T10:00:00")]);
        entry.Public.ShouldBeTrue();
    }

    [Fact]
    public void A_cancellation_keeps_its_reason_in_the_entry()
    {
        var tournament = Published();

        tournament.Cancel("Venue unavailable", 2, _owner, _at, "Alex Owner").Outcome.ShouldBe(WriteOutcome.Applied);

        var entry = tournament.Logged[^1];
        entry.Kind.ShouldBe(ChangeKind.TournamentCancelled);
        entry.Reason.ShouldBe("Venue unavailable");
        entry.Public.ShouldBeTrue();
    }

    [Fact]
    public void A_material_change_is_recorded_with_its_values()
    {
        var tournament = Published();

        tournament.Change(CompleteIndividual with { Venue = "Valencia" }, 2, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);

        tournament.Logged.Skip(1).Select(entry => (entry.Kind, entry.Changes.Single())).ShouldBe([(ChangeKind.MaterialChange, new ChangedValue("venue", "Madrid", "Valencia"))]);
    }

    [Fact]
    public void Changes_that_are_not_material_are_not_recorded()
    {
        var tournament = Published();

        tournament.Change(CompleteIndividual with { Title = "Sunday Open", Capacity = 12 }, 2, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);

        tournament.Logged.Select(entry => entry.Kind).ShouldBe([ChangeKind.TournamentPublished]);
    }

    [Fact]
    public void A_draft_records_nothing()
    {
        var tournament = Draft();

        tournament.Change(CompleteIndividual with { Venue = "Valencia" }, 1, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);

        tournament.Logged.ShouldBeEmpty();
    }

    [Fact]
    public void A_rejected_or_repeated_write_records_nothing()
    {
        var tournament = Published();

        tournament.Publish(2, _owner, _at).Outcome.ShouldBe(WriteOutcome.Repeated);
        tournament.Cancel(null, 2, _owner, _at).Outcome.ShouldBe(WriteOutcome.Rejected);

        tournament.Logged.Count.ShouldBe(1);
    }

    [Theory]
    [Trait("covers", "change-log: An admission")]
    [InlineData(ChangeKind.EntryAdmitted)]
    [InlineData(ChangeKind.EntryCancelled)]
    [InlineData(ChangeKind.SchedulePublished)]
    [InlineData(ChangeKind.ScheduleWithdrawn)]
    [InlineData(ChangeKind.CompetitionReopened)]
    public void Entries_schedules_and_reopening_stay_private(ChangeKind kind) =>
        new ChangeLogEntry(new TournamentId(Guid.NewGuid()), kind, Guid.NewGuid(), 1, null, null, _at).Public.ShouldBeFalse();
}
