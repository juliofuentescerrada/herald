namespace Herald.Contracts.Registration.V1;

/// <summary>An eligible entrant: admitted and, under a mandatory check-in policy, checked in.</summary>
public sealed record EligibleEntrant(Guid EntryId, string Name, int AdmissionOrder);

/// <summary>An admitted entry still to check in under a mandatory policy.</summary>
public sealed record PendingEntrant(Guid EntryId, string Name);

/// <summary>
/// The eligible entrants of a tournament's field, as a full snapshot: a consumer keeps the one with the
/// highest revision and ignores older ones (ADR 0016). The revision changes only when the eligible set,
/// the registration state or the pending entries do. Pending lists the admitted entries still to check in
/// under a mandatory policy.
/// </summary>
public sealed record TournamentEligibleFieldChanged(
    Guid OrganisationId,
    Guid TournamentId,
    int Revision,
    bool RegistrationClosed,
    IReadOnlyList<PendingEntrant> Pending,
    IReadOnlyList<EligibleEntrant> Entrants);
