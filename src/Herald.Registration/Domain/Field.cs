using Herald.BuildingBlocks;

namespace Herald.Registration.Domain;

// The tournament's identifier, owned by the Tournaments module and opaque here.
public readonly record struct TournamentId(Guid Value);

public readonly record struct EntryId(Guid Value);

public enum RegistrationState
{
    NotOpen,
    Open,
    Closed,
}

public enum EntryKind
{
    Individual,
    Team,
}

public enum Admission
{
    Automatic,
    Manual,
}

// The facts of the tournament that decide its entries, as Tournaments last reported them (design D-3).
// The roster sizes are set for a team tournament; terms sent before rosters existed lack them.
public sealed record EntryTerms(
    RegistrationState Registration,
    int Capacity,
    EntryKind EntryKind,
    Admission Admission,
    int? MinimumRosterSize = null,
    int? MaximumRosterSize = null);

// Derived from the members and the bounds when read, never stored (h1-team-rosters D-4).
public enum RosterReadiness
{
    AwaitingTerms,
    Incomplete,
    Complete,
    AboveMaximum,
}

public sealed record GuestEntered(TournamentId TournamentId, EntryId EntryId, GuestId GuestId, Guid EnteredBy, DateTimeOffset EnteredAt) : IDomainEvent;

// AdmittedBy is null when nobody acted: a promotion caused by new terms.
public sealed record EntryAdmitted(TournamentId TournamentId, EntryId EntryId, AdmissionMethod Method, Guid? AdmittedBy, DateTimeOffset AdmittedAt) : IDomainEvent;

public sealed record EntryCancelled(TournamentId TournamentId, EntryId EntryId, Guid CancelledBy, DateTimeOffset CancelledAt) : IDomainEvent;

public sealed record RosterMemberAdded(TournamentId TournamentId, EntryId EntryId, GuestId GuestId, int RosterRevision, Guid AddedBy, DateTimeOffset AddedAt) : IDomainEvent;

public sealed record RosterMemberRemoved(TournamentId TournamentId, EntryId EntryId, GuestId GuestId, int RosterRevision, Guid RemovedBy, DateTimeOffset RemovedAt) : IDomainEvent;

public sealed record EntryCheckedIn(TournamentId TournamentId, EntryId EntryId, int CheckInRevision, Guid CheckedInBy, DateTimeOffset CheckedInAt) : IDomainEvent;

public sealed record EntryCheckInUndone(TournamentId TournamentId, EntryId EntryId, int CheckInRevision, Guid UndoneBy, DateTimeOffset UndoneAt) : IDomainEvent;

// The entries of one tournament. Every admission rule is decided here, under one concurrency token,
// so two writes cannot both take the last slot (EN-9) and a freed slot is filled in the same change.
public sealed class Field : AggregateRoot<TournamentId>
{
    public const int ReasonMaxLength = 500;

    private readonly List<Entry> _entries = [];

    // For EF Core, which sets the terms after constructing.
    private Field(TournamentId id)
        : base(id) => Terms = null!;

    private Field(TournamentId id, EntryTerms terms, int termsRevision)
        : base(id)
    {
        Terms = terms;
        TermsRevision = termsRevision;
    }

    public EntryTerms Terms { get; private set; }

    // The tournament revision the terms come from; older terms are ignored.
    public int TermsRevision { get; private set; }

    // Starts at 1 and grows by one with each effective change; Tournaments keeps the highest it receives.
    public int Revision { get; private set; } = 1;

    // The last time the terms were received, shown so a lag is visible (design D-5).
    public DateTimeOffset TermsReceivedAt { get; private set; }

    // Gives entries with the same waiting time a stable order (EN-6).
    public long LastSequence { get; private set; }

    public IReadOnlyList<Entry> Entries => _entries;

    public int Admitted => _entries.Count(entry => entry.State == EntryState.Admitted);

    public int Waiting => _entries.Count(entry => entry.State == EntryState.Waiting);

    public int CheckedIn => _entries.Count(entry => entry.State == EntryState.Admitted && entry.IsCheckedIn);

    // Crossed changes are reported, never repaired (EN-12).
    public int OverCapacityBy => Math.Max(0, Admitted - Terms.Capacity);

    public bool HasKindMismatch => _entries.Any(entry => entry.IsActive && entry.GuestKind != KindFor(Terms.EntryKind));

    public bool HasMismatch => OverCapacityBy > 0 || HasKindMismatch;

    public static Field Track(TournamentId id, EntryTerms terms, int termsRevision, DateTimeOffset at) =>
        new(id, terms, termsRevision) { TermsReceivedAt = at };

    public Entry? Find(EntryId id) => _entries.Find(entry => entry.Id == id);

    // Waiting entries in order: the time they started waiting, then their sequence (EN-6).
    public IEnumerable<Entry> Queue => _entries
        .Where(entry => entry.State == EntryState.Waiting)
        .OrderBy(entry => entry.WaitingSince)
        .ThenBy(entry => entry.Sequence);

