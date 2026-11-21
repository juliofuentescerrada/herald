using Herald.Contracts.Competition.V1;
using Herald.ModuleHosting;
using Herald.Standings.Domain;
using Herald.Standings.Persistence;
using Microsoft.EntityFrameworkCore;
using Wolverine;
using Wolverine.Attributes;

namespace Herald.Standings.Features.TrackFinalisation;

// Marks the table final, or provisional again, as Competition announces it (h1-finalisation D-4), and publishes the table.
// Tournaments handles the same events on its own queue.
[StickyHandler(StandingsModule.Queue)]
public static class FinalisationHandler
{
    // Tried again when the results this finalisation allowed have not been applied yet, or when the finalisation and its
    // reopening are saved at once (both a DbUpdateException and the missing results, hence the base type).
    [RetryNow(typeof(Exception), 50, 100, 250, 500)]
    public static Task Handle(CompetitionFinalised message, OrganisationContext context, StandingsDbContext db, IMessageBus bus, CancellationToken cancellationToken) =>
        ApplyAsync(message.OrganisationId, message.TournamentId, context, db, bus, results => results.Finalise(message.FinalRevision, message.ResultsRevision, message.FinalisedAt), cancellationToken);

    [RetryNow(typeof(Exception), 50, 100, 250, 500)]
    public static Task Handle(CompetitionReopened message, OrganisationContext context, StandingsDbContext db, IMessageBus bus, CancellationToken cancellationToken) =>
        ApplyAsync(message.OrganisationId, message.TournamentId, context, db, bus, results => results.Reopen(message.FinalRevision, message.ResultsRevision, message.ReopenedAt), cancellationToken);

    private static async Task ApplyAsync(
        Guid organisationId, Guid tournamentId, OrganisationContext context, StandingsDbContext db, IMessageBus bus, Func<TournamentResults, bool> apply, CancellationToken cancellationToken)
    {
        context.Enter(organisationId);
        var id = new TournamentId(tournamentId);
        var results = await db.Results.SingleOrDefaultAsync(results => results.Id == id, cancellationToken)
            ?? throw new InvalidOperationException($"No results yet for tournament {tournamentId}.");
        if (apply(results))
        {
            await db.SaveChangesAsync(cancellationToken);
            await bus.PublishAsync(Features.StandingsSnapshot.Of(organisationId, results, DateTimeOffset.UtcNow));
        }
    }
}
