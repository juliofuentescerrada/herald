using Herald.Competition.Domain;
using Shouldly;

namespace Herald.Competition.Tests.Domain;

public class MatchResultTests
{
    private static readonly DateTimeOffset _at = new(2026, 11, 22, 10, 40, 0, TimeSpan.Zero);
    private readonly Guid _owner = Guid.NewGuid();
    private readonly List<Guid> _falcons = [.. Enumerable.Range(0, 7).Select(_ => Guid.NewGuid())];
    private readonly List<Guid> _stars = [.. Enumerable.Range(0, 7).Select(_ => Guid.NewGuid())];

    private static Match Individual() => Match.Schedule(new TournamentId(Guid.NewGuid()), new Pairing(1, Guid.NewGuid(), Guid.NewGuid()), null);

    private Match TeamMatch(bool started)
    {
        var match = Match.Schedule(new TournamentId(Guid.NewGuid()), new Pairing(1, Guid.NewGuid(), Guid.NewGuid()), 5);
        match.RecordLineup(Side.First, _falcons[..5], _falcons, match.Revision, _owner, _at);
        match.RecordLineup(Side.Second, _stars[..5], _stars, match.Revision, _owner, _at);
        if (started)
        {
            match.StartMatch(_falcons, _stars, match.Revision, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);
        }

        return match;
    }

    private WriteResult Record(Match match, Outcome outcome, Guid? operation = null) =>
        match.RecordPlayed(operation ?? Guid.NewGuid(), outcome, match.Revision, _owner, _at);

    [Fact]
    [Trait("covers", "match-results: A win")]
    public void A_win_resolves_the_match_as_played_with_who_and_when()
    {
        var match = Individual();
        match.StartMatch(null, null, match.Revision, _owner, _at);

        Record(match, Outcome.First).Outcome.ShouldBe(WriteOutcome.Applied);

        match.State.ShouldBe(MatchState.Resolved);
        match.Resolution.ShouldNotBeNull();
        (match.Resolution.Outcome, match.Resolution.Cause, match.Resolution.Played, match.Resolution.RecordedBy, match.Resolution.RecordedAt)
            .ShouldBe((Outcome.First, Cause.Played, true, _owner, _at));
    }

    [Fact]
    [Trait("covers", "match-results: A draw")]
    public void A_draw_resolves_the_match_as_played()
    {
        var match = Individual();

        Record(match, Outcome.Draw);

        match.Resolution!.Outcome.ShouldBe(Outcome.Draw);
        match.Resolution.Cause.ShouldBe(Cause.Played);
    }

    [Fact]
    [Trait("covers", "match-results: A scheduled individual match")]
    public void A_played_result_on_a_scheduled_individual_match_starts_and_resolves_it_at_once()
    {
        var match = Individual();

        Record(match, Outcome.Second);

        match.Start.ShouldBe(new MatchStart(_owner, _at, null, null));
        match.State.ShouldBe(MatchState.Resolved);
        match.Resolution!.Appearances.ShouldBeEmpty();
    }

    [Fact]
    [Trait("covers", "match-results: A team match not started")]
    public void A_played_result_on_a_team_match_not_started_is_rejected()
    {
        var match = TeamMatch(started: false);

        Record(match, Outcome.First).Broken.ShouldBe([new BrokenRule("match", "not-started")]);
        match.State.ShouldBe(MatchState.Scheduled);
    }

    [Fact]
    [Trait("covers", "match-results: Reserves")]
    public void The_locked_starters_get_an_appearance_and_the_reserves_none()
    {
        var match = TeamMatch(started: true);

        Record(match, Outcome.First);

        match.Resolution!.Appearances.ShouldBe([.. _falcons[..5], .. _stars[..5]]);
        match.Resolution.Appearances.ShouldNotContain(_falcons[5]);
    }

    [Fact]
    [Trait("covers", "match-results: A double submission")]
    public void The_same_operation_twice_leaves_one_result()
    {
        var match = Individual();
        var operation = Guid.NewGuid();
        Record(match, Outcome.First, operation);
        var revision = match.Revision;

        match.RecordPlayed(operation, Outcome.First, revision - 1, _owner, _at).Outcome.ShouldBe(WriteOutcome.Repeated);
        match.Revision.ShouldBe(revision);
    }

