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

namespace Herald.Tournaments.Features.CancelTournament;

// The reason is required and private to the organisation (§5.1); the revision is the one on the owner's screen.
public sealed record CancelTournament(string? Reason, int ExpectedRevision);

public static class CancelTournamentEndpoint
{
    // Final: Registration and Competition apply it from TournamentCancelled, published in the same transaction (design D-1).
    [WolverinePost("/api/organisations/{organisationId}/tournaments/{tournamentId}/cancellation")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("cancelTournament")]
    [OperationGroup(OperationGroup.Setup)]
    [ProducesResponseType<TournamentDetails>(StatusCodes.Status200OK)]
    [ProducesResponseType<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json")]
    public static async Task<IResult> Post(
        Guid organisationId, Guid tournamentId, CancelTournament command, OrganisationContext context, TournamentsDbContext db, IMessageBus bus, CancellationToken cancellationToken)
    {
        var id = new TournamentId(tournamentId);
        if (await db.Tournaments.SingleOrDefaultAsync(tournament => tournament.Id == id, cancellationToken) is not { } tournament)
        {
            return TournamentResults.NotFound();
        }

        var actor = context.ActorId ?? throw new InvalidOperationException($"No acting person in organisation {organisationId}.");
        var result = tournament.Cancel(command.Reason, command.ExpectedRevision, actor, DateTimeOffset.UtcNow, context.ActorName);
        return await db.SavedAsync(bus, organisationId, tournament, result, cancellationToken);
    }
}
