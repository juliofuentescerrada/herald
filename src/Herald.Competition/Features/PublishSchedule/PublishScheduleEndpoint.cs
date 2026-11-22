using Herald.BuildingBlocks;
using Herald.Competition.Persistence;
using Herald.ModuleHosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Wolverine;
using Wolverine.Http;

namespace Herald.Competition.Features.PublishSchedule;

public sealed record PublishSchedule(int ExpectedRevision);

public static class PublishScheduleEndpoint
{
    // Publishes the current draft as the next revision; repeating returns that revision (F-06).
    [WolverinePost("/api/organisations/{organisationId}/tournaments/{tournamentId}/schedule/publication")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("publishSchedule")]
    [OperationGroup(OperationGroup.Schedule)]
    [ProducesResponseType<ScheduleDetails>(StatusCodes.Status200OK)]
    [ProducesResponseType<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json")]
    public static async Task<IResult> Post(
        Guid organisationId, Guid tournamentId, PublishSchedule command, OrganisationContext context, CompetitionDbContext db, IMessageBus bus, CancellationToken cancellationToken)
    {
        var actor = context.ActorId ?? throw new InvalidOperationException($"No acting person in organisation {organisationId}.");
        return await db.WriteAsync(bus, organisationId, tournamentId,
            schedule => schedule.Publish(command.ExpectedRevision, actor, DateTimeOffset.UtcNow), cancellationToken);
    }
}
