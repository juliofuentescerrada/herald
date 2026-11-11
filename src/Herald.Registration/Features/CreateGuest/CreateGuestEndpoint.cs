using Herald.ModuleHosting;
using Herald.Registration.Domain;
using Herald.Registration.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Wolverine.Http;

namespace Herald.Registration.Features.CreateGuest;

// The client generates the identifier and keeps it for retries. ConfirmNew creates a guest despite a possible duplicate.
public sealed record CreateGuest(GuestKind? Kind, string? Name, bool ConfirmNew = false);

public static class CreateGuestEndpoint
{
    [WolverinePut("/api/organisations/{organisationId}/guests/{guestId}")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("createGuest")]
    [ProducesResponseType<GuestDetails>(StatusCodes.Status200OK)]
    [ProducesResponseType<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<GuestConflict>(StatusCodes.Status409Conflict, "application/problem+json")]
    public static async Task<IResult> Put(
        Guid organisationId, Guid guestId, CreateGuest command, OrganisationContext context, RegistrationDbContext db, CancellationToken cancellationToken)
    {
        var broken = Guest.Check(command.Name).ToList();
        if (command.Kind is null)
        {
            broken.Add(new("kind", "required"));
        }

        if (guestId == Guid.Empty)
        {
            broken.Add(new("guestId", "required"));
        }

        if (broken.Count > 0)
        {
            return FieldResults.Rejected(broken);
        }

        var kind = command.Kind!.Value;
        var name = command.Name!;
        var id = new GuestId(guestId);
        if (await db.Guests.SingleOrDefaultAsync(guest => guest.Id == id, cancellationToken) is { } existing)
        {
            return existing.Repeats(kind, name) ? Results.Ok(GuestDetails.Of(existing)) : GuestResults.Conflict(GuestResults.IdentifierReused, []);
        }

        // Reported, never merged; only this organisation's guests are compared (EN-11).
        var normalised = Guest.Normalise(name);
        if (!command.ConfirmNew && await db.Guests.AsNoTracking()
                .Where(guest => guest.Kind == kind && guest.NormalisedName == normalised)
                .OrderBy(guest => guest.CreatedAt)
                .ToListAsync(cancellationToken) is { Count: > 0 } matches)
        {
            return GuestResults.Conflict(GuestResults.PossibleDuplicate, [.. matches.Select(match => GuestDetails.Of(match))]);
        }

        var actor = context.ActorId ?? throw new InvalidOperationException($"No acting person in organisation {organisationId}.");
        var created = Guest.Create(id, kind, name, actor, DateTimeOffset.UtcNow);
        db.Guests.Add(created);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            // Another organisation's guest, or a simultaneous attempt: nothing about the holder is revealed.
            db.Entry(created).State = EntityState.Detached;
            return GuestResults.Conflict(GuestResults.IdentifierReused, []);
        }

        return Results.Ok(GuestDetails.Of(created));
    }
}
