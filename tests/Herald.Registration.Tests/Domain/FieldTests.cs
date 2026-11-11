using Herald.Registration.Domain;
using Shouldly;

namespace Herald.Registration.Tests.Domain;

public class FieldTests
{
    private static readonly DateTimeOffset _at = new(2026, 11, 11, 9, 0, 0, TimeSpan.Zero);
    private static readonly EntryTerms _openAutomatic = new(RegistrationState.Open, 2, EntryKind.Individual, Admission.Automatic);
    private readonly TournamentId _tournament = new(Guid.NewGuid());
    private readonly Guid _owner = Guid.NewGuid();

    private Field Track(EntryTerms? terms = null) => Field.Track(_tournament, terms ?? _openAutomatic, termsRevision: 3, _at);

    // Enters a new guest player and returns its entry.
    private static Entry EnterPlayer(Field field, DateTimeOffset? at = null)
    {
        var id = new EntryId(Guid.NewGuid());
        field.Enter(id, new GuestId(Guid.NewGuid()), GuestKind.Player, Guid.NewGuid(), at ?? _at).Outcome.ShouldBe(WriteOutcome.Applied);
        return field.Find(id)!;
    }

    // Applies the same terms with one change, as Tournaments would publish them.
    private static void Change(Field field, EntryTerms terms) => field.ApplyTerms(terms, field.TermsRevision + 1, _at).ShouldBeTrue();

    [Fact]
    public void A_field_starts_with_its_terms_and_no_entries() =>
        Track().ShouldSatisfyAllConditions(
            field => field.Terms.ShouldBe(_openAutomatic),
            field => field.TermsRevision.ShouldBe(3),
            field => field.Revision.ShouldBe(1),
            field => field.Entries.ShouldBeEmpty());

    [Fact]
    public void With_automatic_admission_an_entry_is_admitted_while_a_slot_is_free()
    {
        var field = Track();
        var guest = new GuestId(Guid.NewGuid());
        var id = new EntryId(Guid.NewGuid());

        field.Enter(id, guest, GuestKind.Player, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);

        var entry = field.Find(id)!;
        entry.State.ShouldBe(EntryState.Admitted);
        entry.AdmissionMethod.ShouldBe(AdmissionMethod.Automatic);
        entry.Revision.ShouldBe(1);
        entry.EnteredBy.ShouldBe(_owner);
        field.Revision.ShouldBe(2);
        field.DomainEvents.ShouldBe([
            new GuestEntered(_tournament, id, guest, _owner, _at),
            new EntryAdmitted(_tournament, id, AdmissionMethod.Automatic, _owner, _at),
        ]);
    }

    [Fact]
    public void When_the_field_is_full_the_next_entry_waits_with_capacity_full()
    {
        var field = Track();
        EnterPlayer(field);
        EnterPlayer(field);

        var third = EnterPlayer(field);

        third.State.ShouldBe(EntryState.Waiting);
        third.WaitingReason.ShouldBe(WaitingReason.CapacityFull);
        field.Admitted.ShouldBe(2);
        field.Waiting.ShouldBe(1);
    }

    [Fact]
    public void With_manual_admission_every_entry_waits_with_admission_pending()
    {
        var field = Track(_openAutomatic with { Admission = Admission.Manual });

        var entry = EnterPlayer(field);

        entry.State.ShouldBe(EntryState.Waiting);
        entry.WaitingReason.ShouldBe(WaitingReason.AdmissionPending);
        field.Admitted.ShouldBe(0);
    }

    [Fact]
    public void A_team_takes_one_slot()
    {
        var field = Track(new(RegistrationState.Open, 2, EntryKind.Team, Admission.Automatic));

        field.Enter(new(Guid.NewGuid()), new(Guid.NewGuid()), GuestKind.Team, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);

        field.Admitted.ShouldBe(1);
    }

    [Theory]
    [InlineData(RegistrationState.NotOpen)]
    [InlineData(RegistrationState.Closed)]
    public void Entering_needs_registration_open(RegistrationState registration)
    {
        var field = Track(_openAutomatic with { Registration = registration });

        field.Enter(new(Guid.NewGuid()), new(Guid.NewGuid()), GuestKind.Player, _owner, _at)
            .Broken.ShouldBe([new BrokenRule("registration", "not-open")]);
        field.Entries.ShouldBeEmpty();
    }

