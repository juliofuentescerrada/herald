using Herald.BuildingBlocks;
using Herald.Competition.Persistence;
using Herald.ModuleHosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Wolverine;
using Wolverine.Http;

namespace Herald.Competition.Features.LiftSanction;

public sealed record LiftSanction(int ExpectedRevision);

public static class LiftSanctionEndpoint
{
    // Lifts a player's active sanction; the sanction stays in their history (h1-round-operations D-3).
    [WolverinePost("/api/organisations/{organisationId}/tournaments/{tournamentId}/entrants/{entryId}/players/{playerId}/sanction/lift")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("liftSanction")]
    [OperationGroup(OperationGroup.Results)]
    [ProducesResponseType<ScheduleDetails>(StatusCodes.Status200OK)]
    [ProducesResponseType<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json")]
    [ProblemTypes(StatusCodes.Status409Conflict, ScheduleResults.RevisionConflict)]
    public static async Task<IResult> Post(
        Guid organisationId, Guid tournamentId, Guid entryId, Guid playerId, LiftSanction command, OrganisationContext context, CompetitionDbContext db, IMessageBus bus, CancellationToken cancellationToken)
    {
        var actor = context.ActorId ?? throw new InvalidOperationException($"No acting person in organisation {organisationId}.");
        return await db.WriteAsync(bus, organisationId, tournamentId,
            schedule => schedule.LiftSanction(entryId, playerId, command.ExpectedRevision, actor, DateTimeOffset.UtcNow), cancellationToken);
    }
}
