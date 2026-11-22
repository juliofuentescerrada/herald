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

namespace Herald.Tournaments.Features.ChangeDates;

// Only the dates present are selected; each is a local date-time of the reference time zone (§5.2).
public sealed record ChangeDates(int ExpectedRevision, DateTime? RegistrationOpensAt = null, DateTime? RegistrationClosesAt = null, DateTime? PlannedStartAt = null);

public static class ChangeDatesEndpoint
{
    // Before start, a published tournament's dates change only here, kept with their old and new values (design D-5).
    [WolverinePost("/api/organisations/{organisationId}/tournaments/{tournamentId}/dates")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("changeDates")]
    [OperationGroup(OperationGroup.Setup)]
    [ProducesResponseType<TournamentDetails>(StatusCodes.Status200OK)]
    [ProducesResponseType<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json")]
    [ProblemTypes(StatusCodes.Status409Conflict, TournamentResults.RevisionConflict)]
    public static async Task<IResult> Post(
        Guid organisationId, Guid tournamentId, ChangeDates command, OrganisationContext context, TournamentsDbContext db, IMessageBus bus, CancellationToken cancellationToken)
    {
        var id = new TournamentId(tournamentId);
        if (await db.Tournaments.SingleOrDefaultAsync(tournament => tournament.Id == id, cancellationToken) is not { } tournament)
        {
            return TournamentResults.NotFound();
        }

        var actor = context.ActorId ?? throw new InvalidOperationException($"No acting person in organisation {organisationId}.");
        var result = tournament.ChangeDates(
            new(command.RegistrationOpensAt, command.RegistrationClosesAt, command.PlannedStartAt), command.ExpectedRevision, actor, DateTimeOffset.UtcNow, context.ActorName);
        return await db.SavedAsync(bus, organisationId, tournament, result, cancellationToken);
    }
}
