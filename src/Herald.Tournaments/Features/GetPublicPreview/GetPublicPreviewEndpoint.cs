using Herald.BuildingBlocks;
using Herald.ModuleHosting;
using Herald.Tournaments.Domain;
using Herald.Tournaments.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Wolverine.Http;

namespace Herald.Tournaments.Features.GetPublicPreview;

// What the public page would show, and the entrant aliases it names (h1-public-read D-3).
public sealed record PublicPreview(PublicTournamentView Page, IReadOnlyList<string> Aliases);

public static class GetPublicPreviewEndpoint
{
    // The owner's preview before making a private tournament public or unlisted: the public page's model, whatever the visibility.
    [WolverineGet("/api/organisations/{organisationId}/tournaments/{tournamentId}/public-preview")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("getPublicPreview")]
    [OperationGroup(OperationGroup.Read)]
    [ProducesResponseType<PublicPreview>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    public static async Task<IResult> Get(
        Guid organisationId, Guid tournamentId, HttpContext http, TournamentsDbContext db, CancellationToken cancellationToken)
    {
        var id = new TournamentId(tournamentId);
        if (await db.Tournaments.AsNoTracking().SingleOrDefaultAsync(tournament => tournament.Id == id, cancellationToken) is not { } tournament)
        {
            return TournamentResults.NotFound();
        }

        // From the request's services: Organisations keeps its implementation internal.
        var organisations = http.RequestServices.GetRequiredService<IOrganisationAccess>();
        var page = await db.ViewAsync(tournament, await organisations.FindNameAsync(organisationId, cancellationToken) ?? "", cancellationToken);
        return Results.Ok(new PublicPreview(page, PublicTournament.AliasesOf(page)));
    }
}
