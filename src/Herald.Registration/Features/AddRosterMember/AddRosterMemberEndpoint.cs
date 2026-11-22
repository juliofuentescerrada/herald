using Herald.BuildingBlocks;
using Herald.ModuleHosting;
using Herald.Registration.Domain;
using Herald.Registration.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Wolverine;
using Wolverine.Http;

namespace Herald.Registration.Features.AddRosterMember;

// The roster revision on the owner's screen.
public sealed record AddRosterMember(int ExpectedRevision);

public static class AddRosterMemberEndpoint
{
    [WolverinePut("/api/organisations/{organisationId}/tournaments/{tournamentId}/entries/{entryId}/roster/members/{guestId}")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("addRosterMember")]
    [OperationGroup(OperationGroup.Entries)]
    [ProducesResponseType<RosterDetails>(StatusCodes.Status200OK)]
    [ProducesResponseType<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json")]
    [ProblemTypes(StatusCodes.Status409Conflict, RosterResults.RosterRevisionConflict)]
    public static async Task<IResult> Put(
        Guid organisationId,
        Guid tournamentId,
        Guid entryId,
        Guid guestId,
        AddRosterMember command,
        OrganisationContext context,
        RegistrationDbContext db,
        IMessageBus bus,
        CancellationToken cancellationToken)
    {
        // The organisation filter hides another organisation's guest: it is as absent as a missing one.
        var player = new GuestId(guestId);
        if (await db.Guests.AsNoTracking().SingleOrDefaultAsync(guest => guest.Id == player, cancellationToken) is not { } guest)
        {
            return FieldResults.NotFound();
        }

        var actor = context.ActorId ?? throw new InvalidOperationException($"No acting person in organisation {organisationId}.");
        var id = new EntryId(entryId);
        return await db.WriteAsync(bus, organisationId, tournamentId, id, player,
            field => field.AddRosterMember(id, player, guest.Kind, command.ExpectedRevision, actor, DateTimeOffset.UtcNow), cancellationToken);
    }
}
