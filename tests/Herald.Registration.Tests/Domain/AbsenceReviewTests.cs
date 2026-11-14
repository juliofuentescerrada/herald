using Herald.Registration.Domain;
using Shouldly;

namespace Herald.Registration.Tests.Domain;

public class AbsenceReviewTests
{
    private static readonly DateTimeOffset _at = new(2026, 11, 21, 9, 40, 0, TimeSpan.Zero);
    private static readonly EntryTerms _open = new(RegistrationState.Open, 2, EntryKind.Individual, Admission.Automatic, CheckIn: CheckInPolicy.Mandatory);
    private readonly TournamentId _tournament = new(Guid.NewGuid());
    private readonly Guid _owner = Guid.NewGuid();
    private int _termsRevision = 3;

    private Field Track(EntryTerms? terms = null) => Field.Track(_tournament, terms ?? _open, _termsRevision, _at);

    private static Entry Enter(Field field, int minutes = 0)
    {
        var id = new EntryId(Guid.NewGuid());
        field.Enter(id, new GuestId(Guid.NewGuid()), GuestKind.Player, Guid.NewGuid(), _at.AddMinutes(minutes)).Outcome.ShouldBe(WriteOutcome.Applied);
        return field.Find(id)!;
    }

    private void Apply(Field field, EntryTerms terms) => field.ApplyTerms(terms, ++_termsRevision, _at).ShouldBeTrue();

    private WriteResult CheckIn(Field field, Entry entry) => field.SetCheckIn(entry.Id, checkedIn: true, entry.CheckInRevision, _owner, _at);

    private WriteResult MarkAbsent(Field field, Entry entry) => field.MarkAbsent(entry.Id, entry.Revision, _owner, _at);

    [Fact]
    [Trait("covers", "entrant-check-in: The owner marks a pending entry absent")]
    public void The_owner_marks_a_pending_entry_absent()
    {
        var field = Track();
        var present = Enter(field);
        var absent = Enter(field, 1);
        CheckIn(field, present);
        Apply(field, _open with { Registration = RegistrationState.Closed });
        field.ClearDomainEvents();

        MarkAbsent(field, absent).Outcome.ShouldBe(WriteOutcome.Applied);

        absent.State.ShouldBe(EntryState.Cancelled);
        absent.CancellationCause.ShouldBe(CancellationCause.AbsentAtStart);
        absent.CancelledBy.ShouldBe(_owner);
        field.Eligible.Select(eligible => eligible.Entry).ShouldBe([present]);
        field.Pending.ShouldBe(0);
        field.DomainEvents.ShouldBe([new EntryCancelled(_tournament, absent.Id, CancellationCause.AbsentAtStart, _owner, _at)]);
    }

    [Fact]
    [Trait("covers", "entrant-check-in: A freed slot promotes nothing after closure")]
    public void A_slot_freed_by_an_absence_promotes_nothing_after_closure()
    {
        var field = Track();
        Enter(field);
        var absent = Enter(field, 1);
        var waiting = Enter(field, 2);
        Apply(field, _open with { Registration = RegistrationState.Closed });

        MarkAbsent(field, absent).Outcome.ShouldBe(WriteOutcome.Applied);

        waiting.State.ShouldBe(EntryState.Waiting);
    }

    [Fact]
    [Trait("covers", "entrant-check-in: A confirmed entry is not marked absent")]
    public void A_checked_in_entry_is_not_marked_absent()
    {
        var field = Track();
        var entry = Enter(field);
        CheckIn(field, entry);

        MarkAbsent(field, entry).Broken.ShouldBe([new BrokenRule("entry", "not-pending")]);
        entry.State.ShouldBe(EntryState.Admitted);
    }

    [Fact]
    public void Nothing_is_marked_absent_under_an_optional_policy()
    {
        var field = Track(_open with { CheckIn = CheckInPolicy.Optional });
        var entry = Enter(field);

        MarkAbsent(field, entry).Broken.ShouldBe([new BrokenRule("entry", "not-pending")]);
    }

    [Fact]
    public void Marking_absent_twice_is_a_repeat()
    {
        var field = Track();
        var entry = Enter(field);
        MarkAbsent(field, entry);

        field.MarkAbsent(entry.Id, 1, _owner, _at).Outcome.ShouldBe(WriteOutcome.Repeated);
    }

