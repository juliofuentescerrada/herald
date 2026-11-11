using Herald.ModuleHosting;
using Herald.Registration.Domain;
using Herald.Registration.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Wolverine;
using Wolverine.Http;

namespace Herald.Registration.Features.CancelEntry;

// The entry's revision on the owner's screen.
public sealed record CancelEntry(int ExpectedRevision);

public static class CancelEntryEndpoint
{
    // Final for the entry; a freed slot follows the tournament's admission (EN-8).
    [WolverinePost("/api/organisations/{organisationId}/tournaments/{tournamentId}/entries/{entryId}/cancellation")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("cancelEntry")]
    [ProducesResponseType<FieldDetails>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json")]
    public static async Task<IResult> Post(
        Guid organisationId,
        Guid tournamentId,
        Guid entryId,
        CancelEntry command,
        OrganisationContext context,
        RegistrationDbContext db,
        IMessageBus bus,
        CancellationToken cancellationToken)
    {
        var actor = context.ActorId ?? throw new InvalidOperationException($"No acting person in organisation {organisationId}.");
        var id = new EntryId(entryId);
        return await db.WriteAsync(bus, organisationId, tournamentId, id,
            field => field.Cancel(id, command.ExpectedRevision, actor, DateTimeOffset.UtcNow), cancellationToken);
    }
}
