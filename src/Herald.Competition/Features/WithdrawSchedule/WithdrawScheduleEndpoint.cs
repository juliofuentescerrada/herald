using Herald.Competition.Persistence;
using Herald.ModuleHosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Wolverine;
using Wolverine.Http;

namespace Herald.Competition.Features.WithdrawSchedule;

public sealed record WithdrawSchedule(int ExpectedRevision, string? Reason);

public static class WithdrawScheduleEndpoint
{
    // Withdraws the published revision with a reason; it stays in the history and returns as the draft.
    [WolverinePost("/api/organisations/{organisationId}/tournaments/{tournamentId}/schedule/withdrawal")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("withdrawSchedule")]
    [ProducesResponseType<ScheduleDetails>(StatusCodes.Status200OK)]
    [ProducesResponseType<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json")]
    public static async Task<IResult> Post(
        Guid organisationId, Guid tournamentId, WithdrawSchedule command, OrganisationContext context, CompetitionDbContext db, IMessageBus bus, CancellationToken cancellationToken)
    {
        var actor = context.ActorId ?? throw new InvalidOperationException($"No acting person in organisation {organisationId}.");
        return await db.WriteAsync(bus, organisationId, tournamentId,
            schedule => schedule.Withdraw(command.ExpectedRevision, command.Reason, actor, DateTimeOffset.UtcNow), cancellationToken);
    }
}
