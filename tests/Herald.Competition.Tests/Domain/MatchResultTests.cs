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
}
