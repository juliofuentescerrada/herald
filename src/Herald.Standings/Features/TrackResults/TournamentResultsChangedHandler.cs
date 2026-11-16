using Herald.Contracts.Competition.V1;
using Herald.ModuleHosting;
using Herald.Standings.Domain;
using Herald.Standings.Persistence;
using Microsoft.EntityFrameworkCore;
using Wolverine.Attributes;

namespace Herald.Standings.Features.TrackResults;

// Keeps the latest results of each tournament (h1-standings D-1); an older snapshot changes nothing.
public static class TournamentResultsChangedHandler
{
    // The first report of a tournament arriving twice at once, or two snapshots applied together: tried again.
    [RetryNow(typeof(DbUpdateException), 50, 100, 250)]
    public static async Task Handle(TournamentResultsChanged message, OrganisationContext context, StandingsDbContext db, CancellationToken cancellationToken)
    {
        context.Enter(message.OrganisationId);
        var id = new TournamentId(message.TournamentId);
        var snapshot = SnapshotOf(message);
        if (await db.Results.SingleOrDefaultAsync(results => results.Id == id, cancellationToken) is { } results)
        {
            if (!results.Apply(snapshot))
            {
                return;
            }
        }
        else
        {
            db.Results.Add(TournamentResults.Track(id, snapshot));
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    // Only resolved matches carry an outcome; the contract's states beyond that are Competition's.
    private static ResultsSnapshot SnapshotOf(TournamentResultsChanged message) => new(
        message.Revision,
        [.. message.Entrants.Select(entrant => new Entrant(entrant.EntryId, entrant.Name, Enum.Parse<EntrantStatus>(entrant.Status.ToString())))],
        [.. message.Matches.Select(match => new MatchResult(
            match.MatchId,
            match.Round,
            match.First,
            match.Second,
            match.State == ResultsMatchState.Resolved && match.Outcome is { } outcome ? Enum.Parse<Outcome>(outcome.ToString()) : null,
            match.State == ResultsMatchState.Resolved ? match.Cause : null,
            match.Revision))],
        [.. message.Rests.Select(rest => new Rest(rest.Round, rest.EntryId))]);
}
