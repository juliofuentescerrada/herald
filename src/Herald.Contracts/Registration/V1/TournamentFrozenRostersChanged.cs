namespace Herald.Contracts.Registration.V1;

/// <summary>A member of a frozen roster: an organisation guest player and their alias.</summary>
public sealed record FrozenRosterMember(Guid GuestPlayerId, string Name);

/// <summary>An admitted team entry's roster as frozen at the competition's start.</summary>
public sealed record FrozenRoster(Guid EntryId, int Revision, IReadOnlyList<FrozenRosterMember> Members);

/// <summary>
/// The frozen rosters of a team tournament's admitted entries (h1-match-lineups D-4), as a full snapshot: a consumer
/// keeps the one with the highest revision and ignores older ones (ADR 0016).
/// </summary>
public sealed record TournamentFrozenRostersChanged(
    Guid OrganisationId,
    Guid TournamentId,
    int Revision,
    IReadOnlyList<FrozenRoster> Rosters);
