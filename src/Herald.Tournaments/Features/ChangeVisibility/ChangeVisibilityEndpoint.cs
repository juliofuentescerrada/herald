using Herald.BuildingBlocks;
using Herald.ModuleHosting;
using Herald.Tournaments.Domain;
using Herald.Tournaments.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Wolverine;
using Wolverine.Http;

namespace Herald.Tournaments.Features.ChangeVisibility;

public sealed record ChangeVisibility(Visibility? Visibility, int ExpectedRevision);

public static class ChangeVisibilityEndpoint
{
    // Takes effect when it commits: the public page reads visibility on every request and is never cached (h1-public-read D-3).
    [WolverinePost("/api/organisations/{organisationId}/tournaments/{tournamentId}/visibility")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("changeVisibility")]
    [OperationGroup(OperationGroup.Setup)]
    [ProducesResponseType<TournamentDetails>(StatusCodes.Status200OK)]
    [ProducesResponseType<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json")]
    [ProblemTypes(StatusCodes.Status409Conflict, TournamentResults.RevisionConflict)]
    public static async Task<IResult> Post(
        Guid organisationId, Guid tournamentId, ChangeVisibility command, OrganisationContext context, TournamentsDbContext db, IMessageBus bus, CancellationToken cancellationToken)
    {
        var id = new TournamentId(tournamentId);
        if (await db.Tournaments.SingleOrDefaultAsync(tournament => tournament.Id == id, cancellationToken) is not { } tournament)
        {
            return TournamentResults.NotFound();
        }

        if (command.Visibility is not { } visibility)
        {
            return TournamentResults.Rejected([new("visibility", "required")]);
        }

        var actor = context.ActorId ?? throw new InvalidOperationException($"No acting person in organisation {organisationId}.");
        var result = tournament.ChangeVisibility(visibility, command.ExpectedRevision, actor, DateTimeOffset.UtcNow, context.ActorName);
        return await db.SavedAsync(bus, organisationId, tournament, result, cancellationToken);
    }
}
