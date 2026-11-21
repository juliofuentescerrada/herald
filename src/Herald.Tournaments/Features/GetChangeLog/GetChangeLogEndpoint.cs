using Herald.BuildingBlocks;
using Herald.ModuleHosting;
using Herald.Tournaments.Domain;
using Herald.Tournaments.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Wolverine.Http;

namespace Herald.Tournaments.Features.GetChangeLog;

// One change as the owner reads it: what, who, when, the values before and after, and whether visitors also see it.
// Subject is the entry for an entry's change and the tournament otherwise; another module's reason is reached through it (Q1).
public sealed record ChangeLogItem(
    ChangeKind Kind,
    Guid Subject,
    int SubjectRevision,
    string? ActorName,
    DateTimeOffset At,
    IReadOnlyList<ChangedValue> Changes,
    string? TimeZone,
    string? Alias,
    string? Cause,
    string? Reason,
    bool Public);

public static class GetChangeLogEndpoint
{
    // The owner's whole change log, newest first (h1-change-log D-4); Herald records it and delivers it to nobody.
    [WolverineGet("/api/organisations/{organisationId}/tournaments/{tournamentId}/change-log")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("getChangeLog")]
    [OperationGroup(OperationGroup.Read)]
    [ProducesResponseType<IReadOnlyList<ChangeLogItem>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    public static async Task<IResult> Get(Guid organisationId, Guid tournamentId, TournamentsDbContext db, CancellationToken cancellationToken)
    {
        var id = new TournamentId(tournamentId);
        if (!await db.Tournaments.AnyAsync(tournament => tournament.Id == id, cancellationToken))
        {
            return TournamentResults.NotFound();
        }

        var entries = await db.ChangeLog.AsNoTracking().Where(entry => entry.TournamentId == id)
            .OrderByDescending(entry => entry.At).ThenByDescending(entry => entry.SubjectRevision).ToListAsync(cancellationToken);
        return Results.Ok(entries.Select(entry => new ChangeLogItem(
            entry.Kind, entry.Subject, entry.SubjectRevision, entry.ActorName, entry.At, entry.Changes, entry.TimeZone, entry.Alias, entry.Cause, entry.Reason, entry.Public)).ToList());
    }
}
