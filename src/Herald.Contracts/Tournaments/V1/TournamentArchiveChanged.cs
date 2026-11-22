namespace Herald.Contracts.Tournaments.V1;

/// <summary>
/// A finalised or cancelled tournament was archived or unarchived, as a snapshot of the tournament's revision: a consumer
/// keeps the one with the highest revision (ADR 0016). Competition refuses to reopen an archived competition (design D-3).
/// </summary>
public sealed record TournamentArchiveChanged(Guid OrganisationId, Guid TournamentId, int Revision, bool Archived, Guid ChangedBy, DateTimeOffset ChangedAt);
