using Herald.Competition.Domain;
using Herald.Competition.Persistence;
using Herald.Contracts.Registration.V1;
using Herald.ModuleHosting;
using Microsoft.EntityFrameworkCore;
using Wolverine.Attributes;

namespace Herald.Competition.Features.TrackEligibleField;

// Keeps Competition's view of a tournament's eligible field (design D-2). Snapshots: older ones change nothing.
// The schedule's own snapshot is not republished: the field is not part of it.
public static class TournamentEligibleFieldChangedHandler
{
    // A write on the same schedule, or the first field of a tournament arriving twice at once: tried again.
    [RetryNow(typeof(DbUpdateException), 50, 100, 250)]
    public static async Task Handle(TournamentEligibleFieldChanged message, OrganisationContext context, CompetitionDbContext db, CancellationToken cancellationToken)
    {
        context.Enter(message.OrganisationId);
        var id = new TournamentId(message.TournamentId);
        var field = new EligibleField(
            message.Revision,
            message.RegistrationClosed,
            [.. message.Pending.Select(pending => new Domain.PendingEntrant(pending.EntryId, pending.Name))],
            [.. message.Entrants.OrderBy(entrant => entrant.AdmissionOrder).Select(entrant => new Entrant(entrant.EntryId, entrant.Name, entrant.AdmissionOrder))]);

        if (await db.Schedules.SingleOrDefaultAsync(schedule => schedule.Id == id, cancellationToken) is not { } schedule)
        {
            db.Schedules.Add(Schedule.Track(id, field));
        }
        else
        {
            schedule.ApplyField(field);
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}
