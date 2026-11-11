using Herald.ModuleHosting;
using Herald.Registration.Domain;
using Herald.Registration.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Wolverine.Http;

namespace Herald.Registration.Features.RemoveRosterMember;

public static class RemoveRosterMemberEndpoint
{
    // The roster revision on the owner's screen travels in the query: a delete has no body.
    [WolverineDelete("/api/organisations/{organisationId}/tournaments/{tournamentId}/entries/{entryId}/roster/members/{guestId}")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("removeRosterMember")]
    [ProducesResponseType<RosterDetails>(StatusCodes.Status200OK)]
    [ProducesResponseType<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json")]
    public static async Task<IResult> Delete(
        Guid organisationId,
        Guid tournamentId,
        Guid entryId,
        Guid guestId,
        [FromQuery] int expectedRevision,
        OrganisationContext context,
        RegistrationDbContext db,
        CancellationToken cancellationToken)
    {
        var actor = context.ActorId ?? throw new InvalidOperationException($"No acting person in organisation {organisationId}.");
        var id = new EntryId(entryId);
        var player = new GuestId(guestId);
        return await db.WriteAsync(tournamentId, id, player,
            field => field.RemoveRosterMember(id, player, expectedRevision, actor, DateTimeOffset.UtcNow), cancellationToken);
    }
}
