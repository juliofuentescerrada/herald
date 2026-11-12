namespace Herald.Contracts.Registration.V1;

/// <summary>
/// The entry counts of a tournament's field, as a full snapshot: a consumer keeps the one with the
/// highest revision and ignores older ones (ADR 0016). Active entries are the waiting and the admitted.
/// Checked in counts the admitted entries whose check-in is confirmed; it was added later as an optional
/// member, so older messages read as none.
/// </summary>
public sealed record TournamentFieldChanged(
    Guid OrganisationId,
    Guid TournamentId,
    int Revision,
    int Admitted,
    int Waiting,
    int CheckedIn = 0)
{
    public int Active => Admitted + Waiting;
}
