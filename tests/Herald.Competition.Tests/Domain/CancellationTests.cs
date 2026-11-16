using Herald.Competition.Domain;
using Shouldly;

namespace Herald.Competition.Tests.Domain;

public class CancellationTests
{
    private static readonly DateTimeOffset _at = new(2026, 11, 29, 18, 0, 0, TimeSpan.Zero);
    private static readonly string[] _names = ["Robin Vale", "Sam Reed", "Jamie Brook", "Taylor Finch"];
    private readonly Guid _owner = Guid.NewGuid();
    private readonly Schedule _schedule;

    // Four entrants with a published schedule, not started.
    public CancellationTests()
    {
        var entrants = _names.Select((name, index) => new Entrant(Guid.NewGuid(), name, index + 1)).ToList();
        _schedule = Schedule.Track(new TournamentId(Guid.NewGuid()), new EligibleField(1, true, [], entrants));
        _schedule.Generate(Guid.NewGuid(), Seeding.AdmissionOrder, null, _schedule.Revision, _owner, _at);
        _schedule.Publish(_schedule.Revision, _owner, _at);
        _schedule.ClearDomainEvents();
    }

    private IReadOnlyList<Match> Started()
    {
        _schedule.ApplyStart(1, _at, null);
        return _schedule.ScheduleMatches();
    }

    [Fact]
    [Trait("covers", "round-robin-pairings: A published schedule before start")]
    public void A_cancellation_before_start_withdraws_the_publication_and_keeps_it_in_history()
    {
        _schedule.ApplyCancellation(false, [], _owner, _at).ShouldBeTrue();

        _schedule.Current.ShouldBeNull();
        _schedule.Draft.ShouldBeNull();
        var withdrawn = _schedule.Publications.ShouldHaveSingleItem();
        (withdrawn.WithdrawalReason, withdrawn.WithdrawnBy, withdrawn.WithdrawnAt).ShouldBe((Schedule.CancellationReason, _owner, _at));
        _schedule.IsCancelled.ShouldBeTrue();
    }

    [Fact]
    [Trait("covers", "tournament-lifecycle: Two matches left")]
    public void A_cancellation_after_start_keeps_the_results_and_voids_the_unresolved_matches_with_no_points()
    {
        var matches = Started();
        foreach (var match in matches.Take(4))
        {
            match.RecordPlayed(Guid.NewGuid(), Outcome.First, match.Revision, _owner, _at);
            _schedule.ResultRecorded();
        }

        var resultsRevision = _schedule.ResultsRevision;

        _schedule.ApplyCancellation(true, matches, _owner, _at).ShouldBeTrue();

        matches.Take(4).ShouldAllBe(match => match.Resolution!.Cause == Cause.Played && match.Resolution.Outcome == Outcome.First);
        matches.Skip(4).ShouldAllBe(match => match.Resolution!.Cause == Cause.VoidedCancelled && match.Resolution.Outcome == Outcome.None);
        _schedule.ResultsRevision.ShouldBe(resultsRevision + 1);
        _schedule.Publications.ShouldHaveSingleItem().IsWithdrawn.ShouldBeFalse();
    }

    [Fact]
    public void A_second_delivery_changes_nothing()
    {
        var matches = Started();
        _schedule.ApplyCancellation(true, matches, _owner, _at);
        var revision = _schedule.Revision;

        _schedule.ApplyCancellation(true, matches, _owner, _at).ShouldBeFalse();

        _schedule.Revision.ShouldBe(revision);
    }

    [Fact]
    public void A_cancellation_after_a_start_not_yet_learned_keeps_the_publication()
    {
        _schedule.ApplyCancellation(true, [], _owner, _at).ShouldBeTrue();

        _schedule.Current.ShouldNotBeNull();
    }

    [Fact]
    public void A_start_that_arrives_after_the_cancellation_voids_its_matches_at_once()
    {
        _schedule.ApplyCancellation(false, [], _owner, _at);
        _schedule.ApplyStart(1, _at, null);

        _schedule.ScheduleMatches().ShouldAllBe(match => match.Resolution!.Cause == Cause.VoidedCancelled);
    }

    [Fact]
    public void An_archived_finalised_competition_is_reopened_only_after_unarchiving()
    {
        var matches = Started();
        foreach (var match in matches)
        {
            match.RecordPlayed(Guid.NewGuid(), Outcome.Draw, match.Revision, _owner, _at);
            _schedule.ResultRecorded();
        }

        _schedule.Finalise(_schedule.ResultsRevision, _schedule.Revision, matches, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);
        _schedule.ApplyArchive(true, 7).ShouldBeTrue();
        _schedule.ApplyArchive(false, 6).ShouldBeFalse();

        _schedule.Reopen("Appeal", _schedule.Revision, _owner, _at).Broken.ShouldBe([new BrokenRule("competition", "archived")]);
        _schedule.ApplyArchive(false, 8).ShouldBeTrue();
        _schedule.Reopen("Appeal", _schedule.Revision, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);
    }
}
