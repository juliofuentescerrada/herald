using Herald.Competition.Domain;
using Herald.Competition.Persistence;
using Herald.ModuleHosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Wolverine.Http;

namespace Herald.Competition.Features.RecordResult;

// OperationId lets a retried result return the one already recorded (match-results: A double submission). A played result names
// its outcome; the other causes name the conceding or absent entrant, whether play took place and a no contest's reason (D-1).
public sealed record RecordResult(
    Guid OperationId, int ExpectedRevision, Outcome? Outcome = null, Cause Cause = Cause.Played, Side? Entrant = null, bool? Played = null, string? Reason = null);

public static class RecordResultEndpoint
{
    // Records the match's one effective result, played or administrative (h1-operator-results D-1, h1-exceptional-outcomes D-1).
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
            (match, _) => command.Cause == Cause.Played
                ? command.Outcome is { } outcome
                    ? match.RecordPlayed(command.OperationId, outcome, command.ExpectedRevision, actor, DateTimeOffset.UtcNow)
                    : WriteResult.Reject("outcome", "required")
                : match.RecordAdministrative(
                    command.OperationId, command.Cause, command.Entrant, command.Played, command.Reason, command.ExpectedRevision, actor, DateTimeOffset.UtcNow),
            cancellationToken);
    }
}
