using Herald.Contracts.Standings.V1;
using Herald.Standings.Domain;

namespace Herald.Standings.Features;

// The table Standings publishes after each change, for the public page (h1-public-read); explanations stay with the results.
public static class StandingsSnapshot
{
    public static TournamentStandingsChanged Of(Guid organisationId, TournamentResults results, DateTimeOffset at)
    {
        var table = results.Table();
        return new(
            organisationId,
            results.Id.Value,
            results.TableRevision,
            table.Revision,
            at,
            table.ResolvedMatches,
            table.Matches,
            [.. table.Rows.Select(row => new StandingsTableRow(
                row.Position, row.Shared, row.Entrant.EntryId, row.Entrant.Name, (StandingsEntrantStatus)row.Entrant.Status, row.Resolved, row.Won, row.Drawn, row.Lost, row.Points))],
            results.Final is { } final ? FinalOf(final) : null,
            [.. results.Finals.Reverse().Select(FinalOf)],
            results.NoChampion);
    }

    private static StandingsFinalRevision FinalOf(FinalRevision final) => new(final.Number, final.ResultsRevision, final.FinalisedAt, final.Reopened);
}
