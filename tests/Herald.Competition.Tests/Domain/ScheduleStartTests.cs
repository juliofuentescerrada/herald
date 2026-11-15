using Herald.Competition.Domain;
using Shouldly;

namespace Herald.Competition.Tests.Domain;

public class ScheduleStartTests
{
    private static readonly DateTimeOffset _at = new(2026, 11, 21, 10, 5, 0, TimeSpan.Zero);
    private static readonly string[] _names = ["Robin Vale", "Sam Reed", "Jamie Brook", "Taylor Finch"];
    private readonly Guid _owner = Guid.NewGuid();

    // Four entrants, revision 1 published.
    private Schedule Published()
    {
        var entrants = _names.Select((name, index) => new Entrant(Guid.NewGuid(), name, index + 1)).ToList();
        var schedule = Schedule.Track(new TournamentId(Guid.NewGuid()), new EligibleField(1, true, [], entrants));
        schedule.Generate(Guid.NewGuid(), Seeding.AdmissionOrder, null, schedule.Revision, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);
        schedule.Publish(schedule.Revision, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);
        return schedule;
    }

    [Fact]
    [Trait("covers", "round-robin-pairings: Withdrawing after start")]
    public void Withdrawing_after_start_is_rejected_and_the_revision_stays_published()
    {
        var schedule = Published();
        schedule.ApplyStart(1, _at).ShouldBeTrue();

        schedule.Withdraw(schedule.Revision, "Late absence", _owner, _at).Broken.ShouldBe([new BrokenRule("schedule", "competition-started")]);
        schedule.Current!.Number.ShouldBe(1);
    }

    [Fact]
    public void Generating_after_start_is_rejected()
    {
        var schedule = Published();
        schedule.ApplyStart(1, _at);

        schedule.Generate(Guid.NewGuid(), Seeding.AdmissionOrder, null, schedule.Revision, _owner, _at).Broken.ShouldBe([new BrokenRule("schedule", "competition-started")]);
    }

    [Fact]
    public void A_second_start_report_changes_nothing()
    {
        var schedule = Published();
        schedule.ApplyStart(1, _at);

        schedule.ApplyStart(2, _at.AddMinutes(1)).ShouldBeFalse();
        schedule.StartedOnRevision.ShouldBe(1);
    }

    [Fact]
    public void A_start_on_a_withdrawn_revision_is_reported_and_allows_publishing_the_draft_once()
    {
        var schedule = Published();
        schedule.Withdraw(schedule.Revision, "Late absence", _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);

        schedule.ApplyStart(1, _at);

        schedule.StartCrossedWithdrawal.ShouldBeTrue();
        schedule.Publish(schedule.Revision, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);
        schedule.Current!.Number.ShouldBe(2);
        schedule.Withdraw(schedule.Revision, "Again", _owner, _at).Broken.ShouldBe([new BrokenRule("schedule", "competition-started")]);
    }
}
