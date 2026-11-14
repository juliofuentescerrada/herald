using Herald.BuildingBlocks;

namespace Herald.Competition.Domain;

// The tournament's identifier, owned by the Tournaments module and opaque here.
public readonly record struct TournamentId(Guid Value);

public enum Seeding
{
    AdmissionOrder,
    Draw,
}

public sealed record Entrant(Guid EntryId, string Name, int AdmissionOrder);

public sealed record PendingEntrant(Guid EntryId, string Name);

// The eligible field as Registration last reported it (D-2); entrants are in admission order.
public sealed record EligibleField(int Revision, bool RegistrationClosed, IReadOnlyList<PendingEntrant> Pending, IReadOnlyList<Entrant> Entrants);

// A draft or published set of pairings, with the field and seeding it came from.
public sealed record Pairings(Seeding Seeding, int? Seed, int EligibleRevision, IReadOnlyList<Entrant> Entrants, IReadOnlyList<Match> Matches, IReadOnlyList<Rest> Rests);

// OperationId lets a retried generation return the same draft (D-8); a draft returned by a withdrawal has none.
public sealed record Draft(Guid? OperationId, Pairings Pairings, Guid GeneratedBy, DateTimeOffset GeneratedAt);

// Kept for good once published (ADR 0007); a withdrawal adds its reason, who and when.
public sealed record Publication(
    int Number,
    Pairings Pairings,
    Guid PublishedBy,
    DateTimeOffset PublishedAt,
    string? WithdrawalReason = null,
    Guid? WithdrawnBy = null,
    DateTimeOffset? WithdrawnAt = null)
{
    public bool IsWithdrawn => WithdrawnAt is not null;
}

// What changed between the field a set of pairings came from and the current one (D-5).
public sealed record FieldChange(IReadOnlyList<Entrant> Added, IReadOnlyList<Entrant> Removed);

public sealed record DraftGenerated(TournamentId TournamentId, Seeding Seeding, int? Seed, int EligibleRevision, Guid GeneratedBy, DateTimeOffset GeneratedAt) : IDomainEvent;

public sealed record SchedulePublished(TournamentId TournamentId, int Number, Guid PublishedBy, DateTimeOffset PublishedAt) : IDomainEvent;

public sealed record ScheduleWithdrawn(TournamentId TournamentId, int Number, string Reason, Guid WithdrawnBy, DateTimeOffset WithdrawnAt) : IDomainEvent;

// One tournament's round-robin: the eligible field, at most one draft and the published revisions (D-1).
public sealed class Schedule : AggregateRoot<TournamentId>
{
    public const int ReasonMaxLength = 500;

    private List<Publication> _publications = [];

    // For EF Core, which sets the field after constructing.
    private Schedule(TournamentId id)
        : base(id) => Field = null!;

    private Schedule(TournamentId id, EligibleField field)
        : base(id) => Field = field;

    public EligibleField Field { get; private set; }

    // Starts at 1 and grows by one with each change; writes state it and Tournaments keeps the highest (D-4, D-8).
    public int Revision { get; private set; } = 1;

    public Draft? Draft { get; private set; }

    public IReadOnlyList<Publication> Publications
    {
        get => _publications;
        private set => _publications = [.. value];
    }

    public Publication? Current => _publications.LastOrDefault(publication => !publication.IsWithdrawn);

    // The published revision the competition started on, and when Competition learned of it (h1-competition-start D-3).
    public int? StartedOnRevision { get; private set; }

    public DateTimeOffset? StartedAt { get; private set; }

    // The start was decided on a revision withdrawn just before Competition learned of it (D-4).
    public bool StartCrossedWithdrawal => StartedOnRevision is { } number && _publications.Exists(publication => publication.Number == number && publication.IsWithdrawn);

    public bool IsDraftStale => Draft is { } draft && draft.Pairings.EligibleRevision != Field.Revision;

    // Set while the draft is stale, or while the published revision no longer matches the field (D-5).
    public FieldChange? DraftChange => IsDraftStale ? ChangeFrom(Draft!.Pairings) : null;

    public FieldChange? CrossedChange => Current is { } current && current.Pairings.EligibleRevision != Field.Revision ? ChangeFrom(current.Pairings) : null;

    public static Schedule Track(TournamentId id, EligibleField field) => new(id, field);

    // Once only: a later start report changes nothing. Nothing is repaired here (D-4).
    public bool ApplyStart(int scheduleRevision, DateTimeOffset at)
    {
        if (StartedOnRevision is not null)
        {
            return false;
        }

        StartedOnRevision = scheduleRevision;
        StartedAt = at;
        Revision++;
        return true;
    }

