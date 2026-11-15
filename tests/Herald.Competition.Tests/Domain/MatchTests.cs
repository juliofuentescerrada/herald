using Herald.Competition.Domain;
using Shouldly;

namespace Herald.Competition.Tests.Domain;

public class MatchTests
{
    private static readonly DateTimeOffset _at = new(2026, 11, 22, 10, 20, 0, TimeSpan.Zero);
    private readonly Guid _owner = Guid.NewGuid();
    private readonly List<Guid> _falcons = [.. Enumerable.Range(0, 7).Select(_ => Guid.NewGuid())];
    private readonly List<Guid> _stars = [.. Enumerable.Range(0, 7).Select(_ => Guid.NewGuid())];

    private static Schedule Started(int entrants, int? activePlayers = null)
    {
        var field = Enumerable.Range(1, entrants).Select(index => new Entrant(Guid.NewGuid(), $"Entrant {index}", index)).ToList();
        var schedule = Schedule.Track(new TournamentId(Guid.NewGuid()), new EligibleField(1, true, [], field));
        schedule.Generate(Guid.NewGuid(), Seeding.AdmissionOrder, null, schedule.Revision, Guid.Empty, _at);
        schedule.Publish(schedule.Revision, Guid.Empty, _at);
        schedule.ApplyStart(1, _at, activePlayers);
        return schedule;
    }

    private static Match TeamMatch(int round = 1) => Match.Schedule(new TournamentId(Guid.NewGuid()), new Pairing(round, Guid.NewGuid(), Guid.NewGuid()), 5);

    private WriteResult Record(Match match, Side side, IReadOnlyList<Guid> players) =>
        match.RecordLineup(side, players, side == Side.First ? _falcons : _stars, match.Revision, _owner, _at);

    private WriteResult StartMatch(Match match) => match.StartMatch(_falcons, _stars, match.Revision, _owner, _at);

    [Fact]
    [Trait("covers", "match-lineups: Four players")]
    public void Four_players_give_six_scheduled_matches_over_three_rounds()
    {
        var matches = Started(4).ScheduleMatches();

        matches.Count.ShouldBe(6);
        matches.Select(match => match.Round).Distinct().Count().ShouldBe(3);
        matches.ShouldAllBe(match => match.State == MatchState.Scheduled && !match.IsTeamMatch);
    }

    [Fact]
    [Trait("covers", "match-lineups: Five players")]
    public void Five_players_give_ten_matches_and_rests_stay_rests()
    {
        var schedule = Started(5);

        schedule.ScheduleMatches().Count.ShouldBe(10);
        schedule.StartedPairings!.Rests.Select(rest => rest.EntryId).Order().ShouldBe(schedule.Field.Entrants.Select(entrant => entrant.EntryId).Order());
    }

    [Fact]
    public void A_competition_not_started_has_no_matches()
    {
        var field = new List<Entrant> { new(Guid.NewGuid(), "A", 1), new(Guid.NewGuid(), "B", 2) };

        Schedule.Track(new TournamentId(Guid.NewGuid()), new EligibleField(1, true, [], field)).ScheduleMatches().ShouldBeEmpty();
    }

    [Fact]
    public void A_team_tournament_schedules_team_matches_with_the_lineup_size()
    {
        Started(4, 5).ScheduleMatches().ShouldAllBe(match => match.ActivePlayers == 5);
    }

    [Fact]
    [Trait("covers", "match-lineups: Five of seven")]
    public void Five_players_of_a_seven_player_frozen_roster_make_a_lineup()
    {
        var match = TeamMatch();

        Record(match, Side.First, _falcons[..5]).Outcome.ShouldBe(WriteOutcome.Applied);

        match.CurrentLineup(Side.First)!.Players.ShouldBe(_falcons[..5]);
        match.CurrentLineup(Side.First)!.RecordedBy.ShouldBe(_owner);
    }

    [Fact]
    [Trait("covers", "match-lineups: Four starters")]
    public void Four_starters_are_rejected_when_five_are_required()
    {
        var match = TeamMatch();

        Record(match, Side.First, _falcons[..4]).Broken.ShouldBe([new BrokenRule("players", "count")]);
        match.CurrentLineup(Side.First).ShouldBeNull();
    }

    [Fact]
    [Trait("covers", "match-lineups: A player outside the frozen roster")]
    public void A_player_outside_the_frozen_roster_is_rejected()
    {
        var match = TeamMatch();

        Record(match, Side.First, [.. _falcons[..4], _stars[0]]).Broken.ShouldBe([new BrokenRule($"player-{_stars[0]}", "not-on-roster")]);
    }

    [Fact]
    public void The_same_player_twice_is_rejected()
    {
        var match = TeamMatch();

        Record(match, Side.First, [.. _falcons[..4], _falcons[0]]).Broken.ShouldBe([new BrokenRule("players", "duplicate")]);
    }