    [Fact]
    [Trait("covers", "match-results: A second result")]
    public void A_different_result_on_a_resolved_match_is_rejected_and_the_first_stands()
    {
        var match = Individual();
        Record(match, Outcome.First);

        Record(match, Outcome.Second).Broken.ShouldBe([new BrokenRule("match", "resolved")]);
        match.Resolution!.Outcome.ShouldBe(Outcome.First);
    }

    [Fact]
    public void An_undefined_outcome_is_rejected_and_nothing_is_stored()
    {
        var match = Individual();

        Record(match, (Outcome)7).Broken.ShouldBe([new BrokenRule("outcome", "unknown")]);
        match.Resolution.ShouldBeNull();
        match.Start.ShouldBeNull();
    }

    [Fact]
    public void A_one_step_result_records_the_start_as_an_event_too()
    {
        var match = Individual();

        Record(match, Outcome.First);

        match.DomainEvents.OfType<MatchStarted>().ShouldHaveSingleItem();
        match.DomainEvents.OfType<MatchResolved>().ShouldHaveSingleItem();
    }

    [Fact]
    public void A_second_result_from_a_stale_revision_hears_that_the_match_is_resolved()
    {
        var match = Individual();
        Record(match, Outcome.First);

        match.RecordPlayed(Guid.NewGuid(), Outcome.Second, 1, _owner, _at).Broken.ShouldBe([new BrokenRule("match", "resolved")]);
    }

    [Fact]
    public void A_result_on_an_older_revision_is_stale()
    {
        var match = Individual();

        match.RecordPlayed(Guid.NewGuid(), Outcome.First, match.Revision + 1, _owner, _at).Outcome.ShouldBe(WriteOutcome.Stale);
    }

    [Fact]
    public void A_resolved_match_takes_no_lineup()
    {
        var match = TeamMatch(started: true);
        Record(match, Outcome.First);

        match.RecordLineup(Side.First, _falcons[2..], _falcons, match.Revision, _owner, _at).Broken.ShouldBe([new BrokenRule("match", "started")]);
    }

    private WriteResult Administrative(Match match, Cause cause, Side? entrant = null, bool? played = null, string? reason = null, Guid? operation = null) =>
        match.RecordAdministrative(operation ?? Guid.NewGuid(), cause, entrant, played, reason, match.Revision, _owner, _at);

    [Fact]
    [Trait("covers", "match-results: Before play")]
    public void A_concession_before_play_makes_the_opponent_win_with_no_play_and_no_appearance()
    {
        var match = TeamMatch(started: false);

        Administrative(match, Cause.Concession, Side.First, played: false).Outcome.ShouldBe(WriteOutcome.Applied);

        match.State.ShouldBe(MatchState.Resolved);
        (match.Resolution!.Outcome, match.Resolution.Cause, match.Resolution.Played).ShouldBe((Outcome.Second, Cause.Concession, false));
        match.Resolution.Appearances.ShouldBeEmpty();
        match.Start.ShouldBeNull();
    }

    [Fact]
    [Trait("covers", "match-results: After play in a team match")]
    public void A_concession_after_play_keeps_the_locked_lineups_appearances()
    {
        var match = TeamMatch(started: true);

        Administrative(match, Cause.Concession, Side.Second, played: true);

        match.Resolution!.Outcome.ShouldBe(Outcome.First);
        match.Resolution.Played.ShouldBeTrue();
        match.Resolution.Appearances.ShouldBe([.. _falcons[..5], .. _stars[..5]]);
    }

