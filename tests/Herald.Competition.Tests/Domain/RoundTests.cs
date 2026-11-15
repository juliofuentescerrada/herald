using Herald.Competition.Domain;
using Shouldly;

namespace Herald.Competition.Tests.Domain;

public class RoundTests
{
    private static readonly DateTimeOffset _at = new(2026, 11, 22, 11, 0, 0, TimeSpan.Zero);
    private readonly Guid _owner = Guid.NewGuid();

    private static Match Individual(int round) => Match.Schedule(new TournamentId(Guid.NewGuid()), new Pairing(round, Guid.NewGuid(), Guid.NewGuid()), null);

    [Fact]
    [Trait("covers", "round-operations: A round resolved administratively")]
    public void A_round_resolved_entirely_by_absences_and_a_no_contest_is_completed()
    {
        List<Match> round = [Individual(2), Individual(2)];
        round[0].RecordAdministrative(Guid.NewGuid(), Cause.DoubleAbsence, null, null, null, round[0].Revision, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);
        round[1].RecordAdministrative(Guid.NewGuid(), Cause.NoContest, null, false, "Venue closed", round[1].Revision, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);

        Rounds.StateOf(round).ShouldBe(RoundState.Completed);
    }

    [Fact]
    [Trait("covers", "round-operations: One match left")]
    public void A_round_with_one_match_in_play_and_the_others_resolved_is_running()
    {
        List<Match> round = [Individual(1), Individual(1)];
        round[0].RecordPlayed(Guid.NewGuid(), Outcome.First, round[0].Revision, _owner, _at);
        round[1].StartMatch(null, null, round[1].Revision, _owner, _at);

        Rounds.StateOf(round).ShouldBe(RoundState.Running);
    }

    [Fact]
    public void A_round_is_not_started_until_a_match_starts_and_a_later_round_may_complete_first()
    {
        List<Match> matches = [Individual(1), Individual(2)];
        matches[1].RecordPlayed(Guid.NewGuid(), Outcome.Draw, matches[1].Revision, _owner, _at);

        Rounds.Of(matches).ShouldBe([(1, RoundState.NotStarted), (2, RoundState.Completed)]);
    }
}
