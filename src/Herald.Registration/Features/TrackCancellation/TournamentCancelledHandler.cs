using Herald.Contracts.Tournaments.V1;
using Herald.ModuleHosting;
using Herald.Registration.Domain;
using Herald.Registration.Persistence;
using Microsoft.EntityFrameworkCore;
using Wolverine;
using Wolverine.Attributes;

namespace Herald.Registration.Features.TrackCancellation;

// Cancels the tournament's active entries and closes the field to writes (h1-tournament-cancel-and-dates D-1). A second
// delivery finds it applied. A field not yet tracked has no entries; the terms that follow say registration is closed.
[StickyHandler(RegistrationModule.Queue)]
public static class TournamentCancelledHandler
{
    [RetryNow(typeof(DbUpdateException), 50, 100, 250)]
    public static async Task Handle(TournamentCancelled message, OrganisationContext context, RegistrationDbContext db, IMessageBus bus, CancellationToken cancellationToken)
    {
        context.Enter(message.OrganisationId);
        var id = new TournamentId(message.TournamentId);
        if (await db.Fields.SingleOrDefaultAsync(field => field.Id == id, cancellationToken) is not { } field)
        {
            return;
        }

        var eligibleRevision = field.EligibleRevision;
        if (field.ApplyCancellation(message.CancelledBy, message.CancelledAt))
        {
            await FieldDetails.PublishAsync(bus, message.OrganisationId, field, eligibleRevision, db, cancellationToken);
        }
    }
}
