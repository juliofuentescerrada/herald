namespace Herald.Contracts.Registration.V1;

/// <summary>
/// The entry counts of a tournament's field, as a full snapshot: a consumer keeps the one with the
/// highest revision and ignores older ones (ADR 0016). Active entries are the waiting and the admitted.
/// Checked in counts the admitted entries whose check-in is confirmed; it was added later as an optional
/// member, so older messages read as none.
/// The start readiness members were added later too, as optional members: older messages read as unknown (null).
/// Eligible and pending follow the mandatory check-in policy; the rosters are the admitted teams' rosters outside
/// the profile's bounds (frozen ones once the competition started), and the shared names are member names, ignoring
/// case, accents and spaces, held by different guests on two or more admitted teams.
/// </summary>
public sealed record TournamentFieldChanged(
    Guid OrganisationId,
    Guid TournamentId,
    int Revision,
    int Admitted,
    int Waiting,
    int CheckedIn = 0,
    int? EligibleRevision = null,
    int? Eligible = null,
    int? Pending = null,
    IReadOnlyList<RosterOutsideBounds>? RostersOutsideBounds = null,
    IReadOnlyList<SharedMemberName>? SharedMemberNames = null)
{
    public int Active => Admitted + Waiting;
}

public sealed record RosterOutsideBounds(Guid EntryId, string TeamName, int Members);

public sealed record SharedMemberName(string Name, IReadOnlyList<string> TeamNames);
