namespace Herald.Contracts.Registration.V1;

/// <summary>
/// The entry counts of a tournament's field, as a full snapshot: a consumer keeps the one with the
/// highest revision and ignores older ones (ADR 0016). Active entries are the waiting and the admitted.
/// </summary>
public sealed record TournamentFieldChanged(
    Guid OrganisationId,
    Guid TournamentId,
    int Revision,
    int Admitted,
    int Waiting)
{
    public int Active => Admitted + Waiting;
}
