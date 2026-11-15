namespace Herald.Contracts.Competition.V1;

public enum ResultsMatchState
{
    Scheduled,
    InPlay,
    Resolved,
}

/// <summary>Who won a resolved match, a draw, or none for an outcome with no winner (a double absence, a no contest).</summary>
public enum ResultOutcome
{
    First,
    Second,
    Draw,
    None,
}

/// <summary>An entrant's competitive status (h1-round-operations D-4); absent in older messages, which read as active.</summary>
public enum ResultsEntrantStatus
{
    Active,
    Withdrawn,
    Disqualified,
}

public sealed record ResultsEntrant(Guid EntryId, string Name, ResultsEntrantStatus Status = ResultsEntrantStatus.Active);

/// <summary>
/// A match of the running competition. Outcome, Cause and Played are set once it is resolved; Cause is Competition's
/// name for why (for example "played"), an open set so new causes need no new version.
/// </summary>
public sealed record ResultsMatch(Guid MatchId, int Round, Guid First, Guid Second, ResultsMatchState State, ResultOutcome? Outcome, string? Cause, bool? Played);

public sealed record ResultsRest(int Round, Guid EntryId);

/// <summary>
/// A running competition's results (h1-standings D-1), as a full snapshot: a consumer keeps the one with the highest
/// revision and ignores older ones (ADR 0016). Published when the competition starts and after every resolution.
/// </summary>
public sealed record TournamentResultsChanged(
    Guid OrganisationId,
    Guid TournamentId,
    int Revision,
    IReadOnlyList<ResultsEntrant> Entrants,
    IReadOnlyList<ResultsMatch> Matches,
    IReadOnlyList<ResultsRest> Rests);
