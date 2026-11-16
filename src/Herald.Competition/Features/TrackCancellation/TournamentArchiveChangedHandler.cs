using Herald.Competition.Domain;
using Herald.Competition.Persistence;
using Herald.Contracts.Tournaments.V1;
using Herald.ModuleHosting;
using Microsoft.EntityFrameworkCore;
using Wolverine.Attributes;

namespace Herald.Competition.Features.TrackCancellation;

// Tracks the archive flag, so an archived competition is reopened only after unarchiving (design D-3). Snapshots: older ones
// change nothing.
public static class TournamentArchiveChangedHandler
{
    [RetryNow(typeof(DbUpdateException), 50, 100, 250)]
    public static async Task Handle(TournamentArchiveChanged message, OrganisationContext context, CompetitionDbContext db, CancellationToken cancellationToken)
    {
        context.Enter(message.OrganisationId);
        var id = new TournamentId(message.TournamentId);
        if (await db.Schedules.SingleOrDefaultAsync(schedule => schedule.Id == id, cancellationToken) is { } schedule
            && schedule.ApplyArchive(message.Archived, message.Revision))
        {
            await db.SaveChangesAsync(cancellationToken);
        }
    }
}
