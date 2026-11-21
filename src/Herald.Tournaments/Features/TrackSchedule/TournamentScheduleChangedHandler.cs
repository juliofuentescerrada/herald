using Herald.Contracts.Competition.V1;
using Herald.ModuleHosting;
using Herald.Tournaments.Domain;
using Herald.Tournaments.Persistence;
using Microsoft.EntityFrameworkCore;
using Wolverine;
using Wolverine.Attributes;

namespace Herald.Tournaments.Features.TrackSchedule;

// Keeps Tournaments' view of a tournament's schedule (h1-round-robin-pairings D-4). Snapshots: an older one
// changes nothing. When publication starts or ends, Registration gets new terms that lock or unlock the field.
public static class TournamentScheduleChangedHandler
{
    // The first report of a tournament arriving twice at once, or a write on the same tournament: tried again.
    [RetryNow(typeof(DbUpdateException), 50, 100, 250)]
    public static async Task Handle(
        TournamentScheduleChanged message, OrganisationContext context, TournamentsDbContext db, IMessageBus bus, CancellationToken cancellationToken)
    {
        context.Enter(message.OrganisationId);
        var id = new TournamentId(message.TournamentId);
        var wasPublished = false;
        if (await db.Schedules.SingleOrDefaultAsync(schedule => schedule.TournamentId == id, cancellationToken) is not { } state)
        {
            state = new ScheduleState { TournamentId = id };
            db.Schedules.Add(state);
        }
        else if (message.Revision <= state.Revision)
        {
            return;
        }
        else
        {
            wasPublished = state.PublishedRevision is not null;
        }

        state.Revision = message.Revision;
        state.PublishedRevision = message.PublishedRevision;
        state.EligibleRevision = message.EligibleRevision;
        state.Published = message.Published;
        var published = message.PublishedRevision is not null;
        if (published != wasPublished
            && await db.Tournaments.SingleOrDefaultAsync(tournament => tournament.Id == id, cancellationToken) is { Publication: Publication.Published } tournament)
        {
            tournament.NextTermsRevision();
            await bus.PublishAsync(TournamentResults.EntryTerms(message.OrganisationId, tournament, published));
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}
