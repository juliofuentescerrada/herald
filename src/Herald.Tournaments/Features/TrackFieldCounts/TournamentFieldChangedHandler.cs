using Herald.Contracts.Registration.V1;
using Herald.Tournaments.Domain;
using Herald.Tournaments.Persistence;
using Microsoft.EntityFrameworkCore;
using Wolverine.Attributes;

namespace Herald.Tournaments.Features.TrackFieldCounts;

// Keeps Tournaments' view of a tournament's entries for its own rules and reads (design D-3).
// Snapshots: an older one changes nothing.
public static class TournamentFieldChangedHandler
{
    // The first report of a tournament arriving twice at once: tried again as an update.
    [RetryNow(typeof(DbUpdateException), 50, 100, 250)]
    public static async Task Handle(TournamentFieldChanged message, TournamentsDbContext db, CancellationToken cancellationToken)
    {
        var id = new TournamentId(message.TournamentId);
        if (await db.FieldCounts.SingleOrDefaultAsync(counts => counts.TournamentId == id, cancellationToken) is not { } counts)
        {
            counts = new FieldCounts { TournamentId = id };
            db.FieldCounts.Add(counts);
        }
        else if (message.Revision <= counts.Revision)
        {
            return;
        }

        counts.Revision = message.Revision;
        counts.Admitted = message.Admitted;
        counts.Waiting = message.Waiting;
        counts.CheckedIn = message.CheckedIn;
    }
}
