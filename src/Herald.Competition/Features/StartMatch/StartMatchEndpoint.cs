using Herald.BuildingBlocks;
using Herald.Competition.Persistence;
using Herald.ModuleHosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Wolverine;
using Wolverine.Http;

namespace Herald.Competition.Features.StartMatch;

public sealed record StartMatch(int ExpectedRevision);

public static class StartMatchEndpoint
{
    // Starts a match in any round; a team match's lineups are validated and locked (h1-match-lineups D-3).
    [WolverinePost("/api/organisations/{organisationId}/tournaments/{tournamentId}/matches/{matchId}/start")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("startMatch")]
    [OperationGroup(OperationGroup.Results)]
    [ProducesResponseType<MatchView>(StatusCodes.Status200OK)]
    [ProducesResponseType<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json")]
    [ProblemTypes(StatusCodes.Status409Conflict, MatchResults.RevisionConflict)]
    public static async Task<IResult> Post(
        Guid organisationId, Guid tournamentId, Guid matchId, StartMatch command, OrganisationContext context, CompetitionDbContext db, IMessageBus bus, CancellationToken cancellationToken)
    {
        var actor = context.ActorId ?? throw new InvalidOperationException($"No acting person in organisation {organisationId}.");
        return await db.WriteAsync(bus, organisationId, tournamentId, matchId,
            (match, schedule) => match.StartMatch(schedule.RosterOf(match.First), schedule.RosterOf(match.Second), command.ExpectedRevision, actor, DateTimeOffset.UtcNow, schedule.UnavailablePlayers),
            cancellationToken);
    }
}
