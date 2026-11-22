using Herald.Competition.Domain;
using Herald.Competition.Persistence;
using Herald.Contracts.Registration.V1;
using Herald.ModuleHosting;
using Microsoft.EntityFrameworkCore;
using Wolverine.Attributes;

namespace Herald.Competition.Features.TrackFrozenRosters;

// Keeps Competition's view of a team tournament's frozen rosters (h1-match-lineups D-4). Snapshots: older ones change nothing.
public static class TournamentFrozenRostersChangedHandler
{
    // A write on the same schedule: tried again.
    [RetryNow(typeof(DbUpdateException), 50, 100, 250)]
    public static async Task Handle(TournamentFrozenRostersChanged message, OrganisationContext context, CompetitionDbContext db, CancellationToken cancellationToken)
    {
        context.Enter(message.OrganisationId);
        var id = new TournamentId(message.TournamentId);
        var rosters = new FrozenRosters(
            message.Revision,
            [.. message.Rosters.Select(roster => new Domain.FrozenRoster(roster.EntryId, roster.Revision, [.. roster.Members.Select(member => new RosterPlayer(member.GuestPlayerId, member.Name))]))]);

        // A start needs a published schedule, so its rosters always find one.
        if (await db.Schedules.SingleOrDefaultAsync(schedule => schedule.Id == id, cancellationToken) is { } schedule && schedule.ApplyRosters(rosters))
        {
            await db.SaveChangesAsync(cancellationToken);
        }
    }
}
