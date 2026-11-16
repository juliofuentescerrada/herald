using Herald.Competition.Domain;
using Shouldly;

namespace Herald.Competition.Tests.Domain;

public class FinalisationTests
{
    private static readonly DateTimeOffset _at = new(2026, 11, 29, 18, 0, 0, TimeSpan.Zero);
    private static readonly string[] _names = ["Robin Vale", "Sam Reed", "Jamie Brook", "Taylor Finch"];
    private readonly Guid _owner = Guid.NewGuid();
    private readonly Schedule _schedule;
    private readonly IReadOnlyList<Match> _matches;

    // Four entrants, started: six matches over three rounds.
    public FinalisationTests()
    {
        var entrants = _names.Select((name, index) => new Entrant(Guid.NewGuid(), name, index + 1)).ToList();
        _schedule = Schedule.Track(new TournamentId(Guid.NewGuid()), new EligibleField(1, true, [], entrants));
        _schedule.Generate(Guid.NewGuid(), Seeding.AdmissionOrder, null, _schedule.Revision, _owner, _at);
        _schedule.Publish(_schedule.Revision, _owner, _at);
        _schedule.ApplyStart(1, _at, null);
        _matches = _schedule.ScheduleMatches();
    }

    // As the match write does: a resolution moves the results revision.
    private void Resolve(Match match, Outcome outcome = Outcome.First)
    {
        match.RecordPlayed(Guid.NewGuid(), outcome, match.Revision, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);
        _schedule.ResultRecorded();
    }

    private void ResolveAll()
    {
        foreach (var match in _matches.Where(match => match.State != MatchState.Resolved))
        {
            Resolve(match);
        }
    }

    private void CorrectFirstMatch()
    {
        var match = _matches[0];
        match.Correct(Guid.NewGuid(), Cause.Played, Outcome.Draw, null, null, null, "Score sheet misread", match.Revision, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);
        _schedule.ResultRecorded();
    }

    private WriteResult Finalise(int reviewed) => _schedule.Finalise(reviewed, _schedule.Revision, _matches, _owner, _at);

    private WriteResult Reopen(string? reason) => _schedule.Reopen(reason, _schedule.Revision, _owner, _at);

    [Fact]
    [Trait("covers", "competition-finalisation: Standings behind the facts")]
    public void A_finalisation_reviewed_at_an_older_results_revision_is_stale_and_the_competition_stays_running()
    {
        ResolveAll();
        var revision = _schedule.Revision;

        var result = Finalise(_schedule.ResultsRevision - 1);

        result.Broken.ShouldBe([new BrokenRule("review", "stale")]);
        _schedule.IsFinalised.ShouldBeFalse();
        _schedule.Revision.ShouldBe(revision);
    }

    [Fact]
    [Trait("covers", "competition-finalisation: A correction after the review")]
    public void A_correction_between_the_review_and_the_finalisation_makes_the_review_stale()
    {
        ResolveAll();
        var reviewed = _schedule.ResultsRevision;
        CorrectFirstMatch();

        Finalise(reviewed).Broken.ShouldBe([new BrokenRule("review", "stale")]);
        _schedule.IsFinalised.ShouldBeFalse();
    }

    [Fact]
    [Trait("covers", "competition-finalisation: Current reviewed standings")]
    public void Current_reviewed_standings_with_every_match_resolved_finalise_as_final_revision_one()
    {
        ResolveAll();
        var reviewed = _schedule.ResultsRevision;

        Finalise(reviewed).Outcome.ShouldBe(WriteOutcome.Applied);

        _schedule.Final.ShouldBe(new FinalRevision(1, reviewed, _owner, _at));
        _schedule.DomainEvents.OfType<CompetitionFinalised>().Single().ShouldBe(new CompetitionFinalised(_schedule.Id, 1, reviewed, _owner, _at));
    }