    [Fact]
    [Trait("covers", "match-results: A single absence")]
    public void A_single_absence_makes_the_opponent_win_and_records_no_play()
    {
        var match = Individual();

        Administrative(match, Cause.SingleAbsence, Side.Second, played: true).Outcome.ShouldBe(WriteOutcome.Applied);

        (match.Resolution!.Outcome, match.Resolution.Cause, match.Resolution.Played).ShouldBe((Outcome.First, Cause.SingleAbsence, false));
        match.Resolution.Appearances.ShouldBeEmpty();

        // Not withdrawn: the absent entrant's next match still takes a played result.
        var later = Match.Schedule(match.TournamentId, new Pairing(2, match.Second, Guid.NewGuid()), null);
        Record(later, Outcome.First).Outcome.ShouldBe(WriteOutcome.Applied);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void A_match_resolved_without_a_start_cannot_be_started(bool team)
    {
        var match = team ? TeamMatch(started: false) : Individual();
        Administrative(match, Cause.Concession, Side.First, played: false);

        match.StartMatch(_falcons, _stars, match.Revision, _owner, _at).Broken.ShouldBe([new BrokenRule("match", "resolved")]);
        match.Start.ShouldBeNull();
        match.DomainEvents.OfType<MatchStarted>().ShouldBeEmpty();
    }

    [Fact]
    [Trait("covers", "match-results: A double absence")]
    public void A_double_absence_resolves_the_match_with_no_winner_and_no_appearances()
    {
        var match = TeamMatch(started: false);

        Administrative(match, Cause.DoubleAbsence);

        (match.Resolution!.Outcome, match.Resolution.Cause, match.Resolution.Played).ShouldBe((Outcome.None, Cause.DoubleAbsence, false));
        match.Resolution.Appearances.ShouldBeEmpty();
    }

    [Theory]
    [Trait("covers", "match-results: An absence after start")]
    [InlineData(Cause.SingleAbsence)]
    [InlineData(Cause.DoubleAbsence)]
    public void An_absence_on_a_match_in_play_is_rejected(Cause cause)
    {
        var match = TeamMatch(started: true);

        Administrative(match, cause, Side.First).Broken.ShouldBe([new BrokenRule("match", "started")]);
        match.State.ShouldBe(MatchState.InPlay);
    }

    [Fact]
    [Trait("covers", "match-results: A no contest after play")]
    public void A_no_contest_after_play_keeps_the_reason_and_the_appearances_with_no_winner()
    {
        var match = TeamMatch(started: true);

        Administrative(match, Cause.NoContest, played: true, reason: " Venue closed ");

        (match.Resolution!.Outcome, match.Resolution.Cause, match.Resolution.Played, match.Resolution.Reason)
            .ShouldBe((Outcome.None, Cause.NoContest, true, "Venue closed"));
        match.Resolution.Appearances.Count.ShouldBe(10);
    }

    [Theory]
    [Trait("covers", "match-results: No reason")]
    [InlineData(null)]
    [InlineData("   ")]
    public void A_no_contest_without_a_reason_is_rejected(string? reason)
    {
        var match = Individual();

        Administrative(match, Cause.NoContest, played: false, reason: reason).Broken.ShouldBe([new BrokenRule("reason", "required")]);
        match.Resolution.ShouldBeNull();
    }

    [Fact]
    public void A_no_contest_reason_longer_than_500_characters_is_rejected()
    {
        var match = Individual();

        Administrative(match, Cause.NoContest, played: false, reason: new string('x', 501)).Broken.ShouldBe([new BrokenRule("reason", "too-long")]);
    }

    [Theory]
    [Trait("covers", "match-results: Play claimed on an unstarted team match")]
    [InlineData(Cause.Concession)]
    [InlineData(Cause.NoContest)]
    public void Play_claimed_on_an_unstarted_team_match_is_rejected(Cause cause)
    {
        var match = TeamMatch(started: false);

        Administrative(match, cause, Side.First, played: true, reason: "Venue closed").Broken.ShouldBe([new BrokenRule("match", "not-started")]);
        match.State.ShouldBe(MatchState.Scheduled);
    }

    [Fact]
    public void A_concession_without_its_entrant_or_whether_play_took_place_names_both()
    {
        var match = Individual();

        Administrative(match, Cause.Concession).Broken.ShouldBe([new BrokenRule("entrant", "required"), new BrokenRule("played", "required")]);
    }

    [Theory]
    [InlineData(Cause.Played)]
    [InlineData((Cause)9)]
    public void An_administrative_write_with_a_played_or_unknown_cause_is_rejected(Cause cause)
    {
        Administrative(Individual(), cause, Side.First, played: false).Broken.ShouldBe([new BrokenRule("cause", "unknown")]);
    }

    [Fact]
    public void A_played_result_cannot_have_no_winner()
    {
        Record(Individual(), Outcome.None).Broken.ShouldBe([new BrokenRule("outcome", "unknown")]);
    }

    [Fact]
    public void A_concession_on_a_resolved_match_is_rejected_and_its_repeat_is_answered_with_the_first()
    {
        var match = Individual();
        var operation = Guid.NewGuid();
        Administrative(match, Cause.Concession, Side.First, played: false, operation: operation);

        Administrative(match, Cause.Concession, Side.First, played: false, operation: operation).Outcome.ShouldBe(WriteOutcome.Repeated);
        Administrative(match, Cause.NoContest, played: false, reason: "Late").Broken.ShouldBe([new BrokenRule("match", "resolved")]);
        match.Resolution!.Cause.ShouldBe(Cause.Concession);
    }
}
