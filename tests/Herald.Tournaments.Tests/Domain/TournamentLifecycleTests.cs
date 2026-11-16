using Herald.Tournaments.Domain;
using Shouldly;
using static Herald.Tournaments.Tests.Domain.TournamentConfigurationTests;

namespace Herald.Tournaments.Tests.Domain;

public class TournamentLifecycleTests
{
    private static readonly DateTimeOffset _at = new(2026, 11, 16, 12, 0, 0, TimeSpan.Zero);
    private static readonly StartReadiness _ready = new(EligibleRevision: 7, Eligible: 4, Pending: 0, RostersOutsideBounds: [], SharedMemberNames: [], PublishedScheduleRevision: 1, ScheduleEligibleRevision: 7);
    private readonly Guid _owner = Guid.NewGuid();

    // Published with registration open: revision 3.
    private Tournament Open()
    {
        var tournament = Tournament.Draft(new TournamentId(Guid.NewGuid()), CompleteIndividual, _owner, _at);
        tournament.Publish(1, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);
        tournament.OpenRegistration(2, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);
        tournament.ClearDomainEvents();
        return tournament;
    }

    // Started: revision 5.
    private Tournament Running()
    {
        var tournament = Open();
        tournament.CloseRegistration(3, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);
        tournament.Start(4, _ready, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);
        tournament.ClearDomainEvents();
        return tournament;
    }

    private Tournament Finalised()
    {
        var tournament = Running();
        tournament.ApplyFinalisation(1).ShouldBeTrue();
        return tournament;
    }

    private static string[] Broken(WriteResult result)
    {
        result.Outcome.ShouldBe(WriteOutcome.Rejected);
        return [.. result.Broken.Select(rule => $"{rule.Field}:{rule.Rule}")];
    }

    [Fact]
    [Trait("covers", "tournament-lifecycle: Before start")]
    public void Cancelling_before_start_closes_registration_and_keeps_the_reason_privately()
    {
        var tournament = Open();

        tournament.Cancel("  Venue unavailable ", 3, _owner, _at, "Alex Owner").Outcome.ShouldBe(WriteOutcome.Applied);

        tournament.Competition.ShouldBe(CompetitionState.Cancelled);
        tournament.Registration.ShouldBe(RegistrationWindow.Closed);
        tournament.CancellationReason.ShouldBe("Venue unavailable");
        tournament.CancelledBy.ShouldBe(_owner);
        tournament.CancelledByName.ShouldBe("Alex Owner");
        tournament.CancelledAt.ShouldBe(_at);
        tournament.IsStarted.ShouldBeFalse();
        tournament.Revision.ShouldBe(4);
        tournament.DomainEvents.ShouldBe([new TournamentCancelled(tournament.Id, false, _owner, _at)]);
    }

    [Fact]
    public void Cancelling_a_running_competition_is_announced_as_after_start()
    {
        var tournament = Running();

        tournament.Cancel("Venue flooded", 5, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);

        tournament.DomainEvents.ShouldBe([new TournamentCancelled(tournament.Id, true, _owner, _at)]);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("   ")]
    [Trait("covers", "tournament-lifecycle: No reason")]
    public void Cancelling_without_a_reason_is_rejected_and_changes_nothing(string? reason)
    {
        var tournament = Open();

        Broken(tournament.Cancel(reason, 3, _owner, _at)).ShouldBe(["reason:required"]);

        tournament.Competition.ShouldBe(CompetitionState.Preparing);
        tournament.Registration.ShouldBe(RegistrationWindow.Open);
        tournament.Revision.ShouldBe(3);
    }

    [Fact]
    public void A_reason_longer_than_500_characters_is_rejected() =>
        Broken(Open().Cancel(new string('x', 501), 3, _owner, _at)).ShouldBe(["reason:too-long"]);

    [Fact]
    [Trait("covers", "tournament-lifecycle: Finalised")]
    public void A_finalised_competition_is_not_cancelled() =>
        Broken(Finalised().Cancel("Too late", 5, _owner, _at)).ShouldBe(["competition:finalised"]);

    [Fact]
    public void A_draft_is_deleted_rather_than_cancelled() =>
        Broken(Tournament.Draft(new TournamentId(Guid.NewGuid()), CompleteIndividual, _owner, _at).Cancel("No", 1, _owner, _at)).ShouldBe(["tournament:draft"]);

    [Fact]
    public void A_repeated_cancellation_is_answered_as_repeated()
    {
        var tournament = Open();
        tournament.Cancel("Venue unavailable", 3, _owner, _at);

        tournament.Cancel("Venue unavailable", 3, _owner, _at).Outcome.ShouldBe(WriteOutcome.Repeated);
    }

    [Fact]
    public void A_cancelled_tournament_accepts_no_write_of_its_own()
    {
        var tournament = Open();
        tournament.Cancel("Venue unavailable", 3, _owner, _at);

        Broken(tournament.Change(CompleteIndividual with { Title = "Renamed" }, 4, _owner, _at)).ShouldBe(["tournament:cancelled"]);
        Broken(tournament.OpenRegistration(4, _owner, _at)).ShouldBe(["tournament:cancelled"]);
        Broken(tournament.CloseRegistration(4, _owner, _at)).ShouldBe(["tournament:cancelled"]);
        Broken(tournament.Start(4, _ready, _owner, _at)).ShouldBe(["tournament:cancelled"]);
        Broken(tournament.ChangeDates(new(PlannedStartAt: new DateTime(2026, 11, 21, 10, 0, 0)), 4, _owner, _at)).ShouldBe(["tournament:cancelled"]);
    }

