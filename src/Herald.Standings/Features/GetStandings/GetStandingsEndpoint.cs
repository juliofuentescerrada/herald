using Herald.BuildingBlocks;
using Herald.ModuleHosting;
using Herald.Standings.Domain;
using Herald.Standings.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Wolverine.Http;

namespace Herald.Standings.Features.GetStandings;

// Status flags a withdrawn or disqualified entrant (h1-round-operations).
public sealed record StandingsEntrant(Guid EntryId, string Name, EntrantStatus Status);

// A resolved match's result for the entrant; NoWinner gives no points and is neither a win, a draw nor a loss.
public enum LineResult
{
    Won,
    Drawn,
    Lost,
    NoWinner,
}

// A line of an entrant's explanation: a resolved match (opponent, result and cause) or a rest (all three null).
public sealed record StandingsLine(int Round, StandingsEntrant? Opponent, LineResult? Result, string? Cause, int Points);

public sealed record StandingsRow(int Position, bool Shared, StandingsEntrant Entrant, int Resolved, int Won, int Drawn, int Lost, int Points, IReadOnlyList<StandingsLine> Lines);

public sealed record FinalRevisionView(int Number, int ResultsRevision, DateTimeOffset FinalisedAt, bool Reopened);

// The table and the results revision it reflects (h1-standings D-3). Final is set while the table is final at that revision;
// Finals lists every final revision, newest first, and NoChampion says that every entrant departed (h1-finalisation D-4, D-5).
public sealed record StandingsView(
    Guid TournamentId, int Revision, int ResolvedMatches, int Matches, IReadOnlyList<StandingsRow> Rows, FinalRevisionView? Final, IReadOnlyList<FinalRevisionView> Finals, bool NoChampion);

public static class GetStandingsEndpoint
{
    // A tournament has standings once Standings has received its first results, from the competition's start on.
    [WolverineGet("/api/organisations/{organisationId}/tournaments/{tournamentId}/standings")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("getStandings")]
    [OperationGroup(OperationGroup.Read)]
    [ProducesResponseType<StandingsView>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    public static async Task<IResult> Get(Guid organisationId, Guid tournamentId, StandingsDbContext db, CancellationToken cancellationToken)
    {
        var id = new TournamentId(tournamentId);
        if (await db.Results.AsNoTracking().SingleOrDefaultAsync(results => results.Id == id, cancellationToken) is not { } results)
        {
            // The same answer before start and for another organisation's tournament.
            return Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "Not found");
        }

        var table = results.Table();
        return Results.Ok(new StandingsView(
            tournamentId,
            table.Revision,
            table.ResolvedMatches,
            table.Matches,
            [.. table.Rows.Select(row => new StandingsRow(
                row.Position,
                row.Shared,
                EntrantOf(row.Entrant),
                row.Resolved,
                row.Won,
                row.Drawn,
                row.Lost,
                row.Points,
                [.. row.Lines.Select(line => new StandingsLine(line.Round, line.Opponent is { } opponent ? EntrantOf(opponent) : null, ResultOf(line.Outcome), line.Cause, line.Points))]))],
            results.Final is { } final ? FinalOf(final) : null,
            [.. results.Finals.Reverse().Select(FinalOf)],
            results.NoChampion));
    }

    private static LineResult? ResultOf(Outcome? outcome) => outcome switch
    {
        Outcome.First => LineResult.Won,
        Outcome.Second => LineResult.Lost,
        Outcome.Draw => LineResult.Drawn,
        Outcome.None => LineResult.NoWinner,
        _ => null,
    };

    private static FinalRevisionView FinalOf(FinalRevision final) => new(final.Number, final.ResultsRevision, final.FinalisedAt, final.Reopened);

    private static StandingsEntrant EntrantOf(Entrant entrant) => new(entrant.EntryId, entrant.Name, entrant.Status);
}
