namespace Herald.Contracts.Registration.V1;

/// <summary>
/// A notifiable fact (ADR 0017): an entry was admitted, at entry revision <paramref name="EntryRevision"/>. The cause is
/// <c>automatic</c> (on entering), <c>operator</c> (by the owner) or <c>promotion</c> (a freed slot). The alias is the name
/// the entrant plays under, which the public page shows anyway; the owner's admission reason is private and not carried.
/// Consumers are idempotent on the entry and its revision (h1-change-log D-3).
/// </summary>
public sealed record EntryAdmitted(
    Guid OrganisationId, Guid TournamentId, Guid EntryId, int EntryRevision, string Alias, string Cause, Guid? AdmittedBy, string? AdmittedByName, DateTimeOffset AdmittedAt);