    [Fact]
    public void A_finalisation_that_arrives_after_the_cancellation_changes_nothing()
    {
        var tournament = Running();
        tournament.Cancel("Venue flooded", 5, _owner, _at);

        tournament.ApplyFinalisation(1).ShouldBeFalse();
        tournament.Competition.ShouldBe(CompetitionState.Cancelled);
    }

    [Fact]
    [Trait("covers", "tournament-lifecycle: Archiving a running tournament")]
    public void A_running_tournament_is_not_archived() =>
        Broken(Running().Archive(true, 5, _owner, _at)).ShouldBe(["archive:not-terminal"]);

    [Fact]
    public void A_finalised_tournament_is_archived_and_unarchived_keeping_its_state()
    {
        var tournament = Finalised();

        tournament.Archive(true, 5, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);
        tournament.Archived.ShouldBeTrue();
        tournament.Archive(true, 6, _owner, _at).Outcome.ShouldBe(WriteOutcome.Repeated);
        tournament.Archive(false, 6, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);

        tournament.Archived.ShouldBeFalse();
        tournament.Competition.ShouldBe(CompetitionState.Finalised);
        tournament.DomainEvents.ShouldBe([new TournamentArchiveChanged(tournament.Id, true, _owner, _at), new TournamentArchiveChanged(tournament.Id, false, _owner, _at)]);
    }

    [Fact]
    public void A_cancelled_tournament_is_archived()
    {
        var tournament = Open();
        tournament.Cancel("Venue unavailable", 3, _owner, _at);

        tournament.Archive(true, 4, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);
    }

    [Fact]
    public void A_draft_can_be_deleted() =>
        Tournament.Draft(new TournamentId(Guid.NewGuid()), new("Abandoned"), _owner, _at).CanDelete(1).Outcome.ShouldBe(WriteOutcome.Applied);

    [Fact]
    [Trait("covers", "tournament-lifecycle: Deleting a published tournament")]
    public void A_published_tournament_is_not_deleted() =>
        Broken(Open().CanDelete(3)).ShouldBe(["tournament:published"]);

    [Fact]
    [Trait("covers", "tournament-lifecycle: Postponing the start")]
    public void Changing_only_the_planned_start_keeps_the_old_and_new_values()
    {
        var tournament = Open();
        var postponed = new DateTime(2026, 11, 29, 10, 0, 0);

        tournament.ChangeDates(new(PlannedStartAt: postponed), 3, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);

        tournament.Configuration.ShouldBe(CompleteIndividual with { PlannedStartAt = postponed });
        tournament.DateChanges.ShouldBe([new DatesChanged(
            CompleteIndividual.RegistrationOpensAt, CompleteIndividual.RegistrationOpensAt,
            CompleteIndividual.RegistrationClosesAt, CompleteIndividual.RegistrationClosesAt,
            CompleteIndividual.PlannedStartAt, postponed,
            _owner, _at)]);
        tournament.Revision.ShouldBe(4);
    }

    [Fact]
    [Trait("covers", "tournament-lifecycle: Invalid order")]
    public void Moving_the_closure_after_the_planned_start_is_rejected_and_changes_nothing()
    {
        var tournament = Open();

        Broken(tournament.ChangeDates(new(RegistrationClosesAt: new DateTime(2026, 11, 15, 10, 0, 0)), 3, _owner, _at))
            .ShouldBe(["registrationClosesAt:after-planned-start"]);

        tournament.Configuration.ShouldBe(CompleteIndividual);
        tournament.DateChanges.ShouldBeEmpty();
    }

    [Fact]
    [Trait("covers", "tournament-lifecycle: After start")]
    public void Dates_of_a_running_competition_are_fixed() =>
        Broken(Running().ChangeDates(new(PlannedStartAt: new DateTime(2026, 11, 29, 10, 0, 0)), 5, _owner, _at)).ShouldBe(["dates:competition-started"]);

    [Fact]
    public void A_draft_changes_its_dates_in_the_configuration_form() =>
        Broken(Tournament.Draft(new TournamentId(Guid.NewGuid()), CompleteIndividual, _owner, _at).ChangeDates(new(PlannedStartAt: new DateTime(2026, 11, 29, 10, 0, 0)), 1, _owner, _at))
            .ShouldBe(["dates:draft"]);

    [Fact]
    public void A_published_tournament_does_not_change_its_dates_in_the_configuration_form() =>
        Broken(Open().Change(CompleteIndividual with { PlannedStartAt = new DateTime(2026, 11, 29, 10, 0, 0) }, 3, _owner, _at)).ShouldBe(["plannedStartAt:change-dates"]);

    [Fact]
    public void Selecting_the_current_values_is_a_repeat() =>
        Open().ChangeDates(new(PlannedStartAt: CompleteIndividual.PlannedStartAt), 3, _owner, _at).Outcome.ShouldBe(WriteOutcome.Repeated);
}