    [Fact]
    public void A_guest_of_the_other_kind_cannot_enter() =>
        Track().Enter(new(Guid.NewGuid()), new(Guid.NewGuid()), GuestKind.Team, _owner, _at)
            .Broken.ShouldBe([new BrokenRule("guest", "kind")]);

    [Fact]
    public void A_guest_has_one_active_entry_per_tournament()
    {
        var field = Track();
        var guest = new GuestId(Guid.NewGuid());
        field.Enter(new(Guid.NewGuid()), guest, GuestKind.Player, _owner, _at);

        field.Enter(new(Guid.NewGuid()), guest, GuestKind.Player, _owner, _at)
            .Broken.ShouldBe([new BrokenRule("guest", "already-entered")]);
        field.Entries.Count.ShouldBe(1);
    }

    [Fact]
    public void A_cancelled_guest_enters_again_at_the_back_of_the_queue()
    {
        var field = Track();
        EnterPlayer(field);
        EnterPlayer(field);
        var guest = new GuestId(Guid.NewGuid());
        var first = new EntryId(Guid.NewGuid());
        field.Enter(first, guest, GuestKind.Player, _owner, _at);
        var other = EnterPlayer(field, _at.AddMinutes(1));
        field.Cancel(first, 1, _owner, _at.AddMinutes(2));

        var again = new EntryId(Guid.NewGuid());
        field.Enter(again, guest, GuestKind.Player, _owner, _at.AddMinutes(3)).Outcome.ShouldBe(WriteOutcome.Applied);

        field.Queue.Select(entry => entry.Id).ShouldBe([other.Id, again]);
    }

    [Fact]
    public void Repeating_an_entry_with_the_same_identifier_and_guest_changes_nothing()
    {
        var field = Track();
        var id = new EntryId(Guid.NewGuid());
        var guest = new GuestId(Guid.NewGuid());
        field.Enter(id, guest, GuestKind.Player, _owner, _at);
        field.ClearDomainEvents();

        field.Enter(id, guest, GuestKind.Player, _owner, _at).Outcome.ShouldBe(WriteOutcome.Repeated);
        field.Enter(id, new(Guid.NewGuid()), GuestKind.Player, _owner, _at).Broken.ShouldBe([new BrokenRule("entry", "identifier-reused")]);

        field.Entries.Count.ShouldBe(1);
        field.Revision.ShouldBe(2);
        field.DomainEvents.ShouldBeEmpty();
    }

    [Fact]
    public void The_queue_is_ordered_by_waiting_time_then_by_sequence()
    {
        var field = Track(_openAutomatic with { Capacity = 2 });
        EnterPlayer(field);
        EnterPlayer(field);
        var later = EnterPlayer(field, _at.AddMinutes(5));
        var sameTimeFirst = EnterPlayer(field, _at.AddMinutes(1));
        var sameTimeSecond = EnterPlayer(field, _at.AddMinutes(1));

        field.Queue.Select(entry => entry.Id).ShouldBe([sameTimeFirst.Id, sameTimeSecond.Id, later.Id]);
    }

    [Fact]
    public void The_owner_admits_a_pending_entry_while_a_slot_is_free()
    {
        var field = Track(_openAutomatic with { Admission = Admission.Manual });
        var entry = EnterPlayer(field);

        field.Admit(entry.Id, 1, reason: null, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);

        entry.State.ShouldBe(EntryState.Admitted);
        entry.AdmissionMethod.ShouldBe(AdmissionMethod.Owner);
        entry.AdmittedBy.ShouldBe(_owner);
        entry.Revision.ShouldBe(2);
    }

    [Fact]
    public void Pending_entries_are_admitted_in_any_order_without_a_reason()
    {
        var field = Track(_openAutomatic with { Admission = Admission.Manual });
        EnterPlayer(field);
        var second = EnterPlayer(field, _at.AddMinutes(1));

        field.Admit(second.Id, 1, reason: null, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);
    }

    [Fact]
    public void The_owner_cannot_admit_when_no_slot_is_free()
    {
        var field = Track();
        EnterPlayer(field);
        EnterPlayer(field);
        var waiting = EnterPlayer(field);

        field.Admit(waiting.Id, 1, reason: null, _owner, _at).Broken.ShouldBe([new BrokenRule("capacity", "full")]);
        waiting.State.ShouldBe(EntryState.Waiting);
    }

