using Herald.ModuleHosting;
using Herald.Standings.Domain;
using Herald.Standings.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Wolverine.Http;

namespace Herald.Standings.Features.GetStandings;

public sealed record StandingsEntrant(Guid EntryId, string Name);

// A line of an entrant's explanation: a resolved match (opponent and cause) or a rest (both null).
public sealed record StandingsLine(int Round, StandingsEntrant? Opponent, string? Cause, int Points);

public sealed record StandingsRow(int Position, bool Shared, StandingsEntrant Entrant, int Resolved, int Won, int Drawn, int Lost, int Points, IReadOnlyList<StandingsLine> Lines);

// The provisional table and the results revision it reflects (h1-standings D-3).
public sealed record StandingsView(Guid TournamentId, int Revision, int ResolvedMatches, int Matches, IReadOnlyList<StandingsRow> Rows);

public static class GetStandingsEndpoint
{
    // A tournament has standings once Standings has received its first results, from the competition's start on.
    [WolverineGet("/api/organisations/{organisationId}/tournaments/{tournamentId}/standings")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("getStandings")]
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
                [.. row.Lines.Select(line => new StandingsLine(line.Round, line.Opponent is { } opponent ? EntrantOf(opponent) : null, line.Cause, line.Points))]))]));
    }

    private static StandingsEntrant EntrantOf(Entrant entrant) => new(entrant.EntryId, entrant.Name);
}
