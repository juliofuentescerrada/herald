using Herald.Contracts.Standings.V1;
using Herald.Standings.Domain;

namespace Herald.Standings.Features;

// The table Standings publishes after each change, with each entrant's explanation, for the public page (h1-public-read D-4).
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
                row.Position, row.Shared, row.Entrant.EntryId, row.Entrant.Name, (StandingsEntrantStatus)row.Entrant.Status, row.Resolved, row.Won, row.Drawn, row.Lost, row.Points,
                [.. row.Lines.Select(line => new StandingsLine(line.Round, line.Opponent?.Name, ResultOf(line.Outcome), line.Cause, line.Points))]))],
            results.Final is { } final ? FinalOf(final) : null,
            [.. results.Finals.Reverse().Select(FinalOf)],
            results.NoChampion);
    }

    private static StandingsLineResult? ResultOf(Outcome? outcome) => outcome switch
    {
        Outcome.First => StandingsLineResult.Won,
        Outcome.Second => StandingsLineResult.Lost,
        Outcome.Draw => StandingsLineResult.Drawn,
        Outcome.None => StandingsLineResult.NoWinner,
        _ => null,
    };

    private static StandingsFinalRevision FinalOf(FinalRevision final) => new(final.Number, final.ResultsRevision, final.FinalisedAt, final.Reopened);
}