    [Fact]
    [Trait("covers", "entrant-check-in: Optional check-in has no review")]
    public void Under_an_optional_policy_every_admitted_entry_is_eligible_and_none_is_pending()
    {
        var field = Track(_open with { CheckIn = CheckInPolicy.Optional });
        Enter(field);
        Enter(field, 1);
        Apply(field, _open with { CheckIn = CheckInPolicy.Optional, Registration = RegistrationState.Closed });

        field.Pending.ShouldBe(0);
        field.Eligible.Count.ShouldBe(2);
    }

    [Fact]
    [Trait("covers", "round-robin-pairings: A check-in under a mandatory policy changes the field")]
    public void A_check_in_under_a_mandatory_policy_makes_the_entry_eligible_under_a_new_revision()
    {
        var field = Track();
        var entry = Enter(field);
        var revision = field.EligibleRevision;

        CheckIn(field, entry);

        field.Eligible.Select(eligible => eligible.Entry).ShouldBe([entry]);
        field.EligibleRevision.ShouldBe(revision + 1);
    }

    [Fact]
    public void Eligible_entrants_are_ordered_by_admission()
    {
        var field = Track(_open with { CheckIn = CheckInPolicy.Optional });
        var first = Enter(field);
        var second = Enter(field, 1);

        field.Eligible.ShouldBe([new EligibleEntry(first, 1), new EligibleEntry(second, 2)]);
    }

    [Fact]
    public void A_waiting_entry_leaves_the_eligible_revision_alone()
    {
        var field = Track(_open with { CheckIn = CheckInPolicy.Optional });
        Enter(field);
        Enter(field, 1);
        var revision = field.EligibleRevision;

        Enter(field, 2);

        field.EligibleRevision.ShouldBe(revision);
    }

    [Fact]
    public void Closing_registration_changes_the_eligible_revision()
    {
        var field = Track();
        var revision = field.EligibleRevision;

        Apply(field, _open with { Registration = RegistrationState.Closed });

        field.EligibleRevision.ShouldBe(revision + 1);
    }

    [Fact]
    [Trait("covers", "guest-entries: Cancelling after publication")]
    public void Cancelling_is_rejected_while_the_schedule_is_published()
    {
        var field = Track();
        var entry = Enter(field);
        Apply(field, _open with { Registration = RegistrationState.Closed, FieldLocked = true });

        field.Cancel(entry.Id, entry.Revision, _owner, _at).Broken.ShouldBe([new BrokenRule("field", "schedule-published")]);
        entry.State.ShouldBe(EntryState.Admitted);
    }

    [Fact]
    [Trait("covers", "guest-entries: After withdrawal")]
    public void Cancelling_works_again_once_the_schedule_is_withdrawn()
    {
        var field = Track();
        var entry = Enter(field);
        Apply(field, _open with { Registration = RegistrationState.Closed, FieldLocked = true });
        Apply(field, _open with { Registration = RegistrationState.Closed });

        field.Cancel(entry.Id, entry.Revision, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);
        entry.CancellationCause.ShouldBe(CancellationCause.Owner);
    }

    [Fact]
    [Trait("covers", "guest-entries: Two causes")]
    public void Each_cancellation_records_its_cause()
    {
        var field = Track();
        var cancelled = Enter(field);
        var absent = Enter(field, 1);

        field.Cancel(cancelled.Id, cancelled.Revision, _owner, _at);
        MarkAbsent(field, absent);

        cancelled.CancellationCause.ShouldBe(CancellationCause.Owner);
        absent.CancellationCause.ShouldBe(CancellationCause.AbsentAtStart);
    }

    [Fact]
    public void Admitting_and_marking_absent_are_rejected_while_the_schedule_is_published()
    {
        var field = Track(_open with { Admission = Admission.Manual });
        var waiting = Enter(field);
        Apply(field, _open with { Admission = Admission.Manual, Registration = RegistrationState.Closed, FieldLocked = true });

        field.Admit(waiting.Id, waiting.Revision, reason: null, _owner, _at).Broken.ShouldBe([new BrokenRule("field", "schedule-published")]);
    }

    [Fact]
    [Trait("covers", "entrant-check-in: Undo after publication")]
    public void Undoing_a_check_in_is_rejected_while_the_schedule_is_published()
    {
        var field = Track();
        var entry = Enter(field);
        CheckIn(field, entry);
        Apply(field, _open with { Registration = RegistrationState.Closed, FieldLocked = true });

        field.SetCheckIn(entry.Id, checkedIn: false, entry.CheckInRevision, _owner, _at).Broken.ShouldBe([new BrokenRule("field", "schedule-published")]);
        entry.IsCheckedIn.ShouldBeTrue();
    }
}
