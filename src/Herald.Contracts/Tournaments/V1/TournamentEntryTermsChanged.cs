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

/// <summary>
/// The facts of a published tournament that decide its entries, as a full snapshot: a consumer keeps
/// the one with the highest revision and ignores older ones (ADR 0016). The roster sizes are present
/// for a team tournament only; they were added later as optional members, so older messages lack them.
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
    int? MaximumRosterSize = null);
