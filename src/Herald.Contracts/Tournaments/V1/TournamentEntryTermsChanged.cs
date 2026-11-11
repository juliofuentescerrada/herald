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
/// the one with the highest revision and ignores older ones (ADR 0016).
/// </summary>
public sealed record TournamentEntryTermsChanged(
    Guid OrganisationId,
    Guid TournamentId,
    int Revision,
    RegistrationState Registration,
    int Capacity,
    EntryKind EntryKind,
    Admission Admission);
