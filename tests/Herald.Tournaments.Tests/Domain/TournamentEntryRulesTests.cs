using Herald.Tournaments.Domain;
using Shouldly;
using static Herald.Tournaments.Tests.Domain.TournamentConfigurationTests;

namespace Herald.Tournaments.Tests.Domain;

public class TournamentEntryRulesTests
{
    private static readonly DateTimeOffset _at = new(2026, 11, 11, 12, 0, 0, TimeSpan.Zero);
    private readonly Guid _owner = Guid.NewGuid();

    // Published at revision 2, capacity 8, manual admission.
    private Tournament Published()
    {
        var tournament = Tournament.Draft(new(Guid.NewGuid()), CompleteIndividual, _owner, _at);
        tournament.Publish(1, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);
        return tournament;
    }

    [Fact]
    public void Capacity_cannot_fall_below_the_admitted_entries()
    {
        var tournament = Published();

        var result = tournament.Change(CompleteIndividual with { Capacity = 4 }, 2, _owner, _at, new EntryCounts(Admitted: 5, Waiting: 0));

        result.Broken.ShouldBe([new BrokenRule("capacity", "below-admitted")]);
        tournament.Configuration.Capacity.ShouldBe(8);
    }

    [Fact]
    public void Capacity_may_equal_the_admitted_entries() =>
        Published().Change(CompleteIndividual with { Capacity = 5 }, 2, _owner, _at, new EntryCounts(5, 3)).Outcome.ShouldBe(WriteOutcome.Applied);

    [Fact]
    public void Entry_kind_and_admission_are_locked_while_an_entry_is_active()
    {
        var tournament = Published();

        var result = tournament.Change(CompleteTeam with { Admission = Admission.Automatic }, 2, _owner, _at, new EntryCounts(Admitted: 0, Waiting: 1));

        result.Broken.ShouldBe([new BrokenRule("entryKind", "locked-by-entries"), new BrokenRule("admission", "locked-by-entries")]);
        tournament.Configuration.ShouldBe(CompleteIndividual);
    }

    [Fact]
    public void Entry_kind_changes_once_every_entry_is_cancelled() =>
        Published().Change(CompleteTeam, 2, _owner, _at, EntryCounts.None).Outcome.ShouldBe(WriteOutcome.Applied);

    [Fact]
    public void Other_values_change_while_entries_are_active() =>
        Published().Change(CompleteIndividual with { Title = "Sunday Open", Capacity = 12 }, 2, _owner, _at, new EntryCounts(5, 2))
            .Outcome.ShouldBe(WriteOutcome.Applied);
}
