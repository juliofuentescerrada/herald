using Herald.Registration.Domain;
using Shouldly;

namespace Herald.Registration.Tests.Domain;

public class CheckInTests
{
    private static readonly DateTimeOffset _at = new(2026, 11, 12, 10, 42, 0, TimeSpan.Zero);
    private static readonly EntryTerms _players = new(RegistrationState.Open, 2, EntryKind.Individual, Admission.Automatic);
    private readonly TournamentId _tournament = new(Guid.NewGuid());
    private readonly Guid _owner = Guid.NewGuid();

    private Field Track(EntryTerms? terms = null) => Field.Track(_tournament, terms ?? _players, termsRevision: 3, _at);

    private static Entry Enter(Field field, GuestKind kind = GuestKind.Player)
    {
        var id = new EntryId(Guid.NewGuid());
        field.Enter(id, new GuestId(Guid.NewGuid()), kind, Guid.NewGuid(), _at).Outcome.ShouldBe(WriteOutcome.Applied);
        return field.Find(id)!;
    }

    private WriteResult CheckIn(Field field, Entry entry) => field.SetCheckIn(entry.Id, checkedIn: true, entry.CheckInRevision, _owner, _at);

    private WriteResult Undo(Field field, Entry entry) => field.SetCheckIn(entry.Id, checkedIn: false, entry.CheckInRevision, _owner, _at);

    [Fact]
    [Trait("covers", "entrant-check-in: An owner checks in an admitted player")]
    public void An_owner_checks_in_an_admitted_player()
    {
        var field = Track();
        var entry = Enter(field);
        var revision = field.Revision;
        field.ClearDomainEvents();

        CheckIn(field, entry).Outcome.ShouldBe(WriteOutcome.Applied);

        entry.IsCheckedIn.ShouldBeTrue();
        entry.CheckInRevision.ShouldBe(1);
        entry.CheckInChanges.ShouldBe([new CheckInChange(1, CheckInChangeKind.Confirmed, _owner, _at)]);
        entry.Revision.ShouldBe(1);
        field.Revision.ShouldBe(revision + 1);
        field.CheckedIn.ShouldBe(1);
        field.DomainEvents.ShouldBe([new EntryCheckedIn(_tournament, entry.Id, 1, _owner, _at)]);
    }

    [Fact]
    public void An_admitted_entry_starts_pending()
    {
        var field = Track();
        var entry = Enter(field);

        entry.HasCheckIn.ShouldBeTrue();
        entry.IsCheckedIn.ShouldBeFalse();
        entry.CheckInRevision.ShouldBe(0);
    }

    [Fact]
    [Trait("covers", "entrant-check-in: Check-in works whatever the registration state")]
    public void Check_in_works_after_registration_closes()
    {
        var field = Track();
        var entry = Enter(field);
        field.ApplyTerms(_players with { Registration = RegistrationState.Closed }, 4, _at).ShouldBeTrue();

        CheckIn(field, entry).Outcome.ShouldBe(WriteOutcome.Applied);

        entry.IsCheckedIn.ShouldBeTrue();
    }

    [Fact]
    [Trait("covers", "entrant-check-in: A waiting entry cannot check in")]
    public void A_waiting_entry_cannot_check_in()
    {
        var field = Track(_players with { Capacity = 1 });
        Enter(field);
        var waiting = Enter(field);

        CheckIn(field, waiting).Broken.ShouldBe([new BrokenRule("entry", "not-admitted")]);

        waiting.HasCheckIn.ShouldBeFalse();
        waiting.CheckInChanges.ShouldBeEmpty();
    }

    [Fact]
    [Trait("covers", "entrant-check-in: A cancelled entry cannot check in")]
    public void A_cancelled_entry_cannot_check_in()
    {
        var field = Track();
        var entry = Enter(field);
        field.Cancel(entry.Id, entry.Revision, _owner, _at);

        CheckIn(field, entry).Broken.ShouldBe([new BrokenRule("entry", "cancelled")]);

        entry.IsCheckedIn.ShouldBeFalse();
        entry.CheckInRevision.ShouldBe(0);
    }

    [Fact]
    public void A_cancelled_entry_keeps_its_check_in_read_only_even_for_a_matching_request()
    {
        var field = Track();
        var entry = Enter(field);
        CheckIn(field, entry);
        field.Cancel(entry.Id, entry.Revision, _owner, _at);

        CheckIn(field, entry).Broken.ShouldBe([new BrokenRule("entry", "cancelled")]);
        Undo(field, entry).Broken.ShouldBe([new BrokenRule("entry", "cancelled")]);

        entry.IsCheckedIn.ShouldBeTrue();
        entry.CheckInRevision.ShouldBe(1);
    }

