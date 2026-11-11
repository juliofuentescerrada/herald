using Herald.Tournaments.Domain;
using Shouldly;
using static Herald.Tournaments.Tests.Domain.TournamentConfigurationTests;

namespace Herald.Tournaments.Tests.Domain;

public class TournamentRegistrationTests
{
    private static readonly DateTimeOffset _created = new(2026, 11, 10, 12, 0, 0, TimeSpan.Zero);
    private static readonly DateTimeOffset _later = _created.AddHours(1);
    private static readonly TournamentConfiguration _withoutDates = CompleteIndividual with { RegistrationOpensAt = null, RegistrationClosesAt = null };
    private readonly TournamentId _id = new(Guid.NewGuid());
    private readonly Guid _owner = Guid.NewGuid();
    private readonly Guid _other = Guid.NewGuid();

    // Published at revision 2.
    private Tournament Published(TournamentConfiguration? configuration = null)
    {
        var tournament = Tournament.Draft(_id, configuration ?? CompleteIndividual, _owner, _created);
        tournament.Publish(1, _owner, _created).Outcome.ShouldBe(WriteOutcome.Applied);
        tournament.ClearDomainEvents();
        return tournament;
    }

    // Open at revision 3.
    private Tournament Open()
    {
        var tournament = Published();
        tournament.OpenRegistration(2, _owner, _created).Outcome.ShouldBe(WriteOutcome.Applied);
        tournament.ClearDomainEvents();
        return tournament;
    }

    // Closed at revision 4.
    private Tournament Closed()
    {
        var tournament = Open();
        tournament.CloseRegistration(3, _owner, _created).Outcome.ShouldBe(WriteOutcome.Applied);
        tournament.ClearDomainEvents();
        return tournament;
    }

    [Fact]
    public void A_new_tournament_has_registration_not_open_and_no_window_change() =>
        Published().ShouldSatisfyAllConditions(
            tournament => tournament.Registration.ShouldBe(RegistrationWindow.NotOpen),
            tournament => tournament.RegistrationChangedBy.ShouldBeNull(),
            tournament => tournament.RegistrationChangedAt.ShouldBeNull());

    [Fact]
    public void Opening_registration_records_who_and_when_and_changes_nothing_else()
    {
        var tournament = Published();

        tournament.OpenRegistration(2, _other, _later).Outcome.ShouldBe(WriteOutcome.Applied);

        tournament.Registration.ShouldBe(RegistrationWindow.Open);
        tournament.RegistrationChangedBy.ShouldBe(_other);
        tournament.RegistrationChangedAt.ShouldBe(_later);
        tournament.Revision.ShouldBe(3);
        tournament.Publication.ShouldBe(Publication.Published);
        tournament.Configuration.ShouldBe(CompleteIndividual);
        tournament.DomainEvents.ShouldBe([new TournamentRegistrationOpened(_id, _other, _later)]);
    }

    [Fact]
    public void Opening_without_the_registration_dates_names_each_missing_one()
    {
        var tournament = Published(_withoutDates);

        var result = tournament.OpenRegistration(2, _owner, _later);

        result.Outcome.ShouldBe(WriteOutcome.Rejected);
        result.Broken.ShouldBe([new BrokenRule("registrationOpensAt", "required"), new BrokenRule("registrationClosesAt", "required")]);
        tournament.Registration.ShouldBe(RegistrationWindow.NotOpen);
        tournament.Revision.ShouldBe(2);
    }

    [Fact]
    public void A_draft_cannot_open_registration()
    {
        var draft = Tournament.Draft(_id, CompleteIndividual, _owner, _created);

        var result = draft.OpenRegistration(1, _owner, _later);

        result.Outcome.ShouldBe(WriteOutcome.Rejected);
        result.Broken.ShouldBe([new BrokenRule("registration", "not-published")]);
        draft.Registration.ShouldBe(RegistrationWindow.NotOpen);
    }

    [Fact]
    public void Opening_from_an_older_revision_is_stale_and_leaves_registration_not_open()
    {
        var tournament = Published();

        tournament.OpenRegistration(1, _owner, _later).Outcome.ShouldBe(WriteOutcome.Stale);

        tournament.Registration.ShouldBe(RegistrationWindow.NotOpen);
        tournament.Revision.ShouldBe(2);
    }

    [Fact]
    public void Opening_again_is_a_repeat_that_keeps_the_first_opening()
    {
        var tournament = Open();

        tournament.OpenRegistration(2, _other, _later).Outcome.ShouldBe(WriteOutcome.Repeated);

        tournament.RegistrationChangedBy.ShouldBe(_owner);
        tournament.RegistrationChangedAt.ShouldBe(_created);
        tournament.Revision.ShouldBe(3);
        tournament.DomainEvents.ShouldBeEmpty();
    }

