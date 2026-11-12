using Herald.BuildingBlocks;

namespace Herald.Tournaments.Domain;

public readonly record struct TournamentId(Guid Value);

public enum Publication
{
    Draft,
    Published,
}

// §5: not open and closed are different facts; closed means it was open.
public enum RegistrationWindow
{
    NotOpen,
    Open,
    Closed,
}

public enum WriteOutcome
{
    Applied,

    // The write is already in effect: a retry, answered with the current tournament.
    Repeated,

    // Based on an older revision: nothing changes.
    Stale,

    Rejected,
}

// The tournament's entries as Registration last reported them (design D-3); none before the first report.
// CheckedIn: confirmed check-ins among the admitted entries; 0 in a report sent before check-in existed.
public readonly record struct EntryCounts(int Admitted, int Waiting, int CheckedIn = 0)
{
    public static readonly EntryCounts None = new(0, 0);

    public int Active => Admitted + Waiting;
}

public readonly record struct WriteResult(WriteOutcome Outcome, IReadOnlyList<BrokenRule> Broken)
{
    public static implicit operator WriteResult(WriteOutcome outcome) => new(outcome, []);
}

// Actors are person identifiers of the Organisations module, opaque here.
public sealed record TournamentDrafted(TournamentId TournamentId, Guid CreatedBy, DateTimeOffset CreatedAt) : IDomainEvent;

public sealed record TournamentPublished(TournamentId TournamentId, Guid PublishedBy, DateTimeOffset PublishedAt) : IDomainEvent;

public sealed record TournamentRegistrationOpened(TournamentId TournamentId, Guid OpenedBy, DateTimeOffset OpenedAt) : IDomainEvent;

public sealed record TournamentRegistrationClosed(TournamentId TournamentId, Guid ClosedBy, DateTimeOffset ClosedAt) : IDomainEvent;

public sealed class Tournament : AggregateRoot<TournamentId>
{
    // For EF Core, which sets the configuration after constructing.
    private Tournament(TournamentId id)
        : base(id) => Configuration = null!;

    private Tournament(TournamentId id, TournamentConfiguration configuration, Guid actor, DateTimeOffset at)
        : base(id)
    {
        Configuration = configuration;
        CreatedBy = ChangedBy = actor;
        CreatedAt = ChangedAt = at;
    }

    public TournamentConfiguration Configuration { get; private set; }

    public Publication Publication { get; private set; }

    // Starts at 1 and grows by one with each effective change; writes state the one they were based on.
    public int Revision { get; private set; } = 1;