    [Fact]
    [Trait("covers", "entrant-check-in: A team checks in without a complete roster")]
    public void A_team_checks_in_without_a_complete_roster()
    {
        var field = Track(new(RegistrationState.Open, 4, EntryKind.Team, Admission.Automatic, MinimumRosterSize: 3, MaximumRosterSize: 5));
        var team = Enter(field, GuestKind.Team);

        CheckIn(field, team).Outcome.ShouldBe(WriteOutcome.Applied);

        team.IsCheckedIn.ShouldBeTrue();
        field.ReadinessOf(team).ShouldBe(RosterReadiness.Incomplete);
        team.RosterRevision.ShouldBe(0);
    }

    [Fact]
    [Trait("covers", "entrant-check-in: A promoted entry starts pending")]
    public void A_promoted_entry_starts_pending()
    {
        var field = Track(_players with { Capacity = 1 });
        var first = Enter(field);
        var waiting = Enter(field);
        CheckIn(field, first);

        field.Cancel(first.Id, first.Revision, _owner, _at);

        waiting.State.ShouldBe(EntryState.Admitted);
        waiting.HasCheckIn.ShouldBeTrue();
        waiting.IsCheckedIn.ShouldBeFalse();
    }

    [Fact]
    [Trait("covers", "entrant-check-in: An owner undoes a check-in made by mistake")]
    public void An_owner_undoes_a_check_in_made_by_mistake()
    {
        var field = Track();
        var entry = Enter(field);
        CheckIn(field, entry);
        field.ClearDomainEvents();

        Undo(field, entry).Outcome.ShouldBe(WriteOutcome.Applied);

        entry.IsCheckedIn.ShouldBeFalse();
        field.CheckedIn.ShouldBe(0);
        field.DomainEvents.ShouldBe([new EntryCheckInUndone(_tournament, entry.Id, 2, _owner, _at)]);
    }

    [Fact]
    public void Repeating_a_check_in_or_undoing_a_pending_one_changes_nothing()
    {
        var field = Track();
        var entry = Enter(field);

        Undo(field, entry).Outcome.ShouldBe(WriteOutcome.Repeated);
        CheckIn(field, entry);
        var revision = field.Revision;

        field.SetCheckIn(entry.Id, checkedIn: true, expectedCheckInRevision: 0, _owner, _at).Outcome.ShouldBe(WriteOutcome.Repeated);

        entry.CheckInRevision.ShouldBe(1);
        field.Revision.ShouldBe(revision);
    }

    [Fact]
    [Trait("covers", "entrant-check-in: Every change is recorded")]
    public void Every_change_is_recorded()
    {
        var field = Track();
        var entry = Enter(field);

        CheckIn(field, entry);
        Undo(field, entry);
        CheckIn(field, entry);

        entry.CheckInRevision.ShouldBe(3);
        entry.CheckInChanges.Select(change => (change.CheckInRevision, change.Kind)).ShouldBe(
            [(1, CheckInChangeKind.Confirmed), (2, CheckInChangeKind.Undone), (3, CheckInChangeKind.Confirmed)]);
        entry.CheckInChanges.ShouldAllBe(change => change.ChangedBy == _owner && change.ChangedAt == _at);
    }

    [Fact]
    [Trait("covers", "entrant-check-in: A stale check-in write is a conflict")]
    public void A_stale_check_in_write_is_a_conflict()
    {
        var field = Track();
        var entry = Enter(field);
        CheckIn(field, entry);
        Undo(field, entry);
        CheckIn(field, entry);

        field.SetCheckIn(entry.Id, checkedIn: false, expectedCheckInRevision: 1, _owner, _at).Outcome.ShouldBe(WriteOutcome.Stale);

        entry.IsCheckedIn.ShouldBeTrue();
        entry.CheckInRevision.ShouldBe(3);
    }

    [Fact]
    public void Admission_and_check_in_keep_separate_revisions()
    {
        var field = Track(_players with { Admission = Admission.Manual });
        var entry = Enter(field);
        field.Admit(entry.Id, entry.Revision, reason: null, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);

        field.SetCheckIn(entry.Id, checkedIn: true, expectedCheckInRevision: 0, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);

        entry.Revision.ShouldBe(2);
        entry.CheckInRevision.ShouldBe(1);
    }

    [Fact]
    [Trait("covers", "entrant-check-in: Cancelling keeps the evidence")]

    [Trait("covers", "entrant-check-in: The count follows check-ins and cancellations")]
    public void Cancelling_keeps_the_evidence_and_stops_counting()
    {
        var field = Track(_players with { Capacity = 4 });
        var entries = Enumerable.Range(0, 3).Select(_ => Enter(field)).ToList();
        entries.ForEach(entry => CheckIn(field, entry));

        field.Cancel(entries[0].Id, entries[0].Revision, _owner, _at);

        entries[0].IsCheckedIn.ShouldBeTrue();
        entries[0].CheckInChanges.Count.ShouldBe(1);
        field.CheckedIn.ShouldBe(2);
    }
}
