using Herald.ModuleHosting;
using Herald.Tournaments.Domain;
using Herald.Tournaments.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Wolverine.Http;

namespace Herald.Tournaments.Features.GetPublicTournament;

public static class GetPublicTournamentEndpoint
{
    public const string NotAvailable = "tournament-not-available";

    // Anonymous: the tournament's link is all a visitor has. A draft, a private, a deleted and an unknown tournament give the same
    // answer (F-01a); no response is kept by a shared cache, so a switch to private needs nothing invalidated (h1-public-read D-3, Q2).
    [WolverineGet("/api/public/tournaments/{tournamentId}")]
    [EndpointGroupName(HeraldApi.Public)]
    [EndpointName("getPublicTournament")]
    [ProducesResponseType<PublicTournamentView>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    public static async Task<IResult> Get(
        Guid tournamentId, HttpContext http, OrganisationContext context, TournamentsDbContext db, CancellationToken cancellationToken)
    {
        http.Response.Headers.CacheControl = "no-store";
        var id = new TournamentId(tournamentId);
        // Reviewed bypass: a visitor belongs to no organisation; only the tournament's own organisation is entered, and only to
        // read what this tournament publishes.
        var found = await db.Tournaments.IgnoreQueryFilters([OrganisationScopedDbContext.OrganisationFilter]).AsNoTracking()
            .Where(tournament => tournament.Id == id)
            .Select(tournament => new { Tournament = tournament, OrganisationId = EF.Property<Guid>(tournament, OrganisationScopedDbContext.OrganisationProperty) })
            .SingleOrDefaultAsync(cancellationToken);
        // From the request's services, as the host's access step does: Organisations keeps its implementation internal.
        var organisations = http.RequestServices.GetRequiredService<IOrganisationAccess>();
        if (found is null || !PublicTournament.IsReadable(found.Tournament)
            || await organisations.FindNameAsync(found.OrganisationId, cancellationToken) is not { } organiser)
        {
            return Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "This tournament is not available", type: NotAvailable);
        }

        context.Enter(found.OrganisationId);
        return Results.Ok(await db.ViewAsync(found.Tournament, organiser, cancellationToken));
    }
}
