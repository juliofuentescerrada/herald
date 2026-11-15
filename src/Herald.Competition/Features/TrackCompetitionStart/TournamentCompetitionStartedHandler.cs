using Herald.Competition.Domain;
using Herald.Competition.Persistence;
using Herald.Contracts.Tournaments.V1;
using Herald.ModuleHosting;
using Microsoft.EntityFrameworkCore;
using Wolverine.Attributes;

namespace Herald.Competition.Features.TrackCompetitionStart;

// The start fixes the schedule (h1-competition-start D-3): withdrawing and generating are rejected from now on.
// Each pairing of the started revision becomes a match (h1-match-lineups D-1).
// A start decided on a revision already withdrawn is reported by the schedule, never repaired (D-4).
public static class TournamentCompetitionStartedHandler
{
    // A write on the same schedule: tried again.
    [RetryNow(typeof(DbUpdateException), 50, 100, 250)]
    public static async Task Handle(TournamentCompetitionStarted message, OrganisationContext context, CompetitionDbContext db, CancellationToken cancellationToken)
    {
        context.Enter(message.OrganisationId);
        var id = new TournamentId(message.TournamentId);

        // A schedule exists: start needs a published revision, which needs a tracked field.
        if (await db.Schedules.SingleOrDefaultAsync(schedule => schedule.Id == id, cancellationToken) is { } schedule
            && schedule.ApplyStart(message.ScheduleRevision, message.StartedAt, message.ActivePlayersPerSide))
        {
            await db.ScheduleMatchesAsync(schedule, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);
        }
    }
}
