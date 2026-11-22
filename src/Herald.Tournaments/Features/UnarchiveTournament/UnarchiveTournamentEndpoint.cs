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

namespace Herald.Tournaments.Features.UnarchiveTournament;

public sealed record UnarchiveTournament(int ExpectedRevision);

public static class UnarchiveTournamentEndpoint
{
    // Back in the default list with its state; a finalised competition can then be reopened (design D-3).
    [WolverinePost("/api/organisations/{organisationId}/tournaments/{tournamentId}/unarchiving")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("unarchiveTournament")]
    [OperationGroup(OperationGroup.Setup)]
    [ProducesResponseType<TournamentDetails>(StatusCodes.Status200OK)]
    [ProducesResponseType<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json")]
    public static async Task<IResult> Post(
        Guid organisationId, Guid tournamentId, UnarchiveTournament command, OrganisationContext context, TournamentsDbContext db, IMessageBus bus, CancellationToken cancellationToken)
    {
        var id = new TournamentId(tournamentId);
        if (await db.Tournaments.SingleOrDefaultAsync(tournament => tournament.Id == id, cancellationToken) is not { } tournament)
        {
            return TournamentResults.NotFound();
        }

        var actor = context.ActorId ?? throw new InvalidOperationException($"No acting person in organisation {organisationId}.");
        var result = tournament.Archive(archived: false, command.ExpectedRevision, actor, DateTimeOffset.UtcNow);
        return await db.SavedAsync(bus, organisationId, tournament, result, cancellationToken);
    }
}
