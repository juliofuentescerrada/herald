namespace Herald.Tournaments.Domain;

// What a change log entry records (design D-1); stored by name, so new kinds add no migration.
public enum ChangeKind
{
    EntryAdmitted,
    EntryCancelled,
    SchedulePublished,
    ScheduleWithdrawn,
    TournamentPublished,
    MaterialChange,
    DatesChanged,
    VisibilityChanged,
    TournamentCancelled,
    CompetitionFinalised,
    CompetitionReopened,
}

// One value before and after, as text: dates as local ISO date-times of the reference time zone, enums by name.
public sealed record ChangedValue(string Field, string? Old, string? New);

// One change that matters to competitors, from publication onwards (F-10, D-26). The kind, subject and subject revision
// identify it, so a fact that arrives twice is recorded once (design D-1).
public sealed record ChangeLogEntry(TournamentId TournamentId, ChangeKind Kind, Guid Subject, int SubjectRevision, Guid? ActorId, string? ActorName, DateTimeOffset At)
{
    public IReadOnlyList<ChangedValue> Changes { get; init; } = [];

    // The reference time zone the dates of a dates change are local to.
    public string? TimeZone { get; init; }

    // The entry's alias, for an entry admitted or cancelled.
    public string? Alias { get; init; }

    // The reason code of another module's fact, such as "tournament-cancelled"; never its text (Q1).
    public string? Cause { get; init; }

    // The owner's reason given in Tournaments: private to the organisation.
    public string? Reason { get; init; }

    // Set by kind: what visitors of a public or unlisted tournament may read (design D-1).
    public bool Public { get; init; } = IsPublic(Kind);

    public static bool IsPublic(ChangeKind kind) => kind is ChangeKind.TournamentPublished or ChangeKind.MaterialChange or ChangeKind.DatesChanged
        or ChangeKind.VisibilityChanged or ChangeKind.TournamentCancelled or ChangeKind.CompetitionFinalised;
}
