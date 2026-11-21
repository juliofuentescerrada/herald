namespace Herald.Contracts.Registration.V1;

/// <summary>
/// A notifiable fact (ADR 0017): an entry was cancelled, at entry revision <paramref name="EntryRevision"/>. The cause is
/// <c>operator</c>, <c>absent-at-start</c> or <c>tournament-cancelled</c>. Consumers are idempotent on the entry and its
/// revision (h1-change-log D-3).
/// </summary>
public sealed record EntryCancelled(
    Guid OrganisationId, Guid TournamentId, Guid EntryId, int EntryRevision, string Alias, string Cause, Guid? CancelledBy, string? CancelledByName, DateTimeOffset CancelledAt);
