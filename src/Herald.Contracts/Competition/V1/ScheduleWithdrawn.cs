namespace Herald.Contracts.Competition.V1;

/// <summary>
/// A notifiable fact (ADR 0017): published schedule revision <paramref name="PublicationNumber"/> was withdrawn, with the
/// cause <c>operator</c>. The reason is private and not carried: the publication history shows it to the owner.
/// Consumers are idempotent on the tournament and the number (h1-change-log D-3).
/// </summary>
public sealed record ScheduleWithdrawn(
    Guid OrganisationId, Guid TournamentId, int PublicationNumber, string Cause, Guid WithdrawnBy, string? WithdrawnByName, DateTimeOffset WithdrawnAt);
