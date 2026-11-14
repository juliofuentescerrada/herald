namespace Herald.Contracts.Tournaments.V1;

public enum RegistrationState
{
    NotOpen,
    Open,
    Closed,
}

public enum EntryKind
{
    Individual,
    Team,
}

public enum Admission
{
    Automatic,
    Manual,
}

public enum CheckInPolicy
{
    Optional,
    Mandatory,
}

/// <summary>
/// The facts of a published tournament that decide its entries, as a full snapshot: a consumer keeps
/// the one with the highest revision and ignores older ones (ADR 0016). The roster sizes are present
/// for a team tournament only; they were added later as optional members, so older messages lack them.
/// The check-in policy and the field lock were added later too: older messages read as optional and unlocked.
/// The field is locked while the tournament's schedule is published.
/// </summary>
public sealed record TournamentEntryTermsChanged(
    Guid OrganisationId,
    Guid TournamentId,
    int Revision,
    RegistrationState Registration,
    int Capacity,
    EntryKind EntryKind,
    Admission Admission,
    int? MinimumRosterSize = null,
    int? MaximumRosterSize = null,
    CheckInPolicy CheckIn = CheckInPolicy.Optional,
    bool FieldLocked = false);
