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

// A guest's entry in one field. Changed only through its Field, which decides admission.
public sealed class Entry : Entity<EntryId>
{
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

    public bool IsActive => State != EntryState.Cancelled;

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
