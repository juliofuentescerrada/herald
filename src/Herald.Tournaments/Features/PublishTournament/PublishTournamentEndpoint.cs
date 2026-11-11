using Herald.ModuleHosting;
using Herald.Tournaments.Domain;
using Herald.Tournaments.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Wolverine.Http;

namespace Herald.Tournaments.Features.PublishTournament;

// The revision the owner reviewed: a tournament that changed since is not published.
public sealed record PublishTournament(int ExpectedRevision);

public static class PublishTournamentEndpoint
{
    [WolverinePost("/api/organisations/{organisationId}/tournaments/{tournamentId}/publication")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("publishTournament")]
    [ProducesResponseType<TournamentDetails>(StatusCodes.Status200OK)]
    [ProducesResponseType<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json")]
    public static async Task<IResult> Post(
        Guid organisationId, Guid tournamentId, PublishTournament command, OrganisationContext context, TournamentsDbContext db, CancellationToken cancellationToken)
    {
        var id = new TournamentId(tournamentId);
        if (await db.Tournaments.SingleOrDefaultAsync(tournament => tournament.Id == id, cancellationToken) is not { } tournament)
        {
            return TournamentResults.NotFound();
        }

        var actor = context.ActorId ?? throw new InvalidOperationException($"No acting person in organisation {organisationId}.");
        var result = tournament.Publish(command.ExpectedRevision, actor, DateTimeOffset.UtcNow);
        return await db.SavedAsync(tournament, result, cancellationToken);
    }
}
