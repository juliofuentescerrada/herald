namespace Herald.Tournaments.Domain;

public enum CompetitionState
{
    Preparing,
    Running,
}

// An admitted team's roster outside the profile's bounds, as Registration last reported it.
public sealed record RosterOutsideBounds(Guid EntryId, string TeamName, int Members);

// A member name held by different guests on two or more admitted teams: a warning, never a blocker.
public sealed record SharedMemberName(string Name, IReadOnlyList<string> TeamNames);

// What Tournaments' projections say about the start conditions (design D-2). Null is unknown: Registration or
// Competition has not reported it yet, or reported it before it existed, and it blocks start.
public sealed record StartReadiness(
    int? EligibleRevision = null,
    int? Eligible = null,
    int? Pending = null,
    IReadOnlyList<RosterOutsideBounds>? RostersOutsideBounds = null,
    IReadOnlyList<SharedMemberName>? SharedMemberNames = null,
    int? PublishedScheduleRevision = null,
    int? ScheduleEligibleRevision = null)
{
    public static readonly StartReadiness Unknown = new();

    // A published schedule drafted from the field as it is now.
    public bool ScheduleCurrent => PublishedScheduleRevision is not null && EligibleRevision is not null && ScheduleEligibleRevision == EligibleRevision;
}

// One start condition, named by its rule, with whether it holds (CP-04).
public readonly record struct StartCondition(string Rule, bool Met);

public static class StartRules
{
    public const string RegistrationClosed = "registration-closed";
    public const string NoPendingCheckIn = "no-pending-check-in";
    public const string TwoEligible = "two-eligible";
    public const string ScheduleCurrent = "schedule-current";
    public const string RostersWithinBounds = "rosters-within-bounds";
}
