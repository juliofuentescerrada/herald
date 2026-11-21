using Herald.Contracts.Competition.V1;
using Herald.Contracts.Standings.V1;
using Herald.Tournaments.Domain;

namespace Herald.Tournaments.Persistence;

// Competition's latest results of a tournament, for the public page (h1-public-read D-1). Not organisation-owned, like
// ScheduleState: only read beside a tournament already allowed. The snapshot carries aliases and cause codes, nothing private (D-2).
public sealed class ResultsState
{
    public required TournamentId TournamentId { get; init; }

    public int Revision { get; set; }

    public required TournamentResultsChanged Results { get; set; }
}

// Standings' latest table of a tournament, for the public page (D-1).
public sealed class StandingsState
{
    public required TournamentId TournamentId { get; init; }

    public int Revision { get; set; }

    public required TournamentStandingsChanged Standings { get; set; }
}
