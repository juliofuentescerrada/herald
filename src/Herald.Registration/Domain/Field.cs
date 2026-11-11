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
public sealed record EntryTerms(RegistrationState Registration, int Capacity, EntryKind EntryKind, Admission Admission);

public sealed record GuestEntered(TournamentId TournamentId, EntryId EntryId, GuestId GuestId, Guid EnteredBy, DateTimeOffset EnteredAt) : IDomainEvent;

// AdmittedBy is null when nobody acted: a promotion caused by new terms.
public sealed record EntryAdmitted(TournamentId TournamentId, EntryId EntryId, AdmissionMethod Method, Guid? AdmittedBy, DateTimeOffset AdmittedAt) : IDomainEvent;

public sealed record EntryCancelled(TournamentId TournamentId, EntryId EntryId, Guid CancelledBy, DateTimeOffset CancelledAt) : IDomainEvent;

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
