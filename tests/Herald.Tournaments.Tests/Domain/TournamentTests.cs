using Herald.Tournaments.Domain;
using Shouldly;
using static Herald.Tournaments.Tests.Domain.TournamentConfigurationTests;

namespace Herald.Tournaments.Tests.Domain;

public class TournamentTests
{
    private static readonly DateTimeOffset _created = new(2026, 11, 10, 12, 0, 0, TimeSpan.Zero);
    private static readonly DateTimeOffset _later = _created.AddHours(1);
    private readonly TournamentId _id = new(Guid.NewGuid());
    private readonly Guid _owner = Guid.NewGuid();
    private readonly Guid _other = Guid.NewGuid();

    private Tournament Draft(TournamentConfiguration? configuration = null) =>
        Tournament.Draft(_id, configuration ?? new("Saturday Open"), _owner, _created);

    private Tournament Published(TournamentConfiguration? configuration = null)
    {
        var tournament = Draft(configuration ?? CompleteIndividual);
        tournament.Publish(1, _owner, _created).Outcome.ShouldBe(WriteOutcome.Applied);
        return tournament;
    }

    [Fact]
    public void A_new_tournament_is_a_draft_at_revision_1_with_its_creator_and_time()
    {
        var tournament = Draft(new(" Saturday Open "));

        tournament.Configuration.Title.ShouldBe("Saturday Open");
        tournament.Publication.ShouldBe(Publication.Draft);
        tournament.Revision.ShouldBe(1);
        tournament.CreatedBy.ShouldBe(_owner);
        tournament.CreatedAt.ShouldBe(_created);
        tournament.DomainEvents.ShouldBe([new TournamentDrafted(_id, _owner, _created)]);
    }

    [Fact]
    public void A_tournament_cannot_be_drafted_from_a_configuration_that_breaks_a_rule() =>
        Should.Throw<ArgumentException>(() => Draft(new("")));

    [Fact]
    public void The_same_content_repeats_a_creation_and_different_content_does_not()
    {
        var tournament = Draft();

        tournament.Repeats(new(" Saturday Open ")).ShouldBeTrue();
        tournament.Repeats(new("Sunday Open")).ShouldBeFalse();
    }

    [Fact]
    public void A_change_replaces_the_configuration_and_increases_the_revision()
    {
        var tournament = Draft();

        tournament.Change(CompleteIndividual, 1, _other, _later).Outcome.ShouldBe(WriteOutcome.Applied);

        tournament.Configuration.ShouldBe(CompleteIndividual);
        tournament.Revision.ShouldBe(2);
        tournament.ChangedBy.ShouldBe(_other);
        tournament.ChangedAt.ShouldBe(_later);
        tournament.CreatedBy.ShouldBe(_owner);
    }

    [Fact]
    public void A_change_based_on_an_older_revision_is_stale_and_changes_nothing()
    {
        var tournament = Draft();
        tournament.Change(CompleteIndividual, 1, _owner, _later);

        tournament.Change(CompleteTeam, 1, _owner, _later).Outcome.ShouldBe(WriteOutcome.Stale);

        tournament.Configuration.ShouldBe(CompleteIndividual);
        tournament.Revision.ShouldBe(2);
    }

    [Fact]
    public void A_change_equal_to_the_stored_configuration_is_a_repeat_whatever_its_revision()
    {
        var tournament = Draft();
        tournament.Change(CompleteIndividual, 1, _owner, _later);

        tournament.Change(CompleteIndividual, 1, _owner, _later).Outcome.ShouldBe(WriteOutcome.Repeated);
        tournament.Change(CompleteIndividual, 2, _owner, _later).Outcome.ShouldBe(WriteOutcome.Repeated);

        tournament.Revision.ShouldBe(2);
    }

    [Fact]
    public void A_change_that_breaks_a_rule_is_rejected_and_changes_nothing()
    {
        var tournament = Draft();

        var result = tournament.Change(new("Saturday Open", Capacity: 1), 1, _owner, _later);

        result.Outcome.ShouldBe(WriteOutcome.Rejected);
        result.Broken.ShouldBe([new BrokenRule("capacity", "out-of-range")]);
        tournament.Configuration.ShouldBe(new("Saturday Open"));
        tournament.Revision.ShouldBe(1);
    }

    [Fact]
    public void A_tournament_changed_from_team_to_individual_keeps_no_team_structure()
    {
        var tournament = Draft(CompleteTeam);

        tournament.Change(CompleteIndividual, 1, _owner, _later).Outcome.ShouldBe(WriteOutcome.Applied);

        tournament.Configuration.MinimumRosterSize.ShouldBeNull();
        tournament.Configuration.MaximumRosterSize.ShouldBeNull();
        tournament.Configuration.ActivePlayersPerSide.ShouldBeNull();
    }

    [Fact]
    public void Publishing_a_complete_draft_records_who_and_when_and_increases_the_revision()
    {
        var tournament = Draft(CompleteTeam);
        tournament.ClearDomainEvents();

        tournament.Publish(1, _other, _later).Outcome.ShouldBe(WriteOutcome.Applied);

        tournament.Publication.ShouldBe(Publication.Published);
        tournament.PublishedBy.ShouldBe(_other);
        tournament.PublishedAt.ShouldBe(_later);
        tournament.Revision.ShouldBe(2);
        tournament.DomainEvents.ShouldBe([new TournamentPublished(_id, _other, _later)]);
    }

    [Fact]
    public void Publishing_an_incomplete_draft_names_every_missing_value_and_leaves_a_draft()
    {
        var tournament = Draft(CompleteIndividual with { TimeZone = null, Capacity = null });

        var result = tournament.Publish(1, _owner, _later);

        result.Outcome.ShouldBe(WriteOutcome.Rejected);
        result.Broken.ShouldBe([new BrokenRule("capacity", "required"), new BrokenRule("timeZone", "required")]);
        tournament.Publication.ShouldBe(Publication.Draft);
        tournament.Revision.ShouldBe(1);
    }

    [Fact]
    public void Publishing_from_an_older_revision_is_stale_and_leaves_a_draft()
    {
        var tournament = Draft();
        tournament.Change(CompleteIndividual, 1, _owner, _later);

        tournament.Publish(1, _owner, _later).Outcome.ShouldBe(WriteOutcome.Stale);

        tournament.Publication.ShouldBe(Publication.Draft);
    }

    [Fact]
    public void Publishing_again_is_a_repeat_that_keeps_the_first_publication()
    {
        var tournament = Published();

        tournament.Publish(1, _other, _later).Outcome.ShouldBe(WriteOutcome.Repeated);

        tournament.PublishedBy.ShouldBe(_owner);
        tournament.PublishedAt.ShouldBe(_created);
        tournament.Revision.ShouldBe(2);
    }

    [Fact]
    public void A_published_tournament_can_change_its_capacity_and_entry_kind()
    {
        var tournament = Published();

        tournament.Change(CompleteTeam, 2, _owner, _later).Outcome.ShouldBe(WriteOutcome.Applied);

        tournament.Publication.ShouldBe(Publication.Published);
        tournament.Configuration.ShouldBe(CompleteTeam);
    }

    [Fact]
    public void A_published_tournament_cannot_be_left_incomplete()
    {
        var tournament = Published();

        var result = tournament.Change(CompleteIndividual with { PlannedStartAt = null }, 2, _owner, _later);

        result.Outcome.ShouldBe(WriteOutcome.Rejected);
        result.Broken.ShouldBe([new BrokenRule("plannedStartAt", "required")]);
        tournament.Configuration.ShouldBe(CompleteIndividual);
    }
}
