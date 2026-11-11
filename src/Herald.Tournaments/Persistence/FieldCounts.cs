using Herald.Tournaments.Domain;

namespace Herald.Tournaments.Persistence;

// Registration's last report of a tournament's entries (design D-3), keyed by the tournament.
// Not organisation-owned: it is only read beside a tournament the organisation filter already allowed.
public sealed class FieldCounts
{
    public required TournamentId TournamentId { get; init; }

    // Registration's field revision; an older report changes nothing.
    public int Revision { get; set; }

    public int Admitted { get; set; }

    public int Waiting { get; set; }

    public EntryCounts Counts => new(Admitted, Waiting);
}
