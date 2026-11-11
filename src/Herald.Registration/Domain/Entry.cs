using Herald.BuildingBlocks;

namespace Herald.Registration.Domain;

public enum EntryState
{
    Waiting,
    Admitted,
    Cancelled,
}

// Neither reason reserves a slot (F-04).
public enum WaitingReason
{
    CapacityFull,
    AdmissionPending,
}

// How an entry was admitted: on entering, by the owner, or by a freed slot.
public enum AdmissionMethod
{
    Automatic,
    Owner,
    Promotion,
}

public enum RosterChangeKind
{
    Added,
    Removed,
}

// A player on a team entry's tournament roster, kept in the order added (A-3).
public sealed record RosterMember(GuestId GuestId, Guid AddedBy, DateTimeOffset AddedAt);

// One addition or removal, kept for good (ADR 0007): the roster revision it produced, who and when.
public sealed record RosterChange(int RosterRevision, GuestId GuestId, RosterChangeKind Kind, Guid ChangedBy, DateTimeOffset ChangedAt);

// A guest's entry in one field. Changed only through its Field, which decides admission.
public sealed class Entry : Entity<EntryId>
{
    private readonly List<RosterMember> _members = [];
    private readonly List<RosterChange> _rosterChanges = [];

    // For EF Core.
    private Entry(EntryId id)
        : base(id)
    {
    }

    internal Entry(EntryId id, GuestId guest, GuestKind kind, long sequence, Guid actor, DateTimeOffset at)
        : base(id)
    {
        GuestId = guest;
        GuestKind = kind;
        Sequence = sequence;
        EnteredBy = actor;
        EnteredAt = at;
    }

    public GuestId GuestId { get; private set; }

    public GuestKind GuestKind { get; private set; }

    public EntryState State { get; private set; }

    public WaitingReason? WaitingReason { get; private set; }

    public DateTimeOffset? WaitingSince { get; private set; }

    public long Sequence { get; private set; }

    // Starts at 1 and grows by one with each change of this entry; admitting and cancelling state it.
    public int Revision { get; private set; } = 1;

    public Guid EnteredBy { get; private set; }

    public DateTimeOffset EnteredAt { get; private set; }

    public AdmissionMethod? AdmissionMethod { get; private set; }

    public Guid? AdmittedBy { get; private set; }

    public DateTimeOffset? AdmittedAt { get; private set; }

    // Private: why the owner skipped the capacity queue, never shown publicly (EN-7).
    public string? AdmissionReason { get; private set; }

    public Guid? CancelledBy { get; private set; }

    public DateTimeOffset? CancelledAt { get; private set; }

    // Starts at 0 and grows by one with each addition or removal; roster writes state it (design D-2).
    public int RosterRevision { get; private set; }

    public IReadOnlyList<RosterMember> Members => _members;

    public IReadOnlyList<RosterChange> RosterChanges => _rosterChanges;

    public bool IsActive => State != EntryState.Cancelled;

    public bool HasMember(GuestId guest) => _members.Exists(member => member.GuestId == guest);

    internal void AddMember(GuestId guest, Guid actor, DateTimeOffset at)
    {
        _members.Add(new(guest, actor, at));
        _rosterChanges.Add(new(++RosterRevision, guest, RosterChangeKind.Added, actor, at));
    }

    internal void RemoveMember(GuestId guest, Guid actor, DateTimeOffset at)
    {
        _members.RemoveAll(member => member.GuestId == guest);
        _rosterChanges.Add(new(++RosterRevision, guest, RosterChangeKind.Removed, actor, at));
    }

    internal void Wait(WaitingReason reason)
    {
        State = EntryState.Waiting;
        WaitingReason = reason;
        WaitingSince = EnteredAt;
    }

    internal void Admit(AdmissionMethod method, Guid? actor, string? reason, DateTimeOffset at)
    {
        // Admitted on entering is the entry's first state, not a change of it.
        if (WaitingReason is not null)
        {
            Revision++;
        }

        State = EntryState.Admitted;
        WaitingReason = null;
        AdmissionMethod = method;
        AdmittedBy = actor;
        AdmittedAt = at;
        AdmissionReason = reason;
    }

    internal void Cancel(Guid actor, DateTimeOffset at)
    {
        State = EntryState.Cancelled;
        WaitingReason = null;
        CancelledBy = actor;
        CancelledAt = at;
        Revision++;
    }
}
