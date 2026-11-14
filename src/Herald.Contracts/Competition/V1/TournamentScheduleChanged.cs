namespace Herald.Contracts.Competition.V1;

/// <summary>
/// The state of a tournament's schedule, as a full snapshot: a consumer keeps the one with the highest
/// revision and ignores older ones (ADR 0016). While a revision is published, PublishedRevision names it and
/// EligibleRevision is the eligible field it was drafted from; both are null otherwise.
/// </summary>
public sealed record TournamentScheduleChanged(
    Guid OrganisationId,
    Guid TournamentId,
    int Revision,
    int? PublishedRevision,
    int? EligibleRevision);
