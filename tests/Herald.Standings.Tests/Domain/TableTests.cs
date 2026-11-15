using Herald.Standings.Domain;
using Shouldly;

namespace Herald.Standings.Tests.Domain;

public class TableTests
{
    private static readonly Entrant _robin = new(Guid.NewGuid(), "Robin Vale");
    private static readonly Entrant _sam = new(Guid.NewGuid(), "Sam Reed");
    private static readonly Entrant _jamie = new(Guid.NewGuid(), "Jamie Brook");
    private static readonly Entrant _taylor = new(Guid.NewGuid(), "Taylor Finch");
    private static readonly Entrant _morgan = new(Guid.NewGuid(), "Morgan Lake");

    private static MatchResult Match(int round, Entrant first, Entrant second, Outcome? outcome, string? cause = "played") =>
        new(Guid.NewGuid(), round, first.EntryId, second.EntryId, outcome, outcome is null ? null : cause);

    private static ResultsSnapshot Results(int revision, IReadOnlyList<MatchResult> matches, IReadOnlyList<Rest>? rests = null, IReadOnlyList<Entrant>? entrants = null) =>
        new(revision, entrants ?? [_robin, _sam, _jamie, _taylor], matches, rests ?? []);

    private static Row RowOf(Table table, Entrant entrant) => table.Rows.Single(row => row.Entrant == entrant);

    [Fact]
    [Trait("covers", "standings: Six matches among four players")]
    public void Robin_wins_all_three_and_Jamie_and_Sam_share_second_on_four_points()
    {
        var table = Table.Of(Results(7, [
            Match(1, _robin, _sam, Outcome.First),
            Match(1, _jamie, _taylor, Outcome.First),
            Match(2, _robin, _jamie, Outcome.First),
            Match(2, _sam, _taylor, Outcome.First),
            Match(3, _taylor, _robin, Outcome.Second),
            Match(3, _sam, _jamie, Outcome.Draw)]));

        table.Rows.Select(row => (row.Position, row.Shared, row.Entrant.Name, row.Points)).ShouldBe([
            (1, false, "Robin Vale", 9),
            (2, true, "Jamie Brook", 4),
            (2, true, "Sam Reed", 4),
            (4, false, "Taylor Finch", 0)]);
        var sam = RowOf(table, _sam);
        (sam.Resolved, sam.Won, sam.Drawn, sam.Lost).ShouldBe((3, 1, 1, 1));
        (table.ResolvedMatches, table.Matches, table.Revision).ShouldBe((6, 6, 7));
    }

    [Fact]
    [Trait("covers", "standings: A double absence")]
    public void A_double_absence_counts_as_resolved_with_no_points_and_no_win_draw_or_loss()
    {
        var table = Table.Of(Results(2, [Match(1, _robin, _sam, Outcome.None, "doubleAbsence")]));

        foreach (var entrant in new[] { _robin, _sam })
        {
            var row = RowOf(table, entrant);
            (row.Resolved, row.Won, row.Drawn, row.Lost, row.Points).ShouldBe((1, 0, 0, 0, 0));
            row.Lines.ShouldHaveSingleItem().Cause.ShouldBe("doubleAbsence");
        }
    }

    [Fact]
    [Trait("covers", "standings: An unresolved match")]
    public void A_match_in_play_counts_for_neither_entrant()
    {
        var table = Table.Of(Results(1, [Match(1, _robin, _sam, null)]));

        table.Rows.ShouldAllBe(row => row.Resolved == 0 && row.Points == 0 && row.Lines.Count == 0);
        table.Rows.ShouldAllBe(row => row.Position == 1 && row.Shared);
        table.ResolvedMatches.ShouldBe(0);
    }

    [Fact]
    [Trait("covers", "standings: Five players")]
    public void A_rest_gives_no_points_and_is_listed_in_its_round()
    {
        var table = Table.Of(Results(2, [Match(1, _robin, _sam, Outcome.First)], [new(2, _robin.EntryId)], [_robin, _sam, _jamie, _taylor, _morgan]));

        var robin = RowOf(table, _robin);
        (robin.Resolved, robin.Points).ShouldBe((1, 3));
        robin.Lines.Select(line => (line.Round, line.IsRest, line.Points)).ShouldBe([(1, false, 3), (2, true, 0)]);
    }

    [Fact]
    [Trait("covers", "standings: Tracing points")]
    public void Sam_s_explanation_lists_each_resolved_match_and_adds_up_to_the_total()
    {
        var table = Table.Of(Results(4, [
            Match(1, _robin, _sam, Outcome.First),
            Match(2, _sam, _taylor, Outcome.First),
            Match(3, _sam, _jamie, Outcome.Draw)]));

        var sam = RowOf(table, _sam);
        sam.Lines.Select(line => (line.Round, line.Opponent!.Name, line.Cause, line.Points)).ShouldBe([
            (1, "Robin Vale", "played", 0),
            (2, "Taylor Finch", "played", 3),
            (3, "Jamie Brook", "played", 1)]);
        sam.Lines.Sum(line => line.Points).ShouldBe(sam.Points);
    }

    [Fact]
    [Trait("covers", "standings: Partway through")]
    public void Four_of_six_matches_resolved_are_counted_with_the_revision()
    {
        var table = Table.Of(Results(5, [
            Match(1, _robin, _sam, Outcome.First),
            Match(1, _jamie, _taylor, Outcome.First),
            Match(2, _robin, _jamie, Outcome.Draw),
            Match(2, _sam, _taylor, Outcome.Second),
            Match(3, _taylor, _robin, null),
            Match(3, _sam, _jamie, null)]));

        (table.ResolvedMatches, table.Matches, table.Revision).ShouldBe((4, 6, 5));
    }

    [Fact]
    [Trait("covers", "standings: An older snapshot")]
    public void An_older_snapshot_after_a_newer_one_changes_nothing()
    {
        var results = TournamentResults.Track(new(Guid.NewGuid()), Results(5, [Match(1, _robin, _sam, Outcome.First)]));

        results.Apply(Results(4, [])).ShouldBeFalse();
        results.Apply(Results(5, [])).ShouldBeFalse();

        results.Revision.ShouldBe(5);
        results.Table().ResolvedMatches.ShouldBe(1);
        results.Apply(Results(6, [])).ShouldBeTrue();
        results.Table().Matches.ShouldBe(0);
    }
}