    [Fact]
    public void A_retried_finalisation_is_answered_as_repeated()
    {
        ResolveAll();
        var reviewed = _schedule.ResultsRevision;
        var revision = _schedule.Revision;
        Finalise(reviewed);

        _schedule.Finalise(reviewed, revision, _matches, _owner, _at).Outcome.ShouldBe(WriteOutcome.Repeated);
        _schedule.Finals.Count.ShouldBe(1);
    }

    [Fact]
    [Trait("covers", "competition-finalisation: An unresolved match")]
    public void A_finalisation_with_a_match_in_play_is_rejected_naming_the_match()
    {
        foreach (var match in _matches.Skip(1))
        {
            Resolve(match);
        }

        _matches[0].StartMatch(null, null, _matches[0].Revision, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);

        Finalise(_schedule.ResultsRevision).Broken.ShouldBe([new BrokenRule($"match-{_matches[0].Id.Value}", "unresolved")]);
        _schedule.IsFinalised.ShouldBeFalse();
    }

    [Fact]
    public void A_competition_that_has_not_started_cannot_be_finalised()
    {
        var entrants = new[] { new Entrant(Guid.NewGuid(), "Robin Vale", 1), new Entrant(Guid.NewGuid(), "Sam Reed", 2) };
        var schedule = Schedule.Track(new TournamentId(Guid.NewGuid()), new EligibleField(1, true, [], entrants));

        schedule.Finalise(0, schedule.Revision, [], _owner, _at).Broken.ShouldBe([new BrokenRule("schedule", "not-started")]);
    }

    [Fact]
    public void Reopening_returns_the_competition_to_running_and_keeps_the_final_revision_with_its_reason()
    {
        ResolveAll();
        var reviewed = _schedule.ResultsRevision;
        Finalise(reviewed);

        Reopen(" Result appeal upheld ").Outcome.ShouldBe(WriteOutcome.Applied);

        _schedule.IsFinalised.ShouldBeFalse();
        _schedule.Finals.ShouldBe([new FinalRevision(1, reviewed, _owner, _at, "Result appeal upheld", _owner, _at)]);
        _schedule.DomainEvents.OfType<CompetitionReopened>().Single().ShouldBe(new CompetitionReopened(_schedule.Id, 1, reviewed, _owner, _at));
        Reopen("Again").Outcome.ShouldBe(WriteOutcome.Repeated);
    }

    [Fact]
    [Trait("covers", "competition-finalisation: Reopen and finalise again")]
    public void After_a_reopening_a_correction_and_a_new_review_add_final_revision_two()
    {
        ResolveAll();
        var first = _schedule.ResultsRevision;
        Finalise(first);
        Reopen("Result appeal upheld");
        CorrectFirstMatch();

        Finalise(_schedule.ResultsRevision).Outcome.ShouldBe(WriteOutcome.Applied);

        _schedule.Finals.ShouldBe([
            new FinalRevision(1, first, _owner, _at, "Result appeal upheld", _owner, _at),
            new FinalRevision(2, first + 1, _owner, _at)]);
        _schedule.Final!.Number.ShouldBe(2);
    }

    [Fact]
    [Trait("covers", "competition-finalisation: No reason")]
    public void A_reopening_without_a_reason_is_rejected_and_the_competition_stays_finalised()
    {
        ResolveAll();
        Finalise(_schedule.ResultsRevision);

        Reopen("  ").Broken.ShouldBe([new BrokenRule("reason", "required")]);
        Reopen(new string('x', Schedule.ReasonMaxLength + 1)).Broken.ShouldBe([new BrokenRule("reason", "too-long")]);
        _schedule.IsFinalised.ShouldBeTrue();
    }

    [Fact]
    public void A_running_competition_that_was_never_finalised_cannot_be_reopened()
    {
        Reopen("Result appeal upheld").Broken.ShouldBe([new BrokenRule("competition", "not-finalised")]);
    }

    [Fact]
    public void A_finalised_competition_cannot_be_finalised_at_another_revision()
    {
        ResolveAll();
        Finalise(_schedule.ResultsRevision);

        Finalise(_schedule.ResultsRevision + 1).Broken.ShouldBe([new BrokenRule("competition", "finalised")]);
    }
}
