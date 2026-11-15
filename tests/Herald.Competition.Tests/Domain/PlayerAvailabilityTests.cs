using Herald.Competition.Domain;
using Herald.Competition.Features;
using Shouldly;

namespace Herald.Competition.Tests.Domain;

public class PlayerAvailabilityTests
{
    private static readonly DateTimeOffset _at = new(2026, 11, 22, 13, 0, 0, TimeSpan.Zero);
    private readonly Guid _owner = Guid.NewGuid();
    private readonly Schedule _schedule;
    private readonly Match _match;
    private readonly List<Guid> _falcons = [.. Enumerable.Range(0, 7).Select(_ => Guid.NewGuid())];
    private readonly List<Guid> _stars = [.. Enumerable.Range(0, 7).Select(_ => Guid.NewGuid())];

    // Two five-a-side teams with seven frozen players each.
    public PlayerAvailabilityTests()
    {
        List<Entrant> teams = [new(Guid.NewGuid(), "Falcons", 1), new(Guid.NewGuid(), "Stars", 2)];
        _schedule = Schedule.Track(new TournamentId(Guid.NewGuid()), new EligibleField(1, true, [], teams));
        _schedule.Generate(Guid.NewGuid(), Seeding.AdmissionOrder, null, _schedule.Revision, _owner, _at);
        _schedule.Publish(_schedule.Revision, _owner, _at);
        _schedule.ApplyStart(1, _at, 5);
        _schedule.ApplyRosters(new(1, [
            new(teams[0].EntryId, 1, [.. _falcons.Select((id, index) => new RosterPlayer(id, $"Falcon {index}"))]),
            new(teams[1].EntryId, 1, [.. _stars.Select((id, index) => new RosterPlayer(id, $"Star {index}"))])]));
        _match = _schedule.ScheduleMatches().Single();
        Lineup(Side.First, _falcons[..5]).Outcome.ShouldBe(WriteOutcome.Applied);
        Lineup(Side.Second, _stars[..5]).Outcome.ShouldBe(WriteOutcome.Applied);
    }

    private Guid Falcons => _match.First;

    private WriteResult Lineup(Side side, IReadOnlyList<Guid> players) =>
        _match.RecordLineup(side, players, _schedule.RosterOf(_match.EntryOf(side)), _match.Revision, _owner, _at, _schedule.UnavailablePlayers);

    private WriteResult Start() =>
        _match.StartMatch(_schedule.RosterOf(_match.First), _schedule.RosterOf(_match.Second), _match.Revision, _owner, _at, _schedule.UnavailablePlayers);

    private WriteResult Sanction(Guid player) => _schedule.SanctionPlayer(Falcons, player, "Abusive conduct", _schedule.Revision, _owner, _at);

    [Fact]
    [Trait("covers", "match-lineups: A sanctioned starter")]
    public void A_start_with_a_sanctioned_starter_is_rejected_naming_the_player_and_a_revised_lineup_starts()
    {
        Sanction(_falcons[0]).Outcome.ShouldBe(WriteOutcome.Applied);

        // The side's rule once, and each unavailable starter by name.
        Start().Broken.ShouldBe([new BrokenRule("first-lineup", "unavailable"), new BrokenRule($"player-{_falcons[0]}", "unavailable")]);
        _schedule.UnavailablePlayers.ShouldBe([_falcons[0]]);

        Lineup(Side.First, _falcons[1..6]).Outcome.ShouldBe(WriteOutcome.Applied);
        Start().Outcome.ShouldBe(WriteOutcome.Applied);
    }

    [Fact]
    public void A_lineup_naming_an_unavailable_player_is_rejected_naming_the_player()
    {
        _schedule.WithdrawPlayer(Falcons, _falcons[5], null, _schedule.Revision, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);

        Lineup(Side.First, _falcons[1..6]).Broken.ShouldBe([new BrokenRule($"player-{_falcons[5]}", "unavailable")]);
    }

    [Fact]
    [Trait("covers", "match-lineups: A sanction after the lock")]
    public void A_sanction_while_the_match_is_in_play_leaves_the_locked_lineup_unchanged()
    {
        Start().Outcome.ShouldBe(WriteOutcome.Applied);
        var lineup = _match.CurrentLineup(Side.First);

        Sanction(_falcons[0]).Outcome.ShouldBe(WriteOutcome.Applied);

        _match.CurrentLineup(Side.First).ShouldBe(lineup);
        _match.Start!.FirstLineup.ShouldBe(lineup!.Number);
    }

