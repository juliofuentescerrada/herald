using Herald.Tournaments.Domain;
using Shouldly;
using static Herald.Tournaments.Tests.Domain.TournamentConfigurationTests;

namespace Herald.Tournaments.Tests.Domain;

public class CompetitionStartTests
{
    private static readonly DateTimeOffset _at = new(2026, 11, 21, 10, 5, 0, TimeSpan.Zero);
    private static readonly StartReadiness _ready = new(EligibleRevision: 7, Eligible: 4, Pending: 0, RostersOutsideBounds: [], SharedMemberNames: [], PublishedScheduleRevision: 1, ScheduleEligibleRevision: 7);
    private readonly Guid _owner = Guid.NewGuid();

    // Published, opened and closed: revision 4.
    private Tournament Closed(TournamentConfiguration? configuration = null)
    {
        var tournament = Tournament.Draft(new TournamentId(Guid.NewGuid()), configuration ?? CompleteIndividual, _owner, _at);
        tournament.Publish(1, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);
        tournament.OpenRegistration(2, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);
        tournament.CloseRegistration(3, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);
        tournament.ClearDomainEvents();
        return tournament;
    }

    private static string[] Unmet(Tournament tournament, StartReadiness readiness) =>
        [.. tournament.StartConditions(readiness).Where(condition => !condition.Met).Select(condition => condition.Rule)];

    [Fact]
    [Trait("covers", "competition-start: A tournament not yet ready")]
    public void Open_registration_pending_entries_and_no_schedule_are_three_unmet_conditions()
    {
        var tournament = Tournament.Draft(new TournamentId(Guid.NewGuid()), CompleteIndividual, _owner, _at);
        tournament.Publish(1, _owner, _at);
        tournament.OpenRegistration(2, _owner, _at);

        Unmet(tournament, _ready with { Pending = 2, PublishedScheduleRevision = null, ScheduleEligibleRevision = null })
            .ShouldBe([StartRules.RegistrationClosed, StartRules.NoPendingCheckIn, StartRules.ScheduleCurrent]);
    }

    [Fact]
    [Trait("covers", "competition-start: A roster below the minimum")]
    public void A_roster_outside_its_bounds_is_an_unmet_condition_of_a_team_tournament()
    {
        var tournament = Closed(CompleteTeam);

        Unmet(tournament, _ready with { RostersOutsideBounds = [new(Guid.NewGuid(), "Harbour Lights", 2)] }).ShouldBe([StartRules.RostersWithinBounds]);
    }

    [Fact]
    public void An_individual_tournament_has_no_roster_condition() =>
        Closed().StartConditions(_ready).Select(condition => condition.Rule).ShouldNotContain(StartRules.RostersWithinBounds);

    [Fact]
    [Trait("covers", "competition-start: A same-name warning")]
    public void A_shared_member_name_does_not_block()
    {
        var tournament = Closed(CompleteTeam);

        tournament.Start(4, _ready with { SharedMemberNames = [new("Alex Kim", ["River Falcons", "North Stars"])] }, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);
    }

    [Fact]
    public void Unknown_counts_block_until_Registration_reports() =>
        Unmet(Closed(CompleteTeam), StartReadiness.Unknown with { PublishedScheduleRevision = 1, ScheduleEligibleRevision = 7 })
            .ShouldBe([StartRules.NoPendingCheckIn, StartRules.TwoEligible, StartRules.ScheduleCurrent, StartRules.RostersWithinBounds]);

    [Fact]
    [Trait("covers", "competition-start: Start with four eligible players")]
    public void Starting_makes_the_competition_running_on_the_revisions_it_saw()
    {
        var tournament = Closed();

        tournament.Start(4, _ready, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);

        tournament.Competition.ShouldBe(CompetitionState.Running);
        tournament.StartedBy.ShouldBe(_owner);
        tournament.StartedAt.ShouldBe(_at);
        tournament.StartedOnEligibleRevision.ShouldBe(7);
        tournament.StartedOnScheduleRevision.ShouldBe(1);
        tournament.Revision.ShouldBe(5);
        tournament.DomainEvents.ShouldBe([new CompetitionStarted(tournament.Id, 7, 1, _owner, _at)]);
    }

