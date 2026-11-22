using Herald.BuildingBlocks;
using Herald.Competition.Persistence;
using Herald.ModuleHosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Wolverine;
using Wolverine.Http;

namespace Herald.Competition.Features.ReopenCompetition;

// The reason is required and private to the organisation (h1-finalisation D-3, A-2).
public sealed record ReopenCompetition(string? Reason, int ExpectedRevision);

public static class ReopenCompetitionEndpoint
{
    // Returns a finalised competition to running, keeping its final revision (D-3).
    [WolverinePost("/api/organisations/{organisationId}/tournaments/{tournamentId}/reopening")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("reopenCompetition")]
    [OperationGroup(OperationGroup.Finalisation)]
    [ProducesResponseType<ScheduleDetails>(StatusCodes.Status200OK)]
    [ProducesResponseType<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json")]
    [ProblemTypes(StatusCodes.Status409Conflict, ScheduleResults.RevisionConflict)]
    public static async Task<IResult> Post(
        Guid organisationId, Guid tournamentId, ReopenCompetition command, OrganisationContext context, CompetitionDbContext db, IMessageBus bus, CancellationToken cancellationToken)
    {
        var actor = context.ActorId ?? throw new InvalidOperationException($"No acting person in organisation {organisationId}.");
        return await db.WriteAsync(bus, organisationId, tournamentId,
            (schedule, _) => schedule.Reopen(command.Reason, command.ExpectedRevision, actor, DateTimeOffset.UtcNow, context.ActorName), cancellationToken);
    }
}
