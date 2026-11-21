namespace Herald.Contracts.Competition.V1;

/// <summary>
/// A notifiable fact (ADR 0017): schedule revision <paramref name="PublicationNumber"/> (1, 2, …) was published.
/// Consumers are idempotent on the tournament and the number (h1-change-log D-3).
/// </summary>
public sealed record SchedulePublished(Guid OrganisationId, Guid TournamentId, int PublicationNumber, Guid PublishedBy, string? PublishedByName, DateTimeOffset PublishedAt);
