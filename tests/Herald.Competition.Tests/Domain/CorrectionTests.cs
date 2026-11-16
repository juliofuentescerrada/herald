using Herald.Competition.Domain;
using Shouldly;

namespace Herald.Competition.Tests.Domain;

public class CorrectionTests
{
    private static readonly DateTimeOffset _at = new(2026, 11, 22, 10, 40, 0, TimeSpan.Zero);
    private static readonly DateTimeOffset _later = _at.AddHours(1);
    private readonly Guid _owner = Guid.NewGuid();
    private readonly Guid _corrector = Guid.NewGuid();

    private static Match Individual() => Match.Schedule(new TournamentId(Guid.NewGuid()), new Pairing(1, Guid.NewGuid(), Guid.NewGuid()), null);

    private Match Won()
    {
        var match = Individual();
        match.RecordPlayed(Guid.NewGuid(), Outcome.First, match.Revision, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);
        return match;
    }

    private WriteResult Correct(
        Match match, Cause cause, Outcome? outcome = null, Side? entrant = null, bool? played = null, string? reason = "Score sheet misread",
        Guid? operation = null, int? revision = null) =>
        match.Correct(operation ?? Guid.NewGuid(), cause, outcome, entrant, played, null, reason, revision ?? match.Revision, _corrector, _later);

    [Fact]
    [Trait("covers", "result-corrections: A win corrected to a draw")]
    public void A_win_corrected_to_a_draw_keeps_the_win_in_its_history()
    {
        var match = Won();
        var win = match.Resolution!;
        var revision = match.Revision;

        Correct(match, Cause.Played, Outcome.Draw).Outcome.ShouldBe(WriteOutcome.Applied);

        (match.Resolution!.Outcome, match.Resolution.Cause, match.Resolution.Played, match.Resolution.RecordedBy).ShouldBe((Outcome.Draw, Cause.Played, true, _corrector));
        var replaced = match.ReplacedResolutions.ShouldHaveSingleItem();
        (replaced.Resolution, replaced.ReplacedBy, replaced.ReplacedAt, replaced.Reason, replaced.MatchRevision).ShouldBe((win, _corrector, _later, "Score sheet misread", revision));
        match.Revision.ShouldBe(revision + 1);
        match.DomainEvents.OfType<ResultCorrected>().ShouldHaveSingleItem().Outcome.ShouldBe(Outcome.Draw);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("  ")]
    [Trait("covers", "result-corrections: No reason")]
    public void A_correction_without_a_reason_is_rejected_and_the_match_is_unchanged(string? reason)
    {
        var match = Won();
        var win = match.Resolution;

        var result = Correct(match, Cause.Played, Outcome.Draw, reason: reason);

        result.Broken.ShouldContain(new BrokenRule("correction-reason", "required"));
        match.Resolution.ShouldBe(win);
        match.ReplacedResolutions.ShouldBeEmpty();
    }

    [Fact]
    public void A_reason_longer_than_500_characters_is_rejected() =>
        Correct(Won(), Cause.Played, Outcome.Draw, reason: new string('x', 501)).Broken.ShouldContain(new BrokenRule("correction-reason", "too-long"));

    [Fact]
    [Trait("covers", "result-corrections: A scheduled match")]
    public void A_match_that_is_not_resolved_is_resolved_not_corrected()
    {
        var match = Individual();

        Correct(match, Cause.Played, Outcome.Draw).Broken.ShouldBe([new("match", "not-resolved")]);
        match.Resolution.ShouldBeNull();
    }

    [Fact]
    public void The_same_resolution_is_nothing_to_correct() =>
        Correct(Won(), Cause.Played, Outcome.First).Broken.ShouldBe([new("resolution", "unchanged")]);

    [Fact]
    [Trait("covers", "result-corrections: A played match corrected to an absence")]
    public void A_played_match_cannot_become_an_absence()
    {
        var match = Won();

        Correct(match, Cause.SingleAbsence, entrant: Side.First).Broken.ShouldContain(new BrokenRule("played", "recorded"));
        match.Resolution!.Cause.ShouldBe(Cause.Played);
    }

    [Fact]
    public void A_played_match_may_become_a_concession_after_play_and_keeps_its_play()
    {
        var match = Won();

        Correct(match, Cause.Concession, entrant: Side.First, played: true).Outcome.ShouldBe(WriteOutcome.Applied);

        (match.Resolution!.Outcome, match.Resolution.Cause, match.Resolution.Played).ShouldBe((Outcome.Second, Cause.Concession, true));
    }

    [Fact]
    public void A_played_match_cannot_become_a_concession_before_play() =>
        Correct(Won(), Cause.Concession, entrant: Side.First, played: false).Broken.ShouldContain(new BrokenRule("played", "recorded"));