    public Guid CreatedBy { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public Guid ChangedBy { get; private set; }

    public DateTimeOffset ChangedAt { get; private set; }

    public Guid? PublishedBy { get; private set; }

    public DateTimeOffset? PublishedAt { get; private set; }

    public RegistrationWindow Registration { get; private set; }

    // The last opening or closing only: no entrant exists yet whom a history would serve (design A-1).
    public Guid? RegistrationChangedBy { get; private set; }

    public DateTimeOffset? RegistrationChangedAt { get; private set; }

    public static Tournament Draft(TournamentId id, TournamentConfiguration configuration, Guid actor, DateTimeOffset at)
    {
        configuration = configuration.Normalised();
        if (configuration.Check() is { Count: > 0 } broken)
        {
            throw new ArgumentException($"The configuration breaks {broken[0].Field}: {broken[0].Rule}.", nameof(configuration));
        }

        var tournament = new Tournament(id, configuration, actor, at);
        tournament.Raise(new TournamentDrafted(id, actor, at));
        return tournament;
    }

    // A creation with the same identifier is a retry only when its content matches.
    public bool Repeats(TournamentConfiguration configuration) => Configuration == configuration.Normalised();

    public WriteResult Change(TournamentConfiguration configuration, int expectedRevision, Guid actor, DateTimeOffset at, EntryCounts entries = default)
    {
        configuration = configuration.Normalised();
        if (configuration == Configuration)
        {
            return WriteOutcome.Repeated;
        }

        if (expectedRevision != Revision)
        {
            return WriteOutcome.Stale;
        }

        var broken = configuration.Check();
        if (broken.Count == 0 && Publication == Publication.Published)
        {
            // A published tournament stays complete (R-5), and keeps its announced window while registration is open (RW-5).
            broken = Required(configuration, withRegistrationDates: Registration == RegistrationWindow.Open);
        }

        if (broken.Count == 0)
        {
            broken = LockedByEntries(configuration, entries);
        }

        if (broken.Count > 0)
        {
            return new(WriteOutcome.Rejected, broken);
        }

        Configuration = configuration;
        Touch(actor, at);
        return WriteOutcome.Applied;
    }

    // Published and nothing else: registration and competition are untouched, and there is no way back (§5.1).
    public WriteResult Publish(int expectedRevision, Guid actor, DateTimeOffset at)
    {
        if (Publication == Publication.Published)
        {
            return WriteOutcome.Repeated;
        }

        if (expectedRevision != Revision)
        {
            return WriteOutcome.Stale;
        }

        if (Required(Configuration, withRegistrationDates: false) is { Count: > 0 } missing)
        {
            return new(WriteOutcome.Rejected, missing);
        }

        Publication = Publication.Published;
        PublishedBy = actor;
        PublishedAt = at;
        Touch(actor, at);
        Raise(new TournamentPublished(Id, actor, at));
        return WriteOutcome.Applied;
    }

    // Opens, or reopens, by the owner's action only: the announced dates are required but no clock is read (RW-1, RW-2, RW-4).
    public WriteResult OpenRegistration(int expectedRevision, Guid actor, DateTimeOffset at)
    {
        if (Registration == RegistrationWindow.Open)
        {
            return WriteOutcome.Repeated;
        }

        if (expectedRevision != Revision)
        {
            return WriteOutcome.Stale;
        }

        if (Publication != Publication.Published)
        {
            return new(WriteOutcome.Rejected, [new("registration", "not-published")]);
        }

        if (Configuration.MissingForRegistration() is { Count: > 0 } missing)
        {
            return new(WriteOutcome.Rejected, [.. missing.Select(field => new BrokenRule(field, "required"))]);
        }

        ChangeRegistration(RegistrationWindow.Open, actor, at);
        Raise(new TournamentRegistrationOpened(Id, actor, at));
        return WriteOutcome.Applied;
    }

    // Closed and nothing else: no freeze, no pairing, no start (§5.1, RW-3).
    public WriteResult CloseRegistration(int expectedRevision, Guid actor, DateTimeOffset at)
    {
        if (Registration == RegistrationWindow.Closed)
        {
            return WriteOutcome.Repeated;
        }

        if (expectedRevision != Revision)
        {
            return WriteOutcome.Stale;
        }

        if (Registration != RegistrationWindow.Open)
        {
            return new(WriteOutcome.Rejected, [new("registration", "not-open")]);
        }

        ChangeRegistration(RegistrationWindow.Closed, actor, at);
        Raise(new TournamentRegistrationClosed(Id, actor, at));
        return WriteOutcome.Applied;
    }

    // Entries keep their slots and their kind: capacity cannot fall below the admitted, and kind and admission wait until none is active (EN-10).
    // The check-in policy waits until no admitted entry has checked in (h1-check-in R-7).
    private List<BrokenRule> LockedByEntries(TournamentConfiguration configuration, EntryCounts entries)
    {
        var broken = new List<BrokenRule>();
        if (configuration.Capacity < entries.Admitted)
        {
            broken.Add(new("capacity", "below-admitted"));
        }

        if (entries.Active > 0 && configuration.EntryKind != Configuration.EntryKind)
        {
            broken.Add(new("entryKind", "locked-by-entries"));
        }

        if (entries.Active > 0 && configuration.Admission != Configuration.Admission)
        {
            broken.Add(new("admission", "locked-by-entries"));
        }

        if (entries.CheckedIn > 0 && configuration.CheckIn != Configuration.CheckIn)
        {
            broken.Add(new("checkIn", "locked-by-check-ins"));
        }

        return broken;
    }

    private static List<BrokenRule> Required(TournamentConfiguration configuration, bool withRegistrationDates) =>
        [.. configuration.MissingForPublication()
            .Concat(withRegistrationDates ? configuration.MissingForRegistration() : [])
            .Select(field => new BrokenRule(field, "required"))];

    private void ChangeRegistration(RegistrationWindow registration, Guid actor, DateTimeOffset at)
    {
        Registration = registration;
        RegistrationChangedBy = actor;
        RegistrationChangedAt = at;
        Touch(actor, at);
    }

    private void Touch(Guid actor, DateTimeOffset at)
    {
        Revision++;
        ChangedBy = actor;
        ChangedAt = at;
    }
}
