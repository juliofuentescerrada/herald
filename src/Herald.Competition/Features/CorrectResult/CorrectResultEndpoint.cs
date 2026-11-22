using Herald.BuildingBlocks;
using Herald.Competition.Domain;
using Herald.Competition.Persistence;
using Herald.ModuleHosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Wolverine;
using Wolverine.Http;

namespace Herald.Competition.Features.CorrectResult;

// The new result in RecordResult's terms, the correction's reason (private to the organisation) and the match revision the owner
// reviewed; OperationId lets a retried correction return the one already applied (result-corrections: A lost response).
public sealed record CorrectResult(
    Guid OperationId, int ExpectedRevision, string? CorrectionReason, Cause Cause = Cause.Played, Outcome? Outcome = null, Side? Entrant = null,
    bool? Played = null, string? Reason = null);

public static class CorrectResultEndpoint
{
    // Replaces the match's effective result, keeping the replaced one (h1-safe-corrections D-1, D-2).
    [WolverinePost("/api/organisations/{organisationId}/tournaments/{tournamentId}/matches/{matchId}/result/correction")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("correctResult")]
    [OperationGroup(OperationGroup.Results)]
    [ProducesResponseType<MatchView>(StatusCodes.Status200OK)]
    [ProducesResponseType<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json")]
    [ProblemTypes(StatusCodes.Status409Conflict, MatchResults.RevisionConflict)]
    public static async Task<IResult> Post(
        Guid organisationId, Guid tournamentId, Guid matchId, CorrectResult command, OrganisationContext context, CompetitionDbContext db, IMessageBus bus, CancellationToken cancellationToken)
    {
        var actor = context.ActorId ?? throw new InvalidOperationException($"No acting person in organisation {organisationId}.");
        return await db.WriteAsync(bus, organisationId, tournamentId, matchId,
            (match, _) => match.Correct(
                command.OperationId, command.Cause, command.Outcome, command.Entrant, command.Played, command.Reason, command.CorrectionReason,
                command.ExpectedRevision, actor, DateTimeOffset.UtcNow, context.ActorName),
            cancellationToken);
    }
}
