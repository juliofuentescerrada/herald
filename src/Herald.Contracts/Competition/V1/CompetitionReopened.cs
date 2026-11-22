namespace Herald.Contracts.Competition.V1;

/// <summary>
/// A notifiable fact (ADR 0017): final revision <paramref name="FinalRevision"/>, at <paramref name="ResultsRevision"/>, was
/// reopened and the competition runs again. The reason is the organisation's own and is not carried (h1-finalisation D-3).
/// </summary>
public sealed record CompetitionReopened(Guid OrganisationId, Guid TournamentId, int ResultsRevision, int FinalRevision, Guid ReopenedBy, DateTimeOffset ReopenedAt);
