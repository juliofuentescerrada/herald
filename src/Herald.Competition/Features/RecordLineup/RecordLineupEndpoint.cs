using Herald.BuildingBlocks;
using Herald.Competition.Domain;
using Herald.Competition.Persistence;
using Herald.ModuleHosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Wolverine;
using Wolverine.Http;

namespace Herald.Competition.Features.RecordLineup;

public sealed record RecordLineup(int ExpectedRevision, IReadOnlyList<Guid> Players);

public static class RecordLineupEndpoint
{
    // Records a side's lineup as a new revision; repeating the current one changes nothing (h1-match-lineups D-2).
    [WolverinePut("/api/organisations/{organisationId}/tournaments/{tournamentId}/matches/{matchId}/lineups/{side}")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("recordLineup")]
    [OperationGroup(OperationGroup.Results)]
    [ProducesResponseType<MatchView>(StatusCodes.Status200OK)]
    [ProducesResponseType<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json")]
    public static async Task<IResult> Put(
        Guid organisationId, Guid tournamentId, Guid matchId, string side, RecordLineup command, OrganisationContext context, CompetitionDbContext db, IMessageBus bus, CancellationToken cancellationToken)
    {
        // The route names the side in the API's casing: first or second.
        Side? chosen = side switch { "first" => Side.First, "second" => Side.Second, _ => null };
        if (chosen is not { } which)
        {
            return ScheduleResults.NotFound();
        }

        var actor = context.ActorId ?? throw new InvalidOperationException($"No acting person in organisation {organisationId}.");
        return await db.WriteAsync(bus, organisationId, tournamentId, matchId,
            (match, schedule) => match.RecordLineup(which, command.Players, schedule.RosterOf(match.EntryOf(which)), command.ExpectedRevision, actor, DateTimeOffset.UtcNow, schedule.UnavailablePlayers),
            cancellationToken);
    }
}