    // Newer terms replace the stored ones and may fill free slots (EN-8); older ones change nothing.
    public bool ApplyTerms(EntryTerms terms, int termsRevision, DateTimeOffset at)
    {
        if (termsRevision <= TermsRevision)
        {
            return false;
        }

        Terms = terms;
        TermsRevision = termsRevision;
        TermsReceivedAt = at;
        Promote(actor: null, at);
        Revision++;
        return true;
    }

    public WriteResult Enter(EntryId id, GuestId guest, GuestKind kind, Guid actor, DateTimeOffset at)
    {
        if (Find(id) is { } existing)
        {
            return existing.GuestId == guest ? WriteOutcome.Repeated : WriteResult.Reject("entry", "identifier-reused");
        }

        if (Terms.Registration != RegistrationState.Open)
        {
            return WriteResult.Reject("registration", "not-open");
        }

        if (kind != KindFor(Terms.EntryKind))
        {
            return WriteResult.Reject("guest", "kind");
        }

        if (HasMismatch)
        {
            return WriteResult.Reject("field", "mismatch");
        }

        if (_entries.Any(entry => entry.GuestId == guest && entry.IsActive))
        {
            return WriteResult.Reject("guest", "already-entered");
        }

        var entry = new Entry(id, guest, kind, ++LastSequence, actor, at);
        _entries.Add(entry);
        Raise(new GuestEntered(Id, id, guest, actor, at));
        if (Terms.Admission == Admission.Manual)
        {
            entry.Wait(WaitingReason.AdmissionPending);
        }
        else if (HasFreeSlot)
        {
            AdmitEntry(entry, AdmissionMethod.Automatic, actor, reason: null, at);
        }
        else
        {
            entry.Wait(WaitingReason.CapacityFull);
        }

        Revision++;
        return WriteOutcome.Applied;
    }

    // The owner admits a waiting entry while a slot is free, open or closed (EN-2, EN-7).
    public WriteResult Admit(EntryId id, int expectedRevision, string? reason, Guid actor, DateTimeOffset at)
    {
        var entry = Find(id) ?? throw new KeyNotFoundException($"No entry {id.Value} in field {Id.Value}.");
        if (entry.State == EntryState.Admitted)
        {
            return WriteOutcome.Repeated;
        }

        if (expectedRevision != entry.Revision)
        {
            return WriteOutcome.Stale;
        }

        if (entry.State == EntryState.Cancelled)
        {
            return WriteResult.Reject("entry", "cancelled");
        }

        if (HasMismatch)
        {
            return WriteResult.Reject("field", "mismatch");
        }

        if (!HasFreeSlot)
        {
            return WriteResult.Reject("capacity", "full");
        }

        reason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim();
        if (reason is { Length: > ReasonMaxLength })
        {
            return WriteResult.Reject("reason", "too-long");
        }

        // Skipping the capacity queue is a departure from policy, so it is explained (RI-04).
        var skipsQueue = entry.WaitingReason == WaitingReason.CapacityFull
            && Queue.First(waiting => waiting.WaitingReason == WaitingReason.CapacityFull) != entry;
        if (skipsQueue && reason is null)
        {
            return WriteResult.Reject("reason", "required");
        }

        AdmitEntry(entry, AdmissionMethod.Owner, actor, reason, at);
        Revision++;
        return WriteOutcome.Applied;
    }

    // Final for the entry; a freed slot follows the policy (EN-3, EN-8).
    public WriteResult Cancel(EntryId id, int expectedRevision, Guid actor, DateTimeOffset at)
    {
        var entry = Find(id) ?? throw new KeyNotFoundException($"No entry {id.Value} in field {Id.Value}.");
        if (entry.State == EntryState.Cancelled)
        {
            return WriteOutcome.Repeated;
        }

        if (expectedRevision != entry.Revision)
        {
            return WriteOutcome.Stale;
        }

        entry.Cancel(actor, at);
        Raise(new EntryCancelled(Id, id, actor, at));
        Promote(actor, at);
        Revision++;
        return WriteOutcome.Applied;
    }

    // Null for an individual tournament, which has no rosters.
    public RosterReadiness? ReadinessOf(Entry entry) => Terms switch
    {
        { EntryKind: not EntryKind.Team } => null,
        { MinimumRosterSize: { } minimum, MaximumRosterSize: { } maximum } => entry.Members.Count < minimum ? RosterReadiness.Incomplete
            : entry.Members.Count > maximum ? RosterReadiness.AboveMaximum
            : RosterReadiness.Complete,
        _ => RosterReadiness.AwaitingTerms,
    };

    // The active team entry, other than the one excepted, whose roster holds the player (R-5).
    public Entry? TeamOf(GuestId player, EntryId? except = null) =>
        _entries.Find(entry => entry.IsActive && entry.Id != except && entry.HasMember(player));

