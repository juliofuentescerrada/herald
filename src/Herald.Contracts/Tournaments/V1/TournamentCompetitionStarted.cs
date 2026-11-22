namespace Herald.Contracts.Tournaments.V1;

/// <summary>
/// A tournament's competition started (h1-competition-start D-3), as a snapshot of the tournament's revision: a
/// consumer keeps the one with the highest revision and ignores older ones (ADR 0016). It names the eligible field
/// revision and the schedule revision the start was decided on, and who started it and when. ActivePlayersPerSide is the
/// profile's lineup size for a team tournament (h1-match-lineups D-4); it is null for an individual one and in older messages.
/// </summary>
public sealed record TournamentCompetitionStarted(
    Guid OrganisationId,
    Guid TournamentId,
    int Revision,
    int EligibleRevision,
    int ScheduleRevision,
    Guid StartedBy,
    DateTimeOffset StartedAt,
    int? ActivePlayersPerSide = null);
