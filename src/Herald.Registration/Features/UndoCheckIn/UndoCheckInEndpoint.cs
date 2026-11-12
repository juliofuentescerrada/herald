using Herald.ModuleHosting;
using Herald.Registration.Domain;
using Herald.Registration.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Wolverine;
using Wolverine.Http;

namespace Herald.Registration.Features.UndoCheckIn;

public static class UndoCheckInEndpoint
{
    // The check-in revision on the owner's screen travels in the query: a delete has no body.
    [WolverineDelete("/api/organisations/{organisationId}/tournaments/{tournamentId}/entries/{entryId}/check-in")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("undoCheckIn")]
    [ProducesResponseType<FieldDetails>(StatusCodes.Status200OK)]
    [ProducesResponseType<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json")]
    public static async Task<IResult> Delete(
        Guid organisationId,
        Guid tournamentId,
        Guid entryId,
        [FromQuery] int expectedRevision,
        OrganisationContext context,
        RegistrationDbContext db,
        IMessageBus bus,
        CancellationToken cancellationToken)
    {
        var actor = context.ActorId ?? throw new InvalidOperationException($"No acting person in organisation {organisationId}.");
        var id = new EntryId(entryId);
        return await db.WriteAsync(bus, organisationId, tournamentId, id,
            field => field.SetCheckIn(id, checkedIn: false, expectedRevision, actor, DateTimeOffset.UtcNow), cancellationToken, checkIn: true);
    }
}