    [Fact]
    public void Admitting_after_closure_is_still_possible()
    {
        var field = Track();
        EnterPlayer(field);
        var admitted = EnterPlayer(field);
        var waiting = EnterPlayer(field);
        Change(field, _openAutomatic with { Registration = RegistrationState.Closed });
        field.Cancel(admitted.Id, 1, _owner, _at);

        field.Admit(waiting.Id, 1, reason: null, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);
    }

    [Fact]
    public void Skipping_the_capacity_queue_needs_a_private_reason()
    {
        var field = Track();
        var admitted = EnterPlayer(field);
        EnterPlayer(field);
        EnterPlayer(field);
        var second = EnterPlayer(field, _at.AddMinutes(1));
        Change(field, _openAutomatic with { Registration = RegistrationState.Closed });
        field.Cancel(admitted.Id, 1, _owner, _at);

        field.Admit(second.Id, 1, reason: "  ", _owner, _at).Broken.ShouldBe([new BrokenRule("reason", "required")]);
        field.Admit(second.Id, 1, reason: "Travelled from abroad", _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);

        second.AdmissionReason.ShouldBe("Travelled from abroad");
    }

    [Fact]
    public void A_reason_is_at_most_500_characters()
    {
        var field = Track(_openAutomatic with { Admission = Admission.Manual });
        var entry = EnterPlayer(field);

        field.Admit(entry.Id, 1, new string('a', 501), _owner, _at).Broken.ShouldBe([new BrokenRule("reason", "too-long")]);
    }

    [Fact]
    public void A_cancellation_promotes_exactly_one_waiting_entry_while_open_with_automatic_admission()
    {
        var field = Track();
        var admitted = EnterPlayer(field);
        EnterPlayer(field);
        var first = EnterPlayer(field, _at.AddMinutes(1));
        var second = EnterPlayer(field, _at.AddMinutes(2));

        field.Cancel(admitted.Id, 1, _owner, _at.AddMinutes(3)).Outcome.ShouldBe(WriteOutcome.Applied);

        admitted.State.ShouldBe(EntryState.Cancelled);
        admitted.CancelledBy.ShouldBe(_owner);
        first.State.ShouldBe(EntryState.Admitted);
        first.AdmissionMethod.ShouldBe(AdmissionMethod.Promotion);
        second.State.ShouldBe(EntryState.Waiting);
        field.Admitted.ShouldBe(2);
    }

    [Fact]
    public void A_cancellation_after_closure_promotes_nobody()
    {
        var field = Track();
        var admitted = EnterPlayer(field);
        EnterPlayer(field);
        var waiting = EnterPlayer(field);
        Change(field, _openAutomatic with { Registration = RegistrationState.Closed });

        field.Cancel(admitted.Id, 1, _owner, _at);

        waiting.State.ShouldBe(EntryState.Waiting);
        field.Admitted.ShouldBe(1);
    }

    [Fact]
    public void A_cancelled_waiting_entry_frees_nothing_and_promotes_nobody()
    {
        var field = Track(_openAutomatic with { Capacity = 1 });
        EnterPlayer(field);
        var first = EnterPlayer(field);
        var second = EnterPlayer(field);

        field.Cancel(first.Id, 1, _owner, _at);

        second.State.ShouldBe(EntryState.Waiting);
        field.Admitted.ShouldBe(1);
    }

    [Fact]
    public void Raising_the_capacity_admits_the_first_waiting_entry()
    {
        var field = Track();
        EnterPlayer(field);
        EnterPlayer(field);
        var first = EnterPlayer(field);
        var second = EnterPlayer(field, _at.AddMinutes(1));

        Change(field, _openAutomatic with { Capacity = 3 });

        first.State.ShouldBe(EntryState.Admitted);
        first.AdmittedBy.ShouldBeNull();
        second.State.ShouldBe(EntryState.Waiting);
    }

    [Fact]
    public void Reopening_fills_the_slots_freed_while_closed()
    {
        var field = Track();
        var admitted = EnterPlayer(field);
        EnterPlayer(field);
        var waiting = EnterPlayer(field);
        Change(field, _openAutomatic with { Registration = RegistrationState.Closed });
        field.Cancel(admitted.Id, 1, _owner, _at);

        Change(field, _openAutomatic);

        waiting.State.ShouldBe(EntryState.Admitted);
    }

