using Herald.ModuleHosting;
using Herald.Tournaments.Domain;
using Herald.Tournaments.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Wolverine;
using Wolverine.Http;

namespace Herald.Tournaments.Features.OpenRegistration;

// The revision on the owner's screen: a tournament that changed since is not changed.
public sealed record OpenRegistration(int ExpectedRevision);

public static class OpenRegistrationEndpoint
{
    // Opens or reopens, by the owner's action only: the announced dates are required, the clock is not read.
    [WolverinePost("/api/organisations/{organisationId}/tournaments/{tournamentId}/registration/opening")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("openRegistration")]
    [ProducesResponseType<TournamentDetails>(StatusCodes.Status200OK)]
    [ProducesResponseType<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json")]
    public static async Task<IResult> Post(
        Guid organisationId, Guid tournamentId, OpenRegistration command, OrganisationContext context, TournamentsDbContext db, IMessageBus bus, CancellationToken cancellationToken)
    {
        var id = new TournamentId(tournamentId);
        if (await db.Tournaments.SingleOrDefaultAsync(tournament => tournament.Id == id, cancellationToken) is not { } tournament)
        {
            return TournamentResults.NotFound();
        }

        var actor = context.ActorId ?? throw new InvalidOperationException($"No acting person in organisation {organisationId}.");
        var result = tournament.OpenRegistration(command.ExpectedRevision, actor, DateTimeOffset.UtcNow);
        return await db.SavedAsync(bus, organisationId, tournament, result, cancellationToken);
    }
}
