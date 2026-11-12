using Herald.ModuleHosting;
using Herald.Registration.Domain;
using Herald.Registration.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Wolverine;
using Wolverine.Http;

namespace Herald.Registration.Features.CheckIn;

// The entry's check-in revision on the owner's screen.
public sealed record CheckInEntry(int ExpectedRevision);

public static class CheckInEndpoint
{
    [WolverinePut("/api/organisations/{organisationId}/tournaments/{tournamentId}/entries/{entryId}/check-in")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("checkIn")]
    [ProducesResponseType<FieldDetails>(StatusCodes.Status200OK)]
    [ProducesResponseType<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json")]
    public static async Task<IResult> Put(
        Guid organisationId,
        Guid tournamentId,
        Guid entryId,
        CheckInEntry command,
        OrganisationContext context,
        RegistrationDbContext db,
        IMessageBus bus,
        CancellationToken cancellationToken)
    {
        var actor = context.ActorId ?? throw new InvalidOperationException($"No acting person in organisation {organisationId}.");
        var id = new EntryId(entryId);
        return await db.WriteAsync(bus, organisationId, tournamentId, id,
            field => field.SetCheckIn(id, checkedIn: true, command.ExpectedRevision, actor, DateTimeOffset.UtcNow), cancellationToken, checkIn: true);
    }
}
