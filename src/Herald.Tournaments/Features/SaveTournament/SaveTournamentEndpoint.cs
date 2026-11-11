using Herald.ModuleHosting;
using Herald.Tournaments.Domain;
using Herald.Tournaments.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Wolverine.Http;

namespace Herald.Tournaments.Features.SaveTournament;

// The whole configuration replaces the stored one; the revision is the one the owner was looking at.
public sealed record SaveTournament(int ExpectedRevision, TournamentConfiguration Configuration);

public static class SaveTournamentEndpoint
{
    [WolverinePut("/api/organisations/{organisationId}/tournaments/{tournamentId}")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("saveTournament")]
    [ProducesResponseType<TournamentDetails>(StatusCodes.Status200OK)]
    [ProducesResponseType<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json")]
    public static async Task<IResult> Put(
        Guid organisationId, Guid tournamentId, SaveTournament command, OrganisationContext context, TournamentsDbContext db, CancellationToken cancellationToken)
    {
        var id = new TournamentId(tournamentId);
        if (await db.Tournaments.SingleOrDefaultAsync(tournament => tournament.Id == id, cancellationToken) is not { } tournament)
        {
            return TournamentResults.NotFound();
        }

        var actor = context.ActorId ?? throw new InvalidOperationException($"No acting person in organisation {organisationId}.");
        var result = tournament.Change(command.Configuration ?? new TournamentConfiguration(""), command.ExpectedRevision, actor, DateTimeOffset.UtcNow);
        return await db.SavedAsync(tournament, result, cancellationToken);
    }
}
