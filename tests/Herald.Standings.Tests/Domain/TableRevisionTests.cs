using Herald.Standings.Domain;
using Shouldly;

namespace Herald.Standings.Tests.Domain;

public class TableRevisionTests
{
    private static readonly DateTimeOffset _at = new(2026, 11, 29, 18, 0, 0, TimeSpan.Zero);
    private static readonly Entrant _robin = new(Guid.NewGuid(), "Robin Vale");
    private static readonly Entrant _sam = new(Guid.NewGuid(), "Sam Reed");

    [Fact]
    public void Every_change_of_the_table_and_only_a_change_moves_its_revision_on()
    {
        var results = TournamentResults.Track(new TournamentId(Guid.NewGuid()), new(3, [_robin, _sam], [], []));
        results.TableRevision.ShouldBe(1);

        results.Apply(new(2, [_robin, _sam], [], []));
        results.TableRevision.ShouldBe(1);
        results.Apply(new(4, [_robin, _sam], [], []));
        results.Finalise(1, 4, _at);
        results.Finalise(1, 4, _at);
        results.TableRevision.ShouldBe(3);
        results.Reopen(1, 4, _at);
        results.Reopen(1, 4, _at);
        results.TableRevision.ShouldBe(4);
    }
}