    [Fact]
    [Trait("covers", "match-lineups: A revision before start")]
    public void A_second_lineup_before_start_becomes_current_and_keeps_the_first()
    {
        var match = TeamMatch();
        Record(match, Side.First, _falcons[..5]);

        Record(match, Side.First, _falcons[2..]).Outcome.ShouldBe(WriteOutcome.Applied);

        match.FirstLineups.Select(lineup => lineup.Number).ShouldBe([1, 2]);
        match.CurrentLineup(Side.First)!.Players.ShouldBe(_falcons[2..]);
    }

    [Fact]
    public void Recording_the_current_lineup_again_is_a_repeat()
    {
        var match = TeamMatch();
        Record(match, Side.First, _falcons[..5]);

        Record(match, Side.First, [.. _falcons[..5].AsEnumerable().Reverse()]).Outcome.ShouldBe(WriteOutcome.Repeated);
        match.FirstLineups.Count.ShouldBe(1);
    }

    [Fact]
    public void A_lineup_on_an_older_revision_is_stale()
    {
        var match = TeamMatch();

        match.RecordLineup(Side.First, _falcons[..5], _falcons, match.Revision + 1, _owner, _at).Outcome.ShouldBe(WriteOutcome.Stale);
    }

    [Fact]
    [Trait("covers", "match-lineups: Rosters not yet reported")]
    public void A_lineup_is_rejected_while_the_frozen_roster_is_unknown()
    {
        var match = TeamMatch();

        match.RecordLineup(Side.First, _falcons[..5], null, match.Revision, _owner, _at).Broken.ShouldBe([new BrokenRule("roster", "unknown")]);
    }

    [Fact]
    public void An_individual_match_takes_no_lineup()
    {
        var match = Match.Schedule(new TournamentId(Guid.NewGuid()), new Pairing(1, Guid.NewGuid(), Guid.NewGuid()), null);

        Record(match, Side.First, _falcons[..5]).Broken.ShouldBe([new BrokenRule("match", "individual")]);
    }

    [Fact]
    [Trait("covers", "match-lineups: A valid team start")]
    public void A_team_match_with_two_valid_lineups_starts_and_locks_them()
    {
        var match = TeamMatch();
        Record(match, Side.First, _falcons[..5]);
        Record(match, Side.Second, _stars[..5]);

        StartMatch(match).Outcome.ShouldBe(WriteOutcome.Applied);

        match.State.ShouldBe(MatchState.InPlay);
        match.Start.ShouldBe(new MatchStart(_owner, _at, 1, 1));
    }

    [Fact]
    [Trait("covers", "match-lineups: A side without a lineup")]
    public void A_side_without_a_lineup_blocks_the_start()
    {
        var match = TeamMatch();
        Record(match, Side.First, _falcons[..5]);

        StartMatch(match).Broken.ShouldBe([new BrokenRule("second-lineup", "missing")]);
        match.State.ShouldBe(MatchState.Scheduled);
    }

    [Fact]
    public void A_player_on_both_sides_blocks_the_start()
    {
        var match = TeamMatch();
        Record(match, Side.First, _falcons[..5]);
        match.RecordLineup(Side.Second, [.. _stars[..4], _falcons[0]], [.. _stars, _falcons[0]], match.Revision, _owner, _at);

        match.StartBlockers(_falcons, [.. _stars, _falcons[0]]).ShouldBe([new BrokenRule("players", "both-sides")]);
    }

    [Fact]
    [Trait("covers", "match-lineups: A later round first")]
    public void A_later_round_match_starts_on_its_own_checks()
    {
        var match = Match.Schedule(new TournamentId(Guid.NewGuid()), new Pairing(3, Guid.NewGuid(), Guid.NewGuid()), null);

        StartMatch(match).Outcome.ShouldBe(WriteOutcome.Applied);
        match.State.ShouldBe(MatchState.InPlay);
    }

    [Fact]
    public void Starting_again_is_a_repeat()
    {
        var match = Match.Schedule(new TournamentId(Guid.NewGuid()), new Pairing(1, Guid.NewGuid(), Guid.NewGuid()), null);
        StartMatch(match);

        StartMatch(match).Outcome.ShouldBe(WriteOutcome.Repeated);
    }

    [Fact]
    [Trait("covers", "match-lineups: A lineup after start")]
    public void A_lineup_after_start_is_rejected_and_the_locked_one_stays()
    {
        var match = TeamMatch();
        Record(match, Side.First, _falcons[..5]);
        Record(match, Side.Second, _stars[..5]);
        StartMatch(match);

        Record(match, Side.First, _falcons[2..]).Broken.ShouldBe([new BrokenRule("match", "started")]);
        match.CurrentLineup(Side.First)!.Number.ShouldBe(1);
    }

    [Fact]
    [Trait("covers", "match-lineups: Started, not played")]
    public void A_start_records_the_locked_lineups_and_nothing_more()
    {
        var match = TeamMatch();
        Record(match, Side.First, _falcons[..5]);
        Record(match, Side.Second, _stars[..5]);

        StartMatch(match);

        // The start keeps lineup numbers only: appearances come with a played result (h1-operator-results).
        match.Start!.FirstLineup.ShouldBe(1);
        match.DomainEvents.OfType<MatchStarted>().ShouldHaveSingleItem();
    }
}
