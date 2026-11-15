using Herald.Competition.Domain;
using Herald.Competition.Persistence;
using Herald.ModuleHosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Wolverine;
using Wolverine.Http;

namespace Herald.Competition.Features.DisqualifyEntrant;

// OperationId lets a retried departure answer with the one already recorded (h1-round-operations D-2).
public sealed record DisqualifyEntrant(Guid OperationId, int ExpectedRevision, string? Reason);

public static class DisqualifyEntrantEndpoint
{
    // Disqualifies an entrant of the running competition and resolves its unplayed matches in the same write (D-2).
    [WolverinePost("/api/organisations/{organisationId}/tournaments/{tournamentId}/entrants/{entryId}/disqualification")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("disqualifyEntrant")]
    [ProducesResponseType<ScheduleDetails>(StatusCodes.Status200OK)]
    [ProducesResponseType<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json")]
    public static async Task<IResult> Post(
        Guid organisationId, Guid tournamentId, Guid entryId, DisqualifyEntrant command, OrganisationContext context, CompetitionDbContext db, IMessageBus bus, CancellationToken cancellationToken)
    {
        var actor = context.ActorId ?? throw new InvalidOperationException($"No acting person in organisation {organisationId}.");
        return await db.WriteAsync(bus, organisationId, tournamentId,
            (schedule, matches) => schedule.Depart(command.OperationId, entryId, EntrantStatus.Disqualified, command.Reason, command.ExpectedRevision, matches, actor, DateTimeOffset.UtcNow), cancellationToken);
    }
}
