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
        ApplyAsync(
            message.OrganisationId, message.TournamentId, context, db, tournament => tournament.ApplyFinalisation(message.FinalRevision),
            new(new(message.TournamentId), ChangeKind.CompetitionFinalised, message.TournamentId, message.FinalRevision, message.FinalisedBy, null, message.FinalisedAt),
            cancellationToken);

    [RetryNow(typeof(DbUpdateException), 50, 100, 250)]
    public static Task Handle(CompetitionReopened message, OrganisationContext context, TournamentsDbContext db, CancellationToken cancellationToken) =>
        ApplyAsync(
            message.OrganisationId, message.TournamentId, context, db, tournament => tournament.ApplyReopening(message.FinalRevision),
            new(new(message.TournamentId), ChangeKind.CompetitionReopened, message.TournamentId, message.FinalRevision, message.ReopenedBy, null, message.ReopenedAt),
            cancellationToken);

    private static async Task ApplyAsync(
        Guid organisationId, Guid tournamentId, OrganisationContext context, TournamentsDbContext db, Func<Tournament, bool> apply, ChangeLogEntry logged,
        CancellationToken cancellationToken)
    {
        context.Enter(organisationId);
        var id = new TournamentId(tournamentId);
        if (await db.Tournaments.SingleOrDefaultAsync(tournament => tournament.Id == id, cancellationToken) is { } tournament && apply(tournament))
        {
            // Each final revision and its reopening, in the change log (change-log D-1); the reopening's reason stays in Competition (Q1).
            await db.LogOnceAsync(logged, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);
        }
    }
}
