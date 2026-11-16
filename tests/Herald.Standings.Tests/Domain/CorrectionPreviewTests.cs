using Herald.Standings.Domain;
using Shouldly;

namespace Herald.Standings.Tests.Domain;

public class CorrectionPreviewTests
{
    private static readonly Entrant _robin = new(Guid.NewGuid(), "Robin Vale");
    private static readonly Entrant _sam = new(Guid.NewGuid(), "Sam Reed");
    private static readonly Entrant _jamie = new(Guid.NewGuid(), "Jamie Brook");
    private static readonly Entrant _taylor = new(Guid.NewGuid(), "Taylor Finch");
    private static readonly MatchResult _corrected = new(Guid.NewGuid(), 1, _robin.EntryId, _sam.EntryId, Outcome.First, "played", 2);

    private static TournamentResults Results() => TournamentResults.Track(new TournamentId(Guid.NewGuid()), new(9, [_robin, _sam, _jamie, _taylor], [
        _corrected,
        new(Guid.NewGuid(), 1, _jamie.EntryId, _taylor.EntryId, Outcome.Draw, "played", 2),
        new(Guid.NewGuid(), 2, _robin.EntryId, _jamie.EntryId, null, null, 1)], []));

    [Fact]
    [Trait("covers", "standings: A preview on current results")]
    public void A_win_previewed_as_a_draw_moves_both_entrants_and_leaves_the_standings_unchanged()
    {
        var results = Results();

        var preview = results.Preview(_corrected.MatchId, 2, Outcome.Draw, "played").ShouldNotBeNull();

        (preview.Revision, preview.Updating).ShouldBe((9, false));
        var robin = preview.Entrants.Single(line => line.Entrant == _robin);
        var sam = preview.Entrants.Single(line => line.Entrant == _sam);
        (robin.PointsBefore, robin.PointsAfter, robin.PositionBefore, robin.SharedBefore, robin.PositionAfter, robin.SharedAfter).ShouldBe((3, 1, 1, false, 1, true));
        (sam.PointsBefore, sam.PointsAfter, sam.PositionBefore, sam.PositionAfter).ShouldBe((0, 1, 4, 1));
        // Jamie and Taylor keep 1 point but lose their shared second place to a four-way tie.
        preview.Entrants.Count.ShouldBe(4);
        results.Table().Rows.Single(row => row.Entrant == _robin).Points.ShouldBe(3);
    }

    [Fact]
    public void An_entrant_whose_points_and_position_stay_is_left_out()
    {
        var results = TournamentResults.Track(new TournamentId(Guid.NewGuid()), new(3, [_robin, _sam, _jamie], [
            _corrected,
            new(Guid.NewGuid(), 2, _jamie.EntryId, _robin.EntryId, Outcome.First, "played", 2)], []));

        var preview = results.Preview(_corrected.MatchId, 2, Outcome.Second, "played").ShouldNotBeNull();

        // Jamie keeps 3 points and a shared first place.
        preview.Entrants.Select(line => line.Entrant).ShouldBe([_sam, _robin], ignoreOrder: true);
        preview.Entrants.Single(line => line.Entrant == _robin).PointsAfter.ShouldBe(0);
    }

    [Fact]
    [Trait("covers", "standings: Standings behind")]
    public void A_proposal_on_a_match_revision_standings_has_not_applied_is_updating()
    {
        var preview = Results().Preview(_corrected.MatchId, 3, Outcome.Draw, "played").ShouldNotBeNull();

        (preview.Updating, preview.Revision, preview.MatchRevision).ShouldBe((true, 9, 2));
        preview.Entrants.ShouldBeEmpty();
    }

    [Fact]
    public void A_match_these_results_do_not_hold_has_no_preview() =>
        Results().Preview(Guid.NewGuid(), 1, Outcome.Draw, "played").ShouldBeNull();
}
