using Herald.BuildingBlocks;
using Herald.Competition.Persistence;
using Herald.ModuleHosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Wolverine;
using Wolverine.Http;

namespace Herald.Competition.Features.FinaliseCompetition;

// ReviewedRevision is the results revision of the standings the owner reviewed; ExpectedRevision is the schedule's.
public sealed record FinaliseCompetition(int ReviewedRevision, int ExpectedRevision);

public static class FinaliseCompetitionEndpoint
{
    // Finalises the running competition behind the review barrier; a stale review is rejected with the current results revision
    // in the schedule it returns (h1-finalisation D-1).
    [WolverinePost("/api/organisations/{organisationId}/tournaments/{tournamentId}/finalisation")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("finaliseCompetition")]
    [OperationGroup(OperationGroup.Finalisation)]
    [ProducesResponseType<ScheduleDetails>(StatusCodes.Status200OK)]
    [ProducesResponseType<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json")]
    public static async Task<IResult> Post(
        Guid organisationId, Guid tournamentId, FinaliseCompetition command, OrganisationContext context, CompetitionDbContext db, IMessageBus bus, CancellationToken cancellationToken)
    {
        var actor = context.ActorId ?? throw new InvalidOperationException($"No acting person in organisation {organisationId}.");
        return await db.WriteAsync(bus, organisationId, tournamentId,
            (schedule, matches) => schedule.Finalise(command.ReviewedRevision, command.ExpectedRevision, matches, actor, DateTimeOffset.UtcNow, context.ActorName),
            cancellationToken);
    }
}
