using Herald.ModuleHosting;
using Herald.Registration.Domain;
using Herald.Registration.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Wolverine;
using Wolverine.Http;

namespace Herald.Registration.Features.EnterGuest;

// The client generates the entry's identifier and keeps it for retries of the same attempt.
public sealed record EnterGuest(Guid GuestId);

public static class EnterGuestEndpoint
{
    [WolverinePut("/api/organisations/{organisationId}/tournaments/{tournamentId}/entries/{entryId}")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("enterGuest")]
    [ProducesResponseType<FieldDetails>(StatusCodes.Status200OK)]
    [ProducesResponseType<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    public static async Task<IResult> Put(
        Guid organisationId,
        Guid tournamentId,
        Guid entryId,
        EnterGuest command,
        OrganisationContext context,
        RegistrationDbContext db,
        IMessageBus bus,
        CancellationToken cancellationToken)
    {
        // The organisation filter hides another organisation's guest: it is as absent as a missing one.
        var guestId = new GuestId(command.GuestId);
        if (entryId == Guid.Empty || await db.Guests.AsNoTracking().SingleOrDefaultAsync(guest => guest.Id == guestId, cancellationToken) is not { } guest)
        {
            return FieldResults.Rejected([new(entryId == Guid.Empty ? "entryId" : "guestId", entryId == Guid.Empty ? "required" : "not-found")]);
        }

        var actor = context.ActorId ?? throw new InvalidOperationException($"No acting person in organisation {organisationId}.");
        return await db.WriteAsync(bus, organisationId, tournamentId, existingEntry: null,
            field => field.Enter(new EntryId(entryId), guest.Id, guest.Kind, actor, DateTimeOffset.UtcNow), cancellationToken);
    }
}