    // The owner adds a guest player to an active team entry until start, open or closed (R-3, A-1).
    public WriteResult AddRosterMember(EntryId id, GuestId player, GuestKind kind, int expectedRosterRevision, Guid actor, DateTimeOffset at)
    {
        var entry = Find(id) ?? throw new KeyNotFoundException($"No entry {id.Value} in field {Id.Value}.");
        if (Terms.EntryKind != EntryKind.Team)
        {
            return WriteResult.Reject("entry", "not-team-tournament");
        }

        if (entry.HasMember(player))
        {
            return WriteOutcome.Repeated;
        }

        if (expectedRosterRevision != entry.RosterRevision)
        {
            return WriteOutcome.Stale;
        }

        if (entry.State == EntryState.Cancelled)
        {
            return WriteResult.Reject("entry", "cancelled");
        }

        if (kind != GuestKind.Player)
        {
            return WriteResult.Reject("guestId", "not-a-player");
        }

        if (Terms.MaximumRosterSize is not { } maximum)
        {
            return WriteResult.Reject("roster", "awaiting-terms");
        }

        if (TeamOf(player, id) is not null)
        {
            return WriteResult.Reject("guestId", "on-another-team");
        }

        if (entry.Members.Count >= maximum)
        {
            return WriteResult.Reject("roster", "full");
        }

        entry.AddMember(player, actor, at);
        Raise(new RosterMemberAdded(Id, id, player, entry.RosterRevision, actor, at));
        Revision++;
        return WriteOutcome.Applied;
    }

    // Needs no reason (R-10); the removed player stays in the roster's history.
    public WriteResult RemoveRosterMember(EntryId id, GuestId player, int expectedRosterRevision, Guid actor, DateTimeOffset at)
    {
        var entry = Find(id) ?? throw new KeyNotFoundException($"No entry {id.Value} in field {Id.Value}.");
        if (Terms.EntryKind != EntryKind.Team)
        {
            return WriteResult.Reject("entry", "not-team-tournament");
        }

        if (!entry.HasMember(player))
        {
            return WriteOutcome.Repeated;
        }

        if (expectedRosterRevision != entry.RosterRevision)
        {
            return WriteOutcome.Stale;
        }

        if (entry.State == EntryState.Cancelled)
        {
            return WriteResult.Reject("entry", "cancelled");
        }

        if (Terms.MaximumRosterSize is null)
        {
            return WriteResult.Reject("roster", "awaiting-terms");
        }

        entry.RemoveMember(player, actor, at);
        Raise(new RosterMemberRemoved(Id, id, player, entry.RosterRevision, actor, at));
        Revision++;
        return WriteOutcome.Applied;
    }

    // The owner confirms, or undoes, an admitted entry's check-in until start, whatever the registration (R-1, R-3).
    public WriteResult SetCheckIn(EntryId id, bool checkedIn, int expectedCheckInRevision, Guid actor, DateTimeOffset at)
    {
        var entry = Find(id) ?? throw new KeyNotFoundException($"No entry {id.Value} in field {Id.Value}.");

        // The state first: a cancelled entry keeps its check-in read only, even one matching the request.
        if (entry.State == EntryState.Cancelled)
        {
            return WriteResult.Reject("entry", "cancelled");
        }

        if (entry.State != EntryState.Admitted)
        {
            return WriteResult.Reject("entry", "not-admitted");
        }

        if (entry.IsCheckedIn == checkedIn)
        {
            return WriteOutcome.Repeated;
        }

        if (expectedCheckInRevision != entry.CheckInRevision)
        {
            return WriteOutcome.Stale;
        }

        entry.SetCheckIn(checkedIn, actor, at);
        Raise(checkedIn
            ? new EntryCheckedIn(Id, id, entry.CheckInRevision, actor, at)
            : new EntryCheckInUndone(Id, id, entry.CheckInRevision, actor, at));
        Revision++;
        return WriteOutcome.Applied;
    }

    private bool HasFreeSlot => Admitted < Terms.Capacity;

    // Only with automatic admission and open registration does a free slot admit anyone by itself (EN-8).
    private void Promote(Guid? actor, DateTimeOffset at)
    {
        if (Terms is not { Admission: Admission.Automatic, Registration: RegistrationState.Open } || HasKindMismatch)
        {
            return;
        }

        while (HasFreeSlot && Queue.FirstOrDefault(entry => entry.WaitingReason == WaitingReason.CapacityFull) is { } next)
        {
            AdmitEntry(next, AdmissionMethod.Promotion, actor, reason: null, at);
        }
    }

    private void AdmitEntry(Entry entry, AdmissionMethod method, Guid? actor, string? reason, DateTimeOffset at)
    {
        entry.Admit(method, actor, reason, at);
        Raise(new EntryAdmitted(Id, entry.Id, method, actor, at));
    }

    private static GuestKind KindFor(EntryKind kind) => kind == EntryKind.Team ? GuestKind.Team : GuestKind.Player;
}
