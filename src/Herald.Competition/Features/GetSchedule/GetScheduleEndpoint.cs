using Herald.Competition.Domain;
using Herald.Competition.Persistence;
using Herald.ModuleHosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Wolverine.Http;

namespace Herald.Competition.Features.GetSchedule;

public static class GetScheduleEndpoint
{
    // A tournament has a schedule once Registration has reported its eligible field, from its publication on.
    [WolverineGet("/api/organisations/{organisationId}/tournaments/{tournamentId}/schedule")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("getSchedule")]
    [ProducesResponseType<ScheduleDetails>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    public static async Task<IResult> Get(Guid organisationId, Guid tournamentId, CompetitionDbContext db, CancellationToken cancellationToken)
    {
        var id = new TournamentId(tournamentId);
        return await db.Schedules.AsNoTracking().SingleOrDefaultAsync(schedule => schedule.Id == id, cancellationToken) is { } schedule
            ? Results.Ok(ScheduleDetails.Of(schedule))
            : ScheduleResults.NotFound();
    }
}
