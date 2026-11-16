using Herald.Competition.Domain;
using Herald.Competition.Persistence;
using Herald.Contracts.Tournaments.V1;
using Herald.ModuleHosting;
using Microsoft.EntityFrameworkCore;
using Wolverine;
using Wolverine.Attributes;

namespace Herald.Competition.Features.TrackCancellation;

// Withdraws the publication or voids the unresolved matches, then rejects every write (h1-tournament-cancel-and-dates D-1).
// A write accepted just before this arrives is kept like any earlier one (Q2). A tournament without a schedule has nothing to end.
[StickyHandler(CompetitionModule.Queue)]
public static class TournamentCancelledHandler
{
    [RetryNow(typeof(DbUpdateException), 50, 100, 250)]
    public static async Task Handle(TournamentCancelled message, OrganisationContext context, CompetitionDbContext db, IMessageBus bus, CancellationToken cancellationToken)
    {
        context.Enter(message.OrganisationId);
        var id = new TournamentId(message.TournamentId);
        if (await db.Schedules.SingleOrDefaultAsync(schedule => schedule.Id == id, cancellationToken) is not { } schedule)
        {
            return;
        }

        var matches = await db.Matches.Where(match => match.TournamentId == id).ToListAsync(cancellationToken);
        var resultsRevision = schedule.ResultsRevision;
        if (!schedule.ApplyCancellation(matches, message.CancelledBy, message.CancelledAt))
        {
            return;
        }

        await db.SaveChangesAsync(cancellationToken);
        await bus.PublishAsync(ScheduleDetails.Changed(message.OrganisationId, schedule));
        if (schedule.ResultsRevision != resultsRevision)
        {
            // The final results: Standings keeps them as they are, with no champion (D-2).
            await bus.PublishAsync(ResultsSnapshot.Of(message.OrganisationId, schedule, matches));
        }
    }
}