    [Fact]
    public void Closing_an_open_registration_records_who_and_when_and_changes_nothing_else()
    {
        var tournament = Open();

        tournament.CloseRegistration(3, _other, _later).Outcome.ShouldBe(WriteOutcome.Applied);

        tournament.Registration.ShouldBe(RegistrationWindow.Closed);
        tournament.RegistrationChangedBy.ShouldBe(_other);
        tournament.RegistrationChangedAt.ShouldBe(_later);
        tournament.Revision.ShouldBe(4);
        tournament.Publication.ShouldBe(Publication.Published);
        tournament.Configuration.ShouldBe(CompleteIndividual);
        tournament.DomainEvents.ShouldBe([new TournamentRegistrationClosed(_id, _other, _later)]);
    }

    [Fact]
    public void A_registration_that_was_never_opened_cannot_be_closed()
    {
        var tournament = Published();

        var result = tournament.CloseRegistration(2, _owner, _later);

        result.Outcome.ShouldBe(WriteOutcome.Rejected);
        result.Broken.ShouldBe([new BrokenRule("registration", "not-open")]);
        tournament.Registration.ShouldBe(RegistrationWindow.NotOpen);
        tournament.Revision.ShouldBe(2);
    }

    [Fact]
    public void Closing_from_an_older_revision_is_stale_and_leaves_registration_open()
    {
        var tournament = Open();

        tournament.CloseRegistration(2, _owner, _later).Outcome.ShouldBe(WriteOutcome.Stale);

        tournament.Registration.ShouldBe(RegistrationWindow.Open);
    }

    [Fact]
    public void Closing_again_is_a_repeat_that_keeps_the_first_closing()
    {
        var tournament = Closed();

        tournament.CloseRegistration(3, _other, _later).Outcome.ShouldBe(WriteOutcome.Repeated);

        tournament.RegistrationChangedAt.ShouldBe(_created);
        tournament.Revision.ShouldBe(4);
    }

    [Fact]
    public void A_closed_registration_reopens_like_an_opening()
    {
        var tournament = Closed();

        tournament.OpenRegistration(4, _other, _later).Outcome.ShouldBe(WriteOutcome.Applied);

        tournament.Registration.ShouldBe(RegistrationWindow.Open);
        tournament.RegistrationChangedBy.ShouldBe(_other);
        tournament.Revision.ShouldBe(5);
        tournament.DomainEvents.ShouldBe([new TournamentRegistrationOpened(_id, _other, _later)]);
    }

    [Fact]
    public void A_closed_registration_that_lost_a_date_cannot_reopen()
    {
        var tournament = Closed();
        tournament.Change(CompleteIndividual with { RegistrationOpensAt = null }, 4, _owner, _later).Outcome.ShouldBe(WriteOutcome.Applied);

        var result = tournament.OpenRegistration(5, _owner, _later);

        result.Outcome.ShouldBe(WriteOutcome.Rejected);
        result.Broken.ShouldBe([new BrokenRule("registrationOpensAt", "required")]);
        tournament.Registration.ShouldBe(RegistrationWindow.Closed);
    }

    [Fact]
    public void A_save_cannot_remove_a_registration_date_while_registration_is_open()
    {
        var tournament = Open();

        var result = tournament.Change(CompleteIndividual with { RegistrationClosesAt = null }, 3, _owner, _later);

        result.Outcome.ShouldBe(WriteOutcome.Rejected);
        result.Broken.ShouldBe([new BrokenRule("registrationClosesAt", "required")]);
        tournament.Configuration.ShouldBe(CompleteIndividual);
    }

    [Fact]
    public void A_save_can_change_the_dates_and_the_capacity_while_registration_is_open()
    {
        var tournament = Open();
        var changed = CompleteTeam with { RegistrationClosesAt = new DateTime(2026, 11, 14, 9, 0, 0) };

        tournament.Change(changed, 3, _owner, _later).Outcome.ShouldBe(WriteOutcome.Applied);

        tournament.Configuration.ShouldBe(changed);
        tournament.Registration.ShouldBe(RegistrationWindow.Open);
    }

    [Fact]
    public void A_save_can_remove_the_registration_dates_while_registration_is_not_open() =>
        Published().Change(_withoutDates, 2, _owner, _later).Outcome.ShouldBe(WriteOutcome.Applied);
}
