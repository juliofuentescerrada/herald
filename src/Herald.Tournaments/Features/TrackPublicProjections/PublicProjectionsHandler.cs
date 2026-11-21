using Herald.Contracts.Competition.V1;
using Herald.Contracts.Standings.V1;
using Herald.ModuleHosting;
using Herald.Tournaments.Domain;
using Herald.Tournaments.Persistence;
using Microsoft.EntityFrameworkCore;
using Wolverine.Attributes;

namespace Herald.Tournaments.Features.TrackPublicProjections;

// Keeps the latest results and standings of each tournament for the public page (h1-public-read D-1); an older snapshot changes
// nothing (ADR 0016). Standings handles the results on its own queue.
[StickyHandler(TournamentsModule.Queue)]
public static class PublicProjectionsHandler
{
    // The first report of a tournament arriving twice at once, or two snapshots applied together: tried again.
    [RetryNow(typeof(DbUpdateException), 50, 100, 250)]
    public static async Task Handle(TournamentResultsChanged message, OrganisationContext context, TournamentsDbContext db, CancellationToken cancellationToken)
    {
        context.Enter(message.OrganisationId);
        var id = new TournamentId(message.TournamentId);
        if (await db.Results.SingleOrDefaultAsync(state => state.TournamentId == id, cancellationToken) is not { } state)
        {
            db.Results.Add(new ResultsState { TournamentId = id, Revision = message.Revision, Results = message });
        }
        else if (message.Revision > state.Revision)
        {
            (state.Revision, state.Results) = (message.Revision, message);
        }
        else
        {
            return;
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    [RetryNow(typeof(DbUpdateException), 50, 100, 250)]
    public static async Task Handle(TournamentStandingsChanged message, OrganisationContext context, TournamentsDbContext db, CancellationToken cancellationToken)
    {
        context.Enter(message.OrganisationId);
        var id = new TournamentId(message.TournamentId);
        if (await db.Standings.SingleOrDefaultAsync(state => state.TournamentId == id, cancellationToken) is not { } state)
        {
            db.Standings.Add(new StandingsState { TournamentId = id, Revision = message.Revision, Standings = message });
        }
        else if (message.Revision > state.Revision)
        {
            (state.Revision, state.Standings) = (message.Revision, message);
        }
        else
        {
            return;
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}
