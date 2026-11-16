using Herald.Contracts.Competition.V1;
using Herald.ModuleHosting;
using Herald.Tournaments.Domain;
using Herald.Tournaments.Persistence;
using Microsoft.EntityFrameworkCore;
using Wolverine.Attributes;

namespace Herald.Tournaments.Features.TrackFinalisation;

// Shows the competition as finalised, or running again, as Competition announces it (h1-finalisation D-4). Standings handles the
// same events on its own queue.
// shortcut: a finalisation and its reopening handled at the same instant could save in either order; Competition publishes the
// reopening only after the finalisation committed, so this needs both in flight at once. Add a row version if it is ever seen.
[StickyHandler(TournamentsModule.Queue)]
public static class FinalisationHandler
{
    [RetryNow(typeof(DbUpdateException), 50, 100, 250)]
    public static Task Handle(CompetitionFinalised message, OrganisationContext context, TournamentsDbContext db, CancellationToken cancellationToken) =>
        ApplyAsync(message.OrganisationId, message.TournamentId, context, db, tournament => tournament.ApplyFinalisation(message.FinalRevision), cancellationToken);

    [RetryNow(typeof(DbUpdateException), 50, 100, 250)]
    public static Task Handle(CompetitionReopened message, OrganisationContext context, TournamentsDbContext db, CancellationToken cancellationToken) =>
        ApplyAsync(message.OrganisationId, message.TournamentId, context, db, tournament => tournament.ApplyReopening(message.FinalRevision), cancellationToken);

    private static async Task ApplyAsync(
        Guid organisationId, Guid tournamentId, OrganisationContext context, TournamentsDbContext db, Func<Tournament, bool> apply, CancellationToken cancellationToken)
    {
        context.Enter(organisationId);
        var id = new TournamentId(tournamentId);
        if (await db.Tournaments.SingleOrDefaultAsync(tournament => tournament.Id == id, cancellationToken) is { } tournament && apply(tournament))
        {
            await db.SaveChangesAsync(cancellationToken);
        }
    }
}
