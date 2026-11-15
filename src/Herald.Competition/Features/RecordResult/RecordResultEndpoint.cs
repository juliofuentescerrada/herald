using Herald.Competition.Domain;
using Herald.Competition.Persistence;
using Herald.ModuleHosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Wolverine.Http;

namespace Herald.Competition.Features.RecordResult;

// OperationId lets a retried result return the one already recorded (match-results: A double submission).
public sealed record RecordResult(Guid OperationId, int ExpectedRevision, Outcome Outcome);

public static class RecordResultEndpoint
{
    // Records the match's one effective played result (h1-operator-results D-1).
    [WolverinePost("/api/organisations/{organisationId}/tournaments/{tournamentId}/matches/{matchId}/result")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("recordResult")]
    [ProducesResponseType<MatchView>(StatusCodes.Status200OK)]
    [ProducesResponseType<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json")]
    public static async Task<IResult> Post(
        Guid organisationId, Guid tournamentId, Guid matchId, RecordResult command, OrganisationContext context, CompetitionDbContext db, CancellationToken cancellationToken)
    {
        var actor = context.ActorId ?? throw new InvalidOperationException($"No acting person in organisation {organisationId}.");
        return await db.WriteAsync(tournamentId, matchId,
            (match, _) => match.RecordPlayed(command.OperationId, command.Outcome, command.ExpectedRevision, actor, DateTimeOffset.UtcNow),
            cancellationToken);
    }
}
