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

public sealed record CompetitionStarted(TournamentId TournamentId, int EligibleRevision, int ScheduleRevision, Guid StartedBy, DateTimeOffset StartedAt) : IDomainEvent;

public sealed record TournamentCancelled(TournamentId TournamentId, bool AfterStart, Guid CancelledBy, DateTimeOffset CancelledAt) : IDomainEvent;

public sealed record TournamentArchiveChanged(TournamentId TournamentId, bool Archived, Guid ChangedBy, DateTimeOffset ChangedAt) : IDomainEvent;

// The dates "Change dates" can change; null is a date not selected (design D-5).
public sealed record DateSelection(DateTime? RegistrationOpensAt = null, DateTime? RegistrationClosesAt = null, DateTime? PlannedStartAt = null);

// One effective "Change dates", kept with its old and new values (ADR 0007): a notifiable fact (ADR 0017) with no consumer yet.
public sealed record DatesChanged(
    int FromRevision,
    int ToRevision,
    DateTime? OldRegistrationOpensAt,
    DateTime? NewRegistrationOpensAt,
    DateTime? OldRegistrationClosesAt,
    DateTime? NewRegistrationClosesAt,
    DateTime? OldPlannedStartAt,
    DateTime? NewPlannedStartAt,
    Guid ChangedBy,
    DateTimeOffset ChangedAt);

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
    // Grows with each entry terms snapshot sent to Registration, which keeps the highest (ADR 0016); a schedule's
    // lock changes the terms without changing the tournament, so it cannot be the tournament's revision.
    public int TermsRevision { get; private set; }

    public Guid? RegistrationChangedBy { get; private set; }

    public DateTimeOffset? RegistrationChangedAt { get; private set; }

    public CompetitionState Competition { get; private set; }

    // The highest final revision Competition announced; 0 before the first finalisation (h1-finalisation D-4).
    public int FinalRevision { get; private set; }

    public bool IsStarted => StartedAt is not null;

    public bool IsCancelled => Competition == CompetitionState.Cancelled;

    // Beside the state: hides a finalised or cancelled tournament from the default list (design D-3).
    public bool Archived { get; private set; }

    public Guid? CancelledBy { get; private set; }

    // Tournaments cannot name people, so the name the owner signed in with is kept for the notice (D-6).
    public string? CancelledByName { get; private set; }

    public DateTimeOffset? CancelledAt { get; private set; }

    // The tournament revision the cancellation took effect at: the fact's subject revision (ADR 0007, ADR 0017).
    public int? CancelledAtRevision { get; private set; }

    // Private to the organisation: no event carries it (A-1).
    public string? CancellationReason { get; private set; }

    public IReadOnlyList<DatesChanged> DateChanges { get; private set; } = [];

    public const int ReasonMaxLength = 500;

    public Guid? StartedBy { get; private set; }

    public DateTimeOffset? StartedAt { get; private set; }

    // The eligible field and the schedule revision the start was decided on (design D-1).
    public int? StartedOnEligibleRevision { get; private set; }

    public int? StartedOnScheduleRevision { get; private set; }

    // This change's own change log entries, saved in its transaction (change-log design D-2); not mapped.
    public IReadOnlyList<ChangeLogEntry> Logged => _logged;

    private readonly List<ChangeLogEntry> _logged = [];

    public int NextTermsRevision() => ++TermsRevision;

    // Each start condition with whether it holds, in the order the owner reads them (CP-04).
    public IReadOnlyList<StartCondition> StartConditions(StartReadiness readiness)
    {
        List<StartCondition> conditions =
        [
            new(StartRules.RegistrationClosed, Registration == RegistrationWindow.Closed),
            new(StartRules.NoPendingCheckIn, readiness.Pending == 0),
            new(StartRules.TwoEligible, readiness.Eligible >= 2),
            new(StartRules.ScheduleCurrent, readiness.ScheduleCurrent),
        ];
        if (Configuration.EntryKind == EntryKind.Team)
        {
            conditions.Add(new(StartRules.RostersWithinBounds, readiness.RostersOutsideBounds is { Count: 0 }));
        }

        return conditions;
    }

    // Idempotent on the final revision, whichever of a finalisation and its reopening arrives first (ADR 0016).
    // A cancellation is final: a finalisation or reopening Competition accepted just before it arrived changes nothing (Q2).
    public bool ApplyFinalisation(int finalRevision)
    {
        if (finalRevision <= FinalRevision || IsCancelled)
        {
            return false;
        }

        FinalRevision = finalRevision;
        Competition = CompetitionState.Finalised;
        return true;
    }

    public bool ApplyReopening(int finalRevision)
    {
        if (IsCancelled || finalRevision < FinalRevision || (finalRevision == FinalRevision && Competition != CompetitionState.Finalised))
        {
            return false;
        }

        FinalRevision = finalRevision;
        Competition = CompetitionState.Running;
        return true;
    }

    // Running, by the owner's action only, once every condition holds; no match starts and nothing undoes it (§5.1 row 6, A-3).
    public WriteResult Start(int expectedRevision, StartReadiness readiness, Guid actor, DateTimeOffset at)
    {
        if (IsCancelled)
        {
            return Cancelled;
        }

        if (IsStarted)
        {
            return WriteOutcome.Repeated;
        }

        if (expectedRevision != Revision)
        {
            return WriteOutcome.Stale;
        }

        if (Publication != Publication.Published)
        {
            return new(WriteOutcome.Rejected, [new("competition", "not-published")]);
        }

        if (StartConditions(readiness).Where(condition => !condition.Met).ToList() is { Count: > 0 } unmet)
        {
            return new(WriteOutcome.Rejected, [.. unmet.Select(condition => new BrokenRule("competition", condition.Rule))]);
        }

        Competition = CompetitionState.Running;
        StartedBy = actor;
        StartedAt = at;
        StartedOnEligibleRevision = readiness.EligibleRevision;
        StartedOnScheduleRevision = readiness.PublishedScheduleRevision;
        Touch(actor, at);
        Raise(new CompetitionStarted(Id, readiness.EligibleRevision!.Value, readiness.PublishedScheduleRevision!.Value, actor, at));
        return WriteOutcome.Applied;
    }

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

    public WriteResult Change(
        TournamentConfiguration configuration, int expectedRevision, Guid actor, DateTimeOffset at, EntryCounts entries = default, string? actorName = null)
    {
        configuration = configuration.Normalised();
        if (IsCancelled)
        {
            return Cancelled;
        }

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

        if (broken.Count == 0 && Publication == Publication.Published)
        {
            // A published tournament's dates change only through "Change dates" (D-5, Q3).
            broken = DatesChangedIn(configuration);
        }

        if (broken.Count == 0)
        {
            broken = LockedByEntries(configuration, entries);
        }

        if (broken.Count == 0)
        {
            broken = LockedByStart(configuration);
        }

        if (broken.Count > 0)
        {
            return new(WriteOutcome.Rejected, broken);
        }

        var before = Configuration;
        Configuration = configuration;
        Touch(actor, at);
        if (Publication == Publication.Published)
        {
            // Before publication nobody outside the organisation could see the tournament (change-log A-1).
            LogMaterialChanges(before, actor, actorName, at);
        }

        return WriteOutcome.Applied;
    }

    // Published and nothing else: registration and competition are untouched, and there is no way back (§5.1).
    public WriteResult Publish(int expectedRevision, Guid actor, DateTimeOffset at, string? actorName = null)
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
        Log(ChangeKind.TournamentPublished, actor, actorName, at);
        Raise(new TournamentPublished(Id, actor, at));
        return WriteOutcome.Applied;
    }

    // Opens, or reopens, by the owner's action only: the announced dates are required but no clock is read (RW-1, RW-2, RW-4).
    // A published schedule must be withdrawn first (§5.1 row 2).
    public WriteResult OpenRegistration(int expectedRevision, Guid actor, DateTimeOffset at, bool schedulePublished = false)
    {
        if (IsCancelled)
        {
            return Cancelled;
        }

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

        if (IsStarted)
        {
            return new(WriteOutcome.Rejected, [new("registration", "competition-started")]);
        }

        if (schedulePublished)
        {
            return new(WriteOutcome.Rejected, [new("registration", "schedule-published")]);
        }

        ChangeRegistration(RegistrationWindow.Open, actor, at);
        Raise(new TournamentRegistrationOpened(Id, actor, at));
        return WriteOutcome.Applied;
    }

    // Closed and nothing else: no freeze, no pairing, no start (§5.1, RW-3).
    public WriteResult CloseRegistration(int expectedRevision, Guid actor, DateTimeOffset at)
    {
        if (IsCancelled)
        {
            return Cancelled;
        }

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

    // Final, with a private reason: registration closes and the other modules apply it from the event (§5.1, design D-1).
    public WriteResult Cancel(string? reason, int expectedRevision, Guid actor, DateTimeOffset at, string? actorName = null)
    {
        if (IsCancelled)
        {
            return WriteOutcome.Repeated;
        }

        if (expectedRevision != Revision)
        {
            return WriteOutcome.Stale;
        }

        if (Publication != Publication.Published)
        {
            return new(WriteOutcome.Rejected, [new("tournament", "draft")]);
        }

        if (Competition == CompetitionState.Finalised)
        {
            return new(WriteOutcome.Rejected, [new("competition", "finalised")]);
        }

        reason = reason?.Trim();
        if (string.IsNullOrEmpty(reason))
        {
            return new(WriteOutcome.Rejected, [new("reason", "required")]);
        }

        if (reason.Length > ReasonMaxLength)
        {
            return new(WriteOutcome.Rejected, [new("reason", "too-long")]);
        }

        if (Registration == RegistrationWindow.Open)
        {
            Registration = RegistrationWindow.Closed;
            RegistrationChangedBy = actor;
            RegistrationChangedAt = at;
        }

        Competition = CompetitionState.Cancelled;
        CancelledBy = actor;
        CancelledByName = actorName;
        CancelledAt = at;
        CancellationReason = reason;
        Touch(actor, at);
        CancelledAtRevision = Revision;
        Log(ChangeKind.TournamentCancelled, actor, actorName, at, reason: reason);
        Raise(new TournamentCancelled(Id, IsStarted, actor, at));
        return WriteOutcome.Applied;
    }

    // Only a finalised or cancelled tournament leaves the default list; nothing else changes (§5.1, design D-3).
    public WriteResult Archive(bool archived, int expectedRevision, Guid actor, DateTimeOffset at)
    {
        if (Archived == archived)
        {
            return WriteOutcome.Repeated;
        }

        if (expectedRevision != Revision)
        {
            return WriteOutcome.Stale;
        }

        if (Competition is not (CompetitionState.Finalised or CompetitionState.Cancelled))
        {
            return new(WriteOutcome.Rejected, [new("archive", "not-terminal")]);
        }

        Archived = archived;
        Touch(actor, at);
        Raise(new TournamentArchiveChanged(Id, archived, actor, at));
        return WriteOutcome.Applied;
    }

    // In any state after publication, cancelled and archived included; before it, visibility is part of the configuration
    // (§5.2, h1-public-read D-3). Logged as its own change.
    public WriteResult ChangeVisibility(Visibility visibility, int expectedRevision, Guid actor, DateTimeOffset at, string? actorName = null)
    {
        if (Configuration.Visibility == visibility)
        {
            return WriteOutcome.Repeated;
        }

        if (expectedRevision != Revision)
        {
            return WriteOutcome.Stale;
        }

        if (Publication != Publication.Published)
        {
            return new(WriteOutcome.Rejected, [new("visibility", "not-published")]);
        }

        var before = Configuration.Visibility;
        Configuration = Configuration with { Visibility = visibility };
        Touch(actor, at);
        Log(ChangeKind.VisibilityChanged, actor, actorName, at, Values([("visibility", before, visibility)]));
        return WriteOutcome.Applied;
    }

    // A draft has no entries and no other module holds anything of it, so it is removed whole (design D-4).
    public WriteResult CanDelete(int expectedRevision)
    {
        if (expectedRevision != Revision)
        {
            return WriteOutcome.Stale;
        }

        return Publication == Publication.Draft ? WriteOutcome.Applied : new WriteResult(WriteOutcome.Rejected, [new("tournament", "published")]);
    }

    // Only the selected dates change, keeping the window's order; before start only (§5.2, design D-5).
    public WriteResult ChangeDates(DateSelection dates, int expectedRevision, Guid actor, DateTimeOffset at, string? actorName = null)
    {
        if (IsCancelled)
        {
            return Cancelled;
        }

        var current = Configuration;
        var changed = (current with
        {
            RegistrationOpensAt = dates.RegistrationOpensAt ?? current.RegistrationOpensAt,
            RegistrationClosesAt = dates.RegistrationClosesAt ?? current.RegistrationClosesAt,
            PlannedStartAt = dates.PlannedStartAt ?? current.PlannedStartAt,
        }).Normalised();
        if (changed == current)
        {
            return WriteOutcome.Repeated;
        }

        if (expectedRevision != Revision)
        {
            return WriteOutcome.Stale;
        }

        if (Publication != Publication.Published)
        {
            return new(WriteOutcome.Rejected, [new("dates", "draft")]);
        }

        if (IsStarted)
        {
            return new(WriteOutcome.Rejected, [new("dates", "competition-started")]);
        }

        if (changed.Check() is { Count: > 0 } broken)
        {
            return new(WriteOutcome.Rejected, broken);
        }

        Configuration = changed;
        DateChanges = [.. DateChanges, new(
            Revision, Revision + 1,
            current.RegistrationOpensAt, changed.RegistrationOpensAt,
            current.RegistrationClosesAt, changed.RegistrationClosesAt,
            current.PlannedStartAt, changed.PlannedStartAt,
            actor, at)];
        Touch(actor, at);
        Log(ChangeKind.DatesChanged, actor, actorName, at, DateValues(current, changed), changed.TimeZone);
        return WriteOutcome.Applied;
    }

    // Game or variant, participation structure and venue are material (F-02); capacity, title, admission and check-in are not
    // (change-log A-2). Visibility has its own entry.
    private void LogMaterialChanges(TournamentConfiguration before, Guid actor, string? actorName, DateTimeOffset at)
    {
        var after = Configuration;
        (string Field, object? Old, object? New)[] fields =
        [
            ("gameVariant", before.GameVariant, after.GameVariant),
            ("entryKind", before.EntryKind, after.EntryKind),
            ("minimumRosterSize", before.MinimumRosterSize, after.MinimumRosterSize),
            ("maximumRosterSize", before.MaximumRosterSize, after.MaximumRosterSize),
            ("activePlayersPerSide", before.ActivePlayersPerSide, after.ActivePlayersPerSide),
            ("location", before.Location, after.Location),
            ("venue", before.Venue, after.Venue),
        ];
        if (Values(fields) is { Count: > 0 } material)
        {
            Log(ChangeKind.MaterialChange, actor, actorName, at, material);
        }

        if (Values([("visibility", before.Visibility, after.Visibility)]) is { Count: > 0 } visibility)
        {
            Log(ChangeKind.VisibilityChanged, actor, actorName, at, visibility);
        }
    }

    private static List<ChangedValue> DateValues(TournamentConfiguration before, TournamentConfiguration after) =>
        Values([
            ("registrationOpensAt", Iso(before.RegistrationOpensAt), Iso(after.RegistrationOpensAt)),
            ("registrationClosesAt", Iso(before.RegistrationClosesAt), Iso(after.RegistrationClosesAt)),
            ("plannedStartAt", Iso(before.PlannedStartAt), Iso(after.PlannedStartAt)),
        ]);

    private static string? Iso(DateTime? value) => value?.ToString("yyyy-MM-ddTHH:mm:ss", System.Globalization.CultureInfo.InvariantCulture);

    private static List<ChangedValue> Values(IEnumerable<(string Field, object? Old, object? New)> fields) =>
        [.. fields.Where(field => !Equals(field.Old, field.New)).Select(field => new ChangedValue(field.Field, field.Old?.ToString(), field.New?.ToString()))];

    // The tournament is the subject of its own facts, at the revision the change took effect.
    private void Log(ChangeKind kind, Guid actor, string? actorName, DateTimeOffset at, IReadOnlyList<ChangedValue>? changes = null, string? timeZone = null, string? reason = null) =>
        _logged.Add(new(Id, kind, Id.Value, Revision, actor, actorName, at) { Changes = changes ?? [], TimeZone = timeZone, Reason = reason });

    private static WriteResult Cancelled => new(WriteOutcome.Rejected, [new("tournament", "cancelled")]);

    private List<BrokenRule> DatesChangedIn(TournamentConfiguration configuration)
    {
        var current = Configuration;
        (string Field, bool Changed)[] dates =
        [
            ("registrationOpensAt", configuration.RegistrationOpensAt != current.RegistrationOpensAt),
            ("registrationClosesAt", configuration.RegistrationClosesAt != current.RegistrationClosesAt),
            ("plannedStartAt", configuration.PlannedStartAt != current.PlannedStartAt),
        ];
        return [.. dates.Where(date => date.Changed).Select(date => new BrokenRule(date.Field, "change-dates"))];
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

    // Start fixes the field and its rules (§5.1 row 6): what decides entries and rosters cannot change once running.
    private List<BrokenRule> LockedByStart(TournamentConfiguration configuration)
    {
        if (!IsStarted)
        {
            return [];
        }

        var current = Configuration;
        (string Field, bool Changed)[] fixedFields =
        [
            ("capacity", configuration.Capacity != current.Capacity),
            ("entryKind", configuration.EntryKind != current.EntryKind),
            ("admission", configuration.Admission != current.Admission),
            ("checkIn", configuration.CheckIn != current.CheckIn),
            ("minimumRosterSize", configuration.MinimumRosterSize != current.MinimumRosterSize),
            ("maximumRosterSize", configuration.MaximumRosterSize != current.MaximumRosterSize),
            ("activePlayersPerSide", configuration.ActivePlayersPerSide != current.ActivePlayersPerSide),
        ];
        return [.. fixedFields.Where(field => field.Changed).Select(field => new BrokenRule(field.Field, "competition-started"))];
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