    [Fact]
    [Trait("covers", "competition-start: Fewer than two eligible entrants")]
    public void Starting_with_one_eligible_entrant_is_rejected()
    {
        var tournament = Closed();

        tournament.Start(4, _ready with { Eligible = 1 }, _owner, _at).Broken.ShouldBe([new BrokenRule("competition", StartRules.TwoEligible)]);
        tournament.Competition.ShouldBe(CompetitionState.Preparing);
    }

    [Fact]
    [Trait("covers", "competition-start: A stale schedule")]
    public void Starting_on_a_schedule_drafted_from_an_older_field_is_rejected() =>
        Closed().Start(4, _ready with { EligibleRevision = 8 }, _owner, _at).Broken.ShouldBe([new BrokenRule("competition", StartRules.ScheduleCurrent)]);

    [Fact]
    public void Starting_again_is_a_repeat_that_keeps_the_first_start()
    {
        var tournament = Closed();
        tournament.Start(4, _ready, _owner, _at);

        tournament.Start(4, _ready, Guid.NewGuid(), _at.AddMinutes(1)).Outcome.ShouldBe(WriteOutcome.Repeated);

        tournament.StartedBy.ShouldBe(_owner);
        tournament.Revision.ShouldBe(5);
    }

    [Fact]
    public void Starting_from_an_older_revision_is_stale() =>
        Closed().Start(3, _ready, _owner, _at).Outcome.ShouldBe(WriteOutcome.Stale);

    [Fact]
    public void A_running_tournament_keeps_what_decides_its_entries_and_rosters()
    {
        var tournament = Closed(CompleteTeam);
        tournament.Start(4, _ready, _owner, _at);

        var result = tournament.Change(CompleteTeam with { CheckIn = CheckIn.Optional, MaximumRosterSize = 6 }, 5, _owner, _at);

        result.Broken.ShouldBe([new BrokenRule("checkIn", "competition-started"), new BrokenRule("maximumRosterSize", "competition-started")]);
    }

    [Fact]
    public void A_running_tournament_can_still_change_its_title() =>
        Started().Change(CompleteIndividual with { Title = "Autumn League Finals" }, 5, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);

    [Fact]
    public void Registration_cannot_reopen_once_running() =>
        Started().OpenRegistration(5, _owner, _at).Broken.ShouldBe([new BrokenRule("registration", "competition-started")]);

    private Tournament Started()
    {
        var tournament = Closed();
        tournament.Start(4, _ready, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);
        return tournament;
    }

    [Fact]
    public void A_draft_cannot_start() =>
        Tournament.Draft(new TournamentId(Guid.NewGuid()), CompleteIndividual, _owner, _at).Start(1, _ready, _owner, _at)
            .Broken.ShouldBe([new BrokenRule("competition", "not-published")]);

    [Fact]
    public void A_finalised_competition_shows_as_finalised_stays_started_and_runs_again_on_reopening_whichever_event_arrives_first()
    {
        var tournament = Closed();
        tournament.Start(4, _ready, _owner, _at);

        tournament.ApplyFinalisation(1).ShouldBeTrue();
        tournament.ApplyFinalisation(1).ShouldBeFalse();
        (tournament.Competition, tournament.IsStarted).ShouldBe((CompetitionState.Finalised, true));
        tournament.OpenRegistration(tournament.Revision, _owner, _at).Broken.ShouldContain(new BrokenRule("registration", "competition-started"));

        tournament.ApplyReopening(1).ShouldBeTrue();
        tournament.Competition.ShouldBe(CompetitionState.Running);
        tournament.ApplyReopening(2).ShouldBeTrue();
        tournament.ApplyFinalisation(2).ShouldBeFalse();
        tournament.Competition.ShouldBe(CompetitionState.Running);
    }
}
