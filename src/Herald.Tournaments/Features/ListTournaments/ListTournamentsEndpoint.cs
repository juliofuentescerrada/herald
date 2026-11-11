using Herald.ModuleHosting;
using Herald.Tournaments.Domain;
using Herald.Tournaments.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Wolverine.Http;

namespace Herald.Tournaments.Features.ListTournaments;

public sealed record TournamentSummary(
    Guid Id,
    string Title,
    string? GameVariant,
    EntryKind? EntryKind,
    int? Capacity,
    DateTime? PlannedStartAt,
    string? TimeZone,
    LocationMode? Location,
    string? Venue,
    Publication Publication,
    RegistrationWindow Registration,
    string Competition,
    int AdmittedEntries,
    int WaitingEntries);

public static class ListTournamentsEndpoint
{
    [WolverineGet("/api/organisations/{organisationId}/tournaments")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("listTournaments")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    public static async Task<IReadOnlyList<TournamentSummary>> Get(Guid organisationId, TournamentsDbContext db, CancellationToken cancellationToken)
    {
        // shortcut: no paging, an organisation's list is short in H1; add it when tournaments can be archived.
        var tournaments = await db.Tournaments.AsNoTracking()
            .OrderByDescending(tournament => tournament.CreatedAt)
            .Select(tournament => new { tournament.Id, tournament.Configuration, tournament.Publication, tournament.Registration })
            .ToListAsync(cancellationToken);
        var ids = tournaments.Select(tournament => tournament.Id).ToList();
        var counts = await db.FieldCounts.AsNoTracking()
            .Where(field => ids.Contains(field.TournamentId))
            .ToDictionaryAsync(field => field.TournamentId, field => field.Counts, cancellationToken);

        return [.. tournaments.Select(tournament => new TournamentSummary(
            tournament.Id.Value,
            tournament.Configuration.Title,
            tournament.Configuration.GameVariant,
            tournament.Configuration.EntryKind,
            tournament.Configuration.Capacity,
            tournament.Configuration.PlannedStartAt,
            tournament.Configuration.TimeZone,
            tournament.Configuration.Location,
            tournament.Configuration.Venue,
            tournament.Publication,
            tournament.Registration,
            TournamentDetails.CompetitionPreparation,
            counts.GetValueOrDefault(tournament.Id).Admitted,
            counts.GetValueOrDefault(tournament.Id).Waiting))];
    }
}