    // Newer reports replace the field; older ones change nothing. Nothing else changes with it.
    public bool ApplyField(EligibleField field)
    {
        if (field.Revision <= Field.Revision)
        {
            return false;
        }

        Field = field;
        Revision++;
        return true;
    }

    // The reasons a draft cannot be generated now, in the order the owner fixes them.
    public IReadOnlyList<BrokenRule> Blockers
    {
        get
        {
            List<BrokenRule> broken = [];
            if (!Field.RegistrationClosed)
            {
                broken.Add(new("registration", "not-closed"));
            }

            if (Field.Pending.Count > 0)
            {
                broken.Add(new("entries", "pending"));
            }

            if (Field.Entrants.Count < 2)
            {
                broken.Add(new("entrants", "fewer-than-two"));
            }

            return broken;
        }
    }

    // A draw needs its seed, chosen by the caller so the domain stays deterministic (D-6).
    public WriteResult Generate(Guid operationId, Seeding seeding, int? seed, int expectedRevision, Guid actor, DateTimeOffset at)
    {
        if (Draft?.OperationId == operationId)
        {
            return WriteOutcome.Repeated;
        }

        if (expectedRevision != Revision)
        {
            return WriteOutcome.Stale;
        }

        if (StartedAt is not null)
        {
            return Started;
        }

        if (Current is not null)
        {
            return WriteResult.Reject("schedule", "published");
        }

        if (Blockers is { Count: > 0 } blockers)
        {
            return new(WriteOutcome.Rejected, blockers);
        }

        if (seeding == Seeding.Draw && seed is null)
        {
            throw new ArgumentNullException(nameof(seed), "A draw needs its seed.");
        }

        var ordered = seeding == Seeding.Draw ? RoundRobin.Shuffle(Field.Entrants, seed!.Value) : Field.Entrants;
        (var matches, var rests) = RoundRobin.Pair([.. ordered.Select(entrant => entrant.EntryId)]);
        var pairings = new Pairings(seeding, seeding == Seeding.Draw ? seed : null, Field.Revision, Field.Entrants, matches, rests);
        Draft = new(operationId, pairings, actor, at);
        Raise(new DraftGenerated(Id, seeding, pairings.Seed, Field.Revision, actor, at));
        Revision++;
        return WriteOutcome.Applied;
    }

    public WriteResult Publish(int expectedRevision, Guid actor, DateTimeOffset at)
    {
        if (Current is not null && Draft is null)
        {
            return WriteOutcome.Repeated;
        }

        if (expectedRevision != Revision)
        {
            return WriteOutcome.Stale;
        }

        if (Draft is null)
        {
            return WriteResult.Reject("draft", "none");
        }

        if (IsDraftStale)
        {
            return WriteResult.Reject("draft", "stale");
        }

        var number = _publications.Count + 1;
        _publications.Add(new(number, Draft.Pairings, actor, at));
        Draft = null;
        Raise(new SchedulePublished(Id, number, actor, at));
        Revision++;
        return WriteOutcome.Applied;
    }

    // The withdrawn revision stays in the history; its pairings come back as the draft (A-3).
    public WriteResult Withdraw(int expectedRevision, string? reason, Guid actor, DateTimeOffset at)
    {
        if (Current is not { } current)
        {
            return _publications.Count > 0 ? WriteOutcome.Repeated : WriteResult.Reject("schedule", "not-published");
        }

        if (expectedRevision != Revision)
        {
            return WriteOutcome.Stale;
        }

        if (StartedAt is not null)
        {
            return Started;
        }

        reason = reason?.Trim();
        if (string.IsNullOrEmpty(reason))
        {
            return WriteResult.Reject("reason", "required");
        }

        if (reason.Length > ReasonMaxLength)
        {
            return WriteResult.Reject("reason", "too-long");
        }

        _publications[_publications.IndexOf(current)] = current with { WithdrawalReason = reason, WithdrawnBy = actor, WithdrawnAt = at };
        // The draft is back by this withdrawal: its author and time are the withdrawal's.
        Draft = new(null, current.Pairings, actor, at);
        Raise(new ScheduleWithdrawn(Id, current.Number, reason, actor, at));
        Revision++;
        return WriteOutcome.Applied;
    }

    private static WriteResult Started => WriteResult.Reject("schedule", "competition-started");

    private FieldChange ChangeFrom(Pairings pairings) => new(
        [.. Field.Entrants.Where(entrant => pairings.Entrants.All(paired => paired.EntryId != entrant.EntryId))],
        [.. pairings.Entrants.Where(paired => Field.Entrants.All(entrant => entrant.EntryId != paired.EntryId))]);
}