    [Fact]
    public void Closing_keeps_every_entry_and_its_place()
    {
        var field = Track();
        EnterPlayer(field);
        EnterPlayer(field);
        var first = EnterPlayer(field);
        var second = EnterPlayer(field, _at.AddMinutes(1));

        Change(field, _openAutomatic with { Registration = RegistrationState.Closed });

        field.Admitted.ShouldBe(2);
        field.Queue.Select(entry => entry.Id).ShouldBe([first.Id, second.Id]);
    }

    [Fact]
    public void Older_terms_change_nothing()
    {
        var field = Track();

        field.ApplyTerms(_openAutomatic with { Capacity = 9 }, termsRevision: 3, _at).ShouldBeFalse();
        field.ApplyTerms(_openAutomatic with { Capacity = 9 }, termsRevision: 2, _at).ShouldBeFalse();

        field.Terms.Capacity.ShouldBe(2);
        field.Revision.ShouldBe(1);
    }

    [Fact]
    public void Admitted_entries_above_the_capacity_are_reported_and_block_entering_and_admitting()
    {
        var field = Track(_openAutomatic with { Capacity = 3 });
        var admitted = EnterPlayer(field);
        EnterPlayer(field);
        EnterPlayer(field);
        Change(field, _openAutomatic with { Admission = Admission.Manual, Capacity = 3 });
        var pending = EnterPlayer(field);

        Change(field, _openAutomatic with { Admission = Admission.Manual, Capacity = 1 });

        field.OverCapacityBy.ShouldBe(2);
        field.Admitted.ShouldBe(3);
        field.Enter(new(Guid.NewGuid()), new(Guid.NewGuid()), GuestKind.Player, _owner, _at).Broken.ShouldBe([new BrokenRule("field", "mismatch")]);
        field.Admit(pending.Id, 1, reason: null, _owner, _at).Broken.ShouldBe([new BrokenRule("field", "mismatch")]);
        field.Cancel(admitted.Id, 1, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);
        field.OverCapacityBy.ShouldBe(1);
    }

    [Fact]
    public void Active_entries_of_the_other_kind_are_reported_and_promote_nobody()
    {
        var field = Track();
        EnterPlayer(field);
        EnterPlayer(field);
        var waiting = EnterPlayer(field);

        Change(field, new(RegistrationState.Open, 3, EntryKind.Team, Admission.Automatic));

        field.HasKindMismatch.ShouldBeTrue();
        waiting.State.ShouldBe(EntryState.Waiting);
    }

    [Fact]
    public void Admitting_and_cancelling_state_the_entry_revision_and_repeat_when_in_effect()
    {
        var field = Track(_openAutomatic with { Admission = Admission.Manual });
        var entry = EnterPlayer(field);
        field.Admit(entry.Id, 1, reason: null, _owner, _at);

        field.Admit(entry.Id, 1, reason: null, _owner, _at).Outcome.ShouldBe(WriteOutcome.Repeated);
        field.Cancel(entry.Id, 1, _owner, _at).Outcome.ShouldBe(WriteOutcome.Stale);
        field.Cancel(entry.Id, 2, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);
        field.Cancel(entry.Id, 2, _owner, _at).Outcome.ShouldBe(WriteOutcome.Repeated);
        field.Admit(entry.Id, 3, reason: null, _owner, _at).Broken.ShouldBe([new BrokenRule("entry", "cancelled")]);
        entry.Revision.ShouldBe(3);
    }

    [Fact]
    public void A_stale_admission_of_a_cancelled_entry_is_a_conflict()
    {
        var field = Track(_openAutomatic with { Admission = Admission.Manual });
        var entry = EnterPlayer(field);
        field.Cancel(entry.Id, 1, _owner, _at);

        field.Admit(entry.Id, 1, reason: null, _owner, _at).Outcome.ShouldBe(WriteOutcome.Stale);
    }

    [Fact]
    public void Each_effective_change_increases_the_field_revision_once()
    {
        var field = Track();
        var entry = EnterPlayer(field);
        EnterPlayer(field);
        EnterPlayer(field);

        field.Cancel(entry.Id, 1, _owner, _at);

        field.Revision.ShouldBe(5);
    }
}
