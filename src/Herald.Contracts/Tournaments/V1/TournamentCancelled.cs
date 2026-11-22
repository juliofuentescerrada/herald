namespace Herald.Contracts.Tournaments.V1;

/// <summary>
/// A notifiable fact (ADR 0017): the owner cancelled the tournament, for good, at tournament revision
/// <paramref name="Revision"/>, before or after its competition started. The reason is private and not carried.
/// Registration cancels the active entries; Competition withdraws the schedule or voids the unresolved matches
/// (h1-tournament-cancel-and-dates D-1). Consumers are idempotent: a second delivery finds it already applied.
/// </summary>
public sealed record TournamentCancelled(Guid OrganisationId, Guid TournamentId, int Revision, bool AfterStart, Guid CancelledBy, DateTimeOffset CancelledAt);
