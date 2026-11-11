using Herald.ModuleHosting;
using Herald.Registration.Domain;
using Herald.Registration.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Wolverine;
using Wolverine.Http;

namespace Herald.Registration.Features.AdmitEntry;

// The entry's revision on the owner's screen; the reason is required only to skip the capacity queue.
public sealed record AdmitEntry(int ExpectedRevision, string? Reason = null);

public static class AdmitEntryEndpoint
{
    [WolverinePost("/api/organisations/{organisationId}/tournaments/{tournamentId}/entries/{entryId}/admission")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("admitEntry")]
    [ProducesResponseType<FieldDetails>(StatusCodes.Status200OK)]
    [ProducesResponseType<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json")]
    public static async Task<IResult> Post(
        Guid organisationId,
        Guid tournamentId,
        Guid entryId,
        AdmitEntry command,
        OrganisationContext context,
        RegistrationDbContext db,
        IMessageBus bus,
        CancellationToken cancellationToken)
    {
        var actor = context.ActorId ?? throw new InvalidOperationException($"No acting person in organisation {organisationId}.");
        var id = new EntryId(entryId);
        return await db.WriteAsync(bus, organisationId, tournamentId, id,
            field => field.Admit(id, command.ExpectedRevision, command.Reason, actor, DateTimeOffset.UtcNow), cancellationToken);
    }
}