    [Fact]
    public void A_correction_of_a_team_match_keeps_its_appearances()
    {
        List<Guid> falcons = [.. Enumerable.Range(0, 5).Select(_ => Guid.NewGuid())];
        List<Guid> stars = [.. Enumerable.Range(0, 5).Select(_ => Guid.NewGuid())];
        var match = Match.Schedule(new TournamentId(Guid.NewGuid()), new Pairing(1, Guid.NewGuid(), Guid.NewGuid()), 5);
        match.RecordLineup(Side.First, falcons, falcons, match.Revision, _owner, _at);
        match.RecordLineup(Side.Second, stars, stars, match.Revision, _owner, _at);
        match.StartMatch(falcons, stars, match.Revision, _owner, _at);
        match.RecordPlayed(Guid.NewGuid(), Outcome.First, match.Revision, _owner, _at);

        Correct(match, Cause.NoContest, played: true, reason: "Wrong venue").Outcome.ShouldBe(WriteOutcome.Rejected);
        match.Correct(Guid.NewGuid(), Cause.NoContest, null, null, true, "Wrong venue", "Misreported", match.Revision, _corrector, _later).Outcome.ShouldBe(WriteOutcome.Applied);

        match.Resolution!.Appearances.ShouldBe([.. falcons, .. stars]);
        match.Resolution.Reason.ShouldBe("Wrong venue");
    }

    [Fact]
    [Trait("covers", "result-corrections: A team absence corrected to a played win")]
    public void A_team_match_that_never_started_cannot_become_a_played_win()
    {
        var match = Match.Schedule(new TournamentId(Guid.NewGuid()), new Pairing(1, Guid.NewGuid(), Guid.NewGuid()), 5);
        match.RecordAdministrative(Guid.NewGuid(), Cause.SingleAbsence, Side.Second, null, null, match.Revision, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);

        Correct(match, Cause.Played, Outcome.First).Broken.ShouldBe([new("match", "not-started")]);
        match.Resolution!.Cause.ShouldBe(Cause.SingleAbsence);
    }

    [Fact]
    public void An_individual_absence_may_become_a_played_result()
    {
        var match = Individual();
        match.RecordAdministrative(Guid.NewGuid(), Cause.DoubleAbsence, null, null, null, match.Revision, _owner, _at);

        Correct(match, Cause.Played, Outcome.Second).Outcome.ShouldBe(WriteOutcome.Applied);

        (match.Resolution!.Outcome, match.Resolution.Played).ShouldBe((Outcome.Second, true));
        match.Start.ShouldNotBeNull().StartedBy.ShouldBe(_corrector);
        match.DomainEvents.OfType<MatchStarted>().ShouldHaveSingleItem();
    }

    [Fact]
    public void The_same_operation_with_another_reason_conflicts()
    {
        var match = Won();
        var operation = Guid.NewGuid();
        Correct(match, Cause.Played, Outcome.Draw, operation: operation);

        Correct(match, Cause.Played, Outcome.Draw, reason: "Another reason", operation: operation).Outcome.ShouldBe(WriteOutcome.Stale);
        match.ReplacedResolutions.ShouldHaveSingleItem().Reason.ShouldBe("Score sheet misread");
    }

    [Fact]
    public void A_retried_result_still_returns_once_the_match_was_corrected()
    {
        var match = Individual();
        var operation = Guid.NewGuid();
        match.RecordPlayed(operation, Outcome.First, match.Revision, _owner, _at);
        Correct(match, Cause.Played, Outcome.Draw);

        match.RecordPlayed(operation, Outcome.First, 1, _owner, _at).Outcome.ShouldBe(WriteOutcome.Repeated);
        match.Resolution!.Outcome.ShouldBe(Outcome.Draw);
    }

    [Fact]
    [Trait("covers", "result-corrections: A lost response")]
    public void A_correction_repeated_with_its_operation_is_recorded_once()
    {
        var match = Won();
        var operation = Guid.NewGuid();
        Correct(match, Cause.Played, Outcome.Draw, operation: operation);
        var revision = match.Revision;

        Correct(match, Cause.Played, Outcome.Draw, operation: operation, revision: revision - 1).Outcome.ShouldBe(WriteOutcome.Repeated);

        match.ReplacedResolutions.ShouldHaveSingleItem();
        match.Revision.ShouldBe(revision);
    }

    [Fact]
    public void The_same_operation_with_other_content_conflicts()
    {
        var match = Won();
        var operation = Guid.NewGuid();
        Correct(match, Cause.Played, Outcome.Draw, operation: operation);

        Correct(match, Cause.Played, Outcome.Second, operation: operation).Outcome.ShouldBe(WriteOutcome.Stale);
        match.Resolution!.Outcome.ShouldBe(Outcome.Draw);
    }

    [Fact]
    [Trait("covers", "result-corrections: Changed elsewhere")]
    public void A_correction_based_on_an_earlier_revision_is_rejected_without_a_change()
    {
        var match = Won();
        var win = match.Resolution;

        Correct(match, Cause.Played, Outcome.Draw, revision: match.Revision - 1).Outcome.ShouldBe(WriteOutcome.Stale);

        match.Resolution.ShouldBe(win);
    }

    [Fact]
    public void A_departure_outcome_may_be_corrected()
    {
        var match = Individual();
        match.ResolveForDeparture(Guid.NewGuid(), Side.First, null, _owner, _at).ShouldBeTrue();

        Correct(match, Cause.DoubleAbsence).Outcome.ShouldBe(WriteOutcome.Applied);

        match.Resolution!.Cause.ShouldBe(Cause.DoubleAbsence);
        match.ReplacedResolutions.ShouldHaveSingleItem().Resolution.Cause.ShouldBe(Cause.SingleAbsence);
    }
}
