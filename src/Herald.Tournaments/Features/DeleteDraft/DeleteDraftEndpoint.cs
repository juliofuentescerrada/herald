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

namespace Herald.Tournaments.Features.DeleteDraft;

public static class DeleteDraftEndpoint
{
    // A draft is removed whole; a later read is the ordinary not-found (design D-4). The revision travels in the query.
    [WolverineDelete("/api/organisations/{organisationId}/tournaments/{tournamentId}")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("deleteDraft")]
    [OperationGroup(OperationGroup.Setup)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json")]
    public static async Task<IResult> Delete(
        Guid organisationId, Guid tournamentId, [FromQuery] int expectedRevision, TournamentsDbContext db, CancellationToken cancellationToken)
    {
        var id = new TournamentId(tournamentId);
        if (await db.Tournaments.SingleOrDefaultAsync(tournament => tournament.Id == id, cancellationToken) is not { } tournament)
        {
            return TournamentResults.NotFound();
        }

        var result = tournament.CanDelete(expectedRevision);
        switch (result.Outcome)
        {
            case WriteOutcome.Rejected:
                return TournamentResults.Rejected(result.Broken);
            case WriteOutcome.Stale:
                return TournamentResults.Stale(tournament.Revision, await db.DetailsAsync(tournament, cancellationToken));
        }

        db.Tournaments.Remove(tournament);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return TournamentResults.Stale(tournament.Revision);
        }

        return Results.NoContent();
    }
}
