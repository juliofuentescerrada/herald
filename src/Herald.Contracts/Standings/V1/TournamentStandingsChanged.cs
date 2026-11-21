namespace Herald.Contracts.Standings.V1;

/// <summary>An entrant's competitive status; a withdrawn or disqualified entrant keeps its points and position, flagged.</summary>
public enum StandingsEntrantStatus
{
    Active,
    Withdrawn,
    Disqualified,
}

/// <summary>A resolved match's result for the entrant; NoWinner gives no points and is neither a win, a draw nor a loss.</summary>
public enum StandingsLineResult
{
    Won,
    Drawn,
    Lost,
    NoWinner,
}

/// <summary>A line of an entrant's explanation: a resolved match with the opponent's alias, result, cause and points, or a rest
/// (Opponent, Result and Cause null).</summary>
public sealed record StandingsLine(int Round, string? Opponent, StandingsLineResult? Result, string? Cause, int Points);

/// <summary>A row of the table: entrants with equal points share their position.</summary>
public sealed record StandingsTableRow(
    int Position, bool Shared, Guid EntryId, string Name, StandingsEntrantStatus Status, int Resolved, int Won, int Drawn, int Lost, int Points,
    IReadOnlyList<StandingsLine> Lines);

/// <summary>A final revision taken at <paramref name="ResultsRevision"/>; a reopening keeps it, marked.</summary>
public sealed record StandingsFinalRevision(int Number, int ResultsRevision, DateTimeOffset FinalisedAt, bool Reopened);

/// <summary>
/// A tournament's standings table (h1-public-read), as a full snapshot published after every change of the results applied or of
/// their final status: a consumer keeps the one with the highest <paramref name="Revision"/> and ignores older ones (ADR 0016).
/// <paramref name="ResultsRevision"/> is the results revision the table reflects, <paramref name="ChangedAt"/> when it changed.
/// <paramref name="Final"/> is set while the table is final; <paramref name="Finals"/> lists every final revision, newest first.
/// </summary>
public sealed record TournamentStandingsChanged(
    Guid OrganisationId,
    Guid TournamentId,
    int Revision,
    int ResultsRevision,
    DateTimeOffset ChangedAt,
    int ResolvedMatches,
    int Matches,
    IReadOnlyList<StandingsTableRow> Rows,
    StandingsFinalRevision? Final,
    IReadOnlyList<StandingsFinalRevision> Finals,
    bool NoChampion);