    [Fact]
    [Trait("covers", "round-operations: A sanction lifted")]
    public void A_lifted_sanction_makes_the_player_available_again_and_keeps_both_actions()
    {
        Sanction(_falcons[0]);
        _schedule.UnavailablePlayers.ShouldContain(_falcons[0]);

        _schedule.LiftSanction(Falcons, _falcons[0], _schedule.Revision, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);

        _schedule.UnavailablePlayers.ShouldNotContain(_falcons[0]);
        _schedule.Players.Single().Sanctions.ShouldBe([new PlayerSanction("Abusive conduct", _owner, _at, _schedule.Revision - 1, _owner, _at, _schedule.Revision)]);
        Start().Outcome.ShouldBe(WriteOutcome.Applied);
    }

    [Fact]
    [Trait("covers", "round-operations: Too few eligible players")]
    public void With_three_of_seven_players_withdrawn_the_match_cannot_start_and_the_team_stays_active()
    {
        foreach (var player in _falcons[4..])
        {
            _schedule.WithdrawPlayer(Falcons, player, "Injured", _schedule.Revision, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);
        }

        _match.StartBlockers(_schedule.RosterOf(_match.First), _schedule.RosterOf(_match.Second), _schedule.UnavailablePlayers)
            .ShouldContain(new BrokenRule("first-roster", "too-few-eligible"));
        Start().Outcome.ShouldBe(WriteOutcome.Rejected);
        _schedule.StatusOf(Falcons).ShouldBe(EntrantStatus.Active);
        _schedule.RosterOf(Falcons)!.Count.ShouldBe(7);
    }

    [Fact]
    public void Repeats_change_nothing_and_a_player_off_the_roster_or_without_a_reason_is_rejected()
    {
        Sanction(_falcons[0]);
        var revision = _schedule.Revision;

        Sanction(_falcons[0]).Outcome.ShouldBe(WriteOutcome.Repeated);
        _schedule.SanctionPlayer(Falcons, _stars[0], "Late", _schedule.Revision, _owner, _at).Broken.ShouldBe([new BrokenRule("player", "not-on-roster")]);
        _schedule.SanctionPlayer(Falcons, _falcons[1], " ", _schedule.Revision, _owner, _at).Broken.ShouldBe([new BrokenRule("reason", "required")]);
        _schedule.LiftSanction(Falcons, _falcons[1], _schedule.Revision, _owner, _at).Broken.ShouldBe([new BrokenRule("player", "not-sanctioned")]);
        _schedule.Revision.ShouldBe(revision);
        _schedule.WithdrawPlayer(Falcons, _falcons[1], null, revision - 1, _owner, _at).Outcome.ShouldBe(WriteOutcome.Stale);
    }

    [Fact]
    [Trait("covers", "round-operations: A sanctioned starter")]
    public void The_operations_summary_lists_a_scheduled_match_whose_lineup_includes_a_sanctioned_player()
    {
        Sanction(_falcons[0]);

        var operations = ScheduleDetails.Of(_schedule, [_match]).Operations!;

        operations.Attention.ShouldBe([new AttentionDetails(_match.Id.Value, 1, new(Falcons, "Falcons"), new(_falcons[0], "Falcon 0"))]);
        (operations.Scheduled, operations.InPlay, operations.Resolved).ShouldBe((1, 0, 0));
        operations.Rounds.ShouldBe([new RoundStateDetails(1, RoundState.NotStarted)]);
    }

    [Fact]
    public void Two_sanctioned_starters_give_one_side_blocker_and_name_both_on_the_rejection()
    {
        Sanction(_falcons[0]);
        Sanction(_falcons[1]);

        _match.StartBlockers(_schedule.RosterOf(_match.First), _schedule.RosterOf(_match.Second), _schedule.UnavailablePlayers).ShouldBe([new BrokenRule("first-lineup", "unavailable")]);
        Start().Broken.ShouldBe([new BrokenRule("first-lineup", "unavailable"), new BrokenRule($"player-{_falcons[0]}", "unavailable"), new BrokenRule($"player-{_falcons[1]}", "unavailable")]);
    }
}
