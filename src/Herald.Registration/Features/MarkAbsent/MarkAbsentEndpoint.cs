using Herald.BuildingBlocks;
using Herald.ModuleHosting;
using Herald.Registration.Domain;
using Herald.Registration.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Wolverine;
using Wolverine.Http;

namespace Herald.Registration.Features.MarkAbsent;

// The entry's revision on the owner's screen.
public sealed record MarkAbsent(int ExpectedRevision);

public static class MarkAbsentEndpoint
{
    // The absence review: cancels a pending entry as absent at start; final, and promotes nothing after closure (F-05).
    [WolverinePost("/api/organisations/{organisationId}/tournaments/{tournamentId}/entries/{entryId}/absence")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("markAbsent")]
    [OperationGroup(OperationGroup.Entries)]
    [ProducesResponseType<FieldDetails>(StatusCodes.Status200OK)]
    [ProducesResponseType<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json")]
    public static async Task<IResult> Post(
        Guid organisationId,
        Guid tournamentId,
        Guid entryId,
        MarkAbsent command,
        OrganisationContext context,
        RegistrationDbContext db,
        IMessageBus bus,
        CancellationToken cancellationToken)
    {
        var actor = context.ActorId ?? throw new InvalidOperationException($"No acting person in organisation {organisationId}.");
        var id = new EntryId(entryId);
        return await db.WriteAsync(bus, organisationId, tournamentId, id,
            field => field.MarkAbsent(id, command.ExpectedRevision, actor, DateTimeOffset.UtcNow), cancellationToken);
    }
}
