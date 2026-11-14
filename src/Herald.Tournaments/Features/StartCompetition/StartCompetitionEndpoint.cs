using Herald.ModuleHosting;
using Herald.Tournaments.Domain;
using Herald.Tournaments.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Wolverine;
using Wolverine.Http;

namespace Herald.Tournaments.Features.StartCompetition;

// The revision on the owner's screen: a tournament that changed since is not started.
public sealed record StartCompetition(int ExpectedRevision);

public static class StartCompetitionEndpoint
{
    // Re-checks readiness from the projections (design D-2); Registration and Competition follow through the outbox (D-3).
    [WolverinePost("/api/organisations/{organisationId}/tournaments/{tournamentId}/competition/start")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("startCompetition")]
    [ProducesResponseType<TournamentDetails>(StatusCodes.Status200OK)]
    [ProducesResponseType<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json")]
    public static async Task<IResult> Post(
        Guid organisationId, Guid tournamentId, StartCompetition command, OrganisationContext context, TournamentsDbContext db, IMessageBus bus, CancellationToken cancellationToken)
    {
        var id = new TournamentId(tournamentId);
        if (await db.Tournaments.SingleOrDefaultAsync(tournament => tournament.Id == id, cancellationToken) is not { } tournament)
        {
            return TournamentResults.NotFound();
        }

        var actor = context.ActorId ?? throw new InvalidOperationException($"No acting person in organisation {organisationId}.");
        var result = tournament.Start(command.ExpectedRevision, await db.StartReadinessAsync(id, cancellationToken), actor, DateTimeOffset.UtcNow);
        return await db.SavedAsync(bus, organisationId, tournament, result, cancellationToken);
    }
}
