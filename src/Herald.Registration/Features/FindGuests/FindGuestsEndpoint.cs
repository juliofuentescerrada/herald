using Herald.ModuleHosting;
using Herald.Registration.Domain;
using Herald.Registration.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Wolverine.Http;

namespace Herald.Registration.Features.FindGuests;

public static class FindGuestsEndpoint
{
    public const int Limit = 20;

    // The organisation's guests of one kind whose name starts as typed, ignoring case, accents and spaces.
    // With a tournament, each player says which active team's roster holds them there (design D-5).
    [WolverineGet("/api/organisations/{organisationId}/guests")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("findGuests")]
    [ProducesResponseType<IReadOnlyList<GuestDetails>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    public static async Task<IReadOnlyList<GuestDetails>> Get(
        Guid organisationId,
        [FromQuery] GuestKind kind,
        [FromQuery] string? name,
        [FromQuery] Guid? tournamentId,
        RegistrationDbContext db,
        CancellationToken cancellationToken)
    {
        var prefix = Guest.Normalise(name ?? "");
        var guests = await db.Guests.AsNoTracking()
            .Where(guest => guest.Kind == kind && guest.NormalisedName.StartsWith(prefix))
            .OrderBy(guest => guest.NormalisedName)
            .ThenBy(guest => guest.CreatedAt)
            .Take(Limit)
            .ToListAsync(cancellationToken);
        var tournament = new TournamentId(tournamentId ?? Guid.Empty);
        if (tournamentId is null || await db.Fields.AsNoTracking().SingleOrDefaultAsync(field => field.Id == tournament, cancellationToken) is not { } field)
        {
            return [.. guests.Select(guest => GuestDetails.Of(guest))];
        }

        var teams = await RosterTeams.NamesAsync(field, db, cancellationToken);
        return [.. guests.Select(guest => GuestDetails.Of(guest, field.TeamOf(guest.Id) is { } team ? new(team.Id.Value, teams[team.GuestId]) : null))];
    }
}
