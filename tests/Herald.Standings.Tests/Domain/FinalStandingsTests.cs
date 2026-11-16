using Herald.Standings.Domain;
using Shouldly;

namespace Herald.Standings.Tests.Domain;

public class FinalStandingsTests
{
    private static readonly DateTimeOffset _at = new(2026, 11, 29, 18, 0, 0, TimeSpan.Zero);
    private static readonly Entrant _robin = new(Guid.NewGuid(), "Robin Vale");
    private static readonly Entrant _sam = new(Guid.NewGuid(), "Sam Reed");

    private static TournamentResults Results(int revision, params Entrant[] entrants) => TournamentResults.Track(new TournamentId(Guid.NewGuid()), new(
        revision, entrants, [new(Guid.NewGuid(), 1, entrants[0].EntryId, entrants[1].EntryId, Outcome.First, "played", 2)], []));

    [Fact]
    [Trait("covers", "standings: Final standings")]
    public void Standings_finalised_at_their_results_revision_are_final_revision_one()
    {
        var results = Results(12, _robin, _sam);

        results.Finalise(1, 12, _at).ShouldBeTrue();
        results.Finalise(1, 12, _at).ShouldBeFalse();

        results.Final.ShouldBe(new FinalRevision(1, 12, _at));
        results.NoChampion.ShouldBeFalse();
    }

    [Fact]
    public void Standings_behind_the_finalised_results_are_not_final_until_they_apply_them()
    {
        var results = Results(11, _robin, _sam);
        results.Finalise(1, 12, _at);

        results.Final.ShouldBeNull();
        results.Apply(new(12, [_robin, _sam], results.Snapshot.Matches, [])).ShouldBeTrue();
        results.Final.ShouldNotBeNull().ResultsRevision.ShouldBe(12);
    }

    [Fact]
    public void A_reopening_makes_the_standings_provisional_and_keeps_the_final_revision_listed_whichever_arrives_first()
    {
        var results = Results(12, _robin, _sam);

        results.Reopen(1, 12, _at).ShouldBeTrue();
        results.Finalise(1, 12, _at).ShouldBeFalse();
        results.Reopen(1, 12, _at).ShouldBeFalse();

        results.Final.ShouldBeNull();
        results.Finals.ShouldBe([new FinalRevision(1, 12, _at, true)]);
    }

    [Fact]
    [Trait("covers", "standings: No active entrant")]
    public void Final_standings_where_every_entrant_withdrew_keep_points_and_flags_and_declare_no_champion()
    {
        var results = Results(12, _robin with { Status = EntrantStatus.Withdrawn }, _sam with { Status = EntrantStatus.Disqualified });

        results.Finalise(1, 12, _at);

        results.NoChampion.ShouldBeTrue();
        var rows = results.Table().Rows;
        rows.Select(row => (row.Entrant.Status, row.Points)).ShouldBe([(EntrantStatus.Withdrawn, 3), (EntrantStatus.Disqualified, 0)]);
    }
}
