using Herald.Tournaments.Domain;
using Shouldly;
using static Herald.Tournaments.Tests.Domain.TournamentConfigurationTests;

namespace Herald.Tournaments.Tests.Domain;

public class VisibilityTests
{
    private static readonly DateTimeOffset _at = new(2026, 11, 22, 12, 0, 0, TimeSpan.Zero);
    private readonly Guid _owner = Guid.NewGuid();

    private Tournament Draft() => Tournament.Draft(new TournamentId(Guid.NewGuid()), CompleteIndividual, _owner, _at);

    [Fact]
    public void A_published_tournament_changes_visibility_and_logs_it_as_its_own_public_entry()
    {
        var tournament = Draft();
        tournament.Publish(1, _owner, _at, "Alex Owner");

        tournament.ChangeVisibility(Visibility.Public, 2, _owner, _at, "Alex Owner").Outcome.ShouldBe(WriteOutcome.Applied);

        tournament.Configuration.Visibility.ShouldBe(Visibility.Public);
        tournament.Revision.ShouldBe(3);
        var entry = tournament.Logged[^1];
        (entry.Kind, entry.SubjectRevision, entry.Public).ShouldBe((ChangeKind.VisibilityChanged, 3, true));
        entry.Changes.ShouldBe([new ChangedValue("visibility", "Private", "Public")]);
        tournament.ChangeVisibility(Visibility.Public, 2, _owner, _at).Outcome.ShouldBe(WriteOutcome.Repeated);
    }

    [Fact]
    public void Visibility_changes_after_cancellation_but_a_draft_sets_it_in_its_configuration()
    {
        var draft = Draft();
        draft.ChangeVisibility(Visibility.Public, 1, _owner, _at).Broken.ShouldBe([new BrokenRule("visibility", "not-published")]);

        var cancelled = Draft();
        cancelled.Publish(1, _owner, _at);
        cancelled.Cancel("Venue unavailable", 2, _owner, _at);
        cancelled.ChangeVisibility(Visibility.Public, 3, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);
        cancelled.ChangeVisibility(Visibility.Private, 3, _owner, _at).Outcome.ShouldBe(WriteOutcome.Stale);
    }

    [Fact]
    public void A_published_tournament_s_configuration_cannot_change_its_visibility_past_the_preview()
    {
        var tournament = Draft();
        tournament.Change(CompleteIndividual with { Visibility = Visibility.Public }, 1, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);
        tournament.Publish(2, _owner, _at);

        tournament.Change(CompleteIndividual, 3, _owner, _at).Broken.ShouldBe([new BrokenRule("visibility", "change-visibility")]);
        tournament.Configuration.Visibility.ShouldBe(Visibility.Public);
    }
}
