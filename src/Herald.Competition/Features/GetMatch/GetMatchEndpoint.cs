using Herald.BuildingBlocks;
using Herald.Competition.Domain;
using Herald.Competition.Persistence;
using Herald.ModuleHosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Wolverine.Http;

namespace Herald.Competition.Features.GetMatch;

public static class GetMatchEndpoint
{
    // A match exists once the competition started (h1-match-lineups D-1).
    [WolverineGet("/api/organisations/{organisationId}/tournaments/{tournamentId}/matches/{matchId}")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("getMatch")]
    [OperationGroup(OperationGroup.Read)]
    [ProducesResponseType<MatchView>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    public static async Task<IResult> Get(Guid organisationId, Guid tournamentId, Guid matchId, CompetitionDbContext db, CancellationToken cancellationToken)
    {
        var tournament = new TournamentId(tournamentId);
        var id = new MatchId(matchId);
        return await db.Matches.AsNoTracking().SingleOrDefaultAsync(match => match.Id == id && match.TournamentId == tournament, cancellationToken) is { } match
            && await db.Schedules.AsNoTracking().SingleOrDefaultAsync(schedule => schedule.Id == tournament, cancellationToken) is { } schedule
            ? Results.Ok(MatchView.Of(match, schedule))
            : ScheduleResults.NotFound();
    }
}
