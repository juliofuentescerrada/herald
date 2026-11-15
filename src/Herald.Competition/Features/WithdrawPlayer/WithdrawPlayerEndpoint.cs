using Herald.Competition.Persistence;
using Herald.ModuleHosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Wolverine;
using Wolverine.Http;

namespace Herald.Competition.Features.WithdrawPlayer;

public sealed record WithdrawPlayer(int ExpectedRevision, string? Reason = null);

public static class WithdrawPlayerEndpoint
{
    // Records a frozen-roster player's withdrawal from the tournament, which is final (h1-round-operations D-3).
    [WolverinePost("/api/organisations/{organisationId}/tournaments/{tournamentId}/entrants/{entryId}/players/{playerId}/withdrawal")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("withdrawPlayer")]
    [ProducesResponseType<ScheduleDetails>(StatusCodes.Status200OK)]
    [ProducesResponseType<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json")]
    public static async Task<IResult> Post(
        Guid organisationId, Guid tournamentId, Guid entryId, Guid playerId, WithdrawPlayer command, OrganisationContext context, CompetitionDbContext db, IMessageBus bus, CancellationToken cancellationToken)
    {
        var actor = context.ActorId ?? throw new InvalidOperationException($"No acting person in organisation {organisationId}.");
        return await db.WriteAsync(bus, organisationId, tournamentId,
            schedule => schedule.WithdrawPlayer(entryId, playerId, command.Reason, command.ExpectedRevision, actor, DateTimeOffset.UtcNow), cancellationToken);
    }
}
