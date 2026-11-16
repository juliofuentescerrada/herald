namespace Herald.Contracts.Competition.V1;

/// <summary>
/// A notifiable fact (ADR 0017): the competition was finalised at a results revision, as final revision
/// <paramref name="FinalRevision"/> (1, 2, …). Consumers are idempotent on the final revision (h1-finalisation D-4).
/// </summary>
public sealed record CompetitionFinalised(Guid OrganisationId, Guid TournamentId, int ResultsRevision, int FinalRevision, Guid FinalisedBy, DateTimeOffset FinalisedAt);
