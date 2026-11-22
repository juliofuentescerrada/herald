using Herald.Contracts.Competition.V1;
using Herald.Tournaments.Domain;

namespace Herald.Tournaments.Persistence;

// Competition's last report of a tournament's schedule (h1-round-robin-pairings D-4), keyed by the tournament.
// Not organisation-owned: it is only read beside a tournament the organisation filter already allowed.
public sealed class ScheduleState
{
    public required TournamentId TournamentId { get; init; }

    // Competition's schedule revision; an older report changes nothing.
    public int Revision { get; set; }

    // Set while a revision is published, with the eligible field it was drafted from.
    public int? PublishedRevision { get; set; }

    public int? EligibleRevision { get; set; }

    // The published pairings with aliases, for the public page (h1-public-read D-1); null while none is published.
    public PublishedSchedule? Published { get; set; }
}
