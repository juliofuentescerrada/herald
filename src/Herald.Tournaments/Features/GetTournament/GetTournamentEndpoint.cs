using Herald.ModuleHosting;
using Herald.Tournaments.Domain;
using Herald.Tournaments.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Wolverine.Http;

namespace Herald.Tournaments.Features.GetTournament;

public static class GetTournamentEndpoint
{
    [WolverineGet("/api/organisations/{organisationId}/tournaments/{tournamentId}")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("getTournament")]
    [ProducesResponseType<TournamentDetails>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    public static async Task<IResult> Get(Guid organisationId, Guid tournamentId, TournamentsDbContext db, CancellationToken cancellationToken)
    {
        // The organisation filter hides another organisation's tournament: it is as absent as a missing one.
        var id = new TournamentId(tournamentId);
        return await db.Tournaments.AsNoTracking().SingleOrDefaultAsync(tournament => tournament.Id == id, cancellationToken) is { } tournament
            ? Results.Ok(TournamentDetails.Of(tournament))
            : TournamentResults.NotFound();
    }
}
