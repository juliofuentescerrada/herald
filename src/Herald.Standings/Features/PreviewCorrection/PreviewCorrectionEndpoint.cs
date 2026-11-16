using Herald.BuildingBlocks;
using Herald.ModuleHosting;
using Herald.Standings.Domain;
using Herald.Standings.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Wolverine.Http;

namespace Herald.Standings.Features.PreviewCorrection;

public sealed record PreviewEntrant(
    Guid EntryId, string Name, EntrantStatus Status, int PointsBefore, int PointsAfter, int PositionBefore, bool SharedBefore, int PositionAfter, bool SharedAfter);

// Revision is the results revision the preview was computed on; Updating says Standings holds another revision of the match
// (MatchRevision) than the one reviewed, so the form waits for a refresh (h1-safe-corrections D-3).
public sealed record CorrectionPreviewView(Guid TournamentId, int Revision, bool Updating, int? MatchRevision, IReadOnlyList<PreviewEntrant> Entrants);

public static class PreviewCorrectionEndpoint
{
    // A query with no state: confirming is Competition's CorrectResult, which checks the match revision itself.
    [WolverineGet("/api/organisations/{organisationId}/tournaments/{tournamentId}/standings/preview")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("previewCorrection")]
    [OperationGroup(OperationGroup.Results)]
    [ProducesResponseType<CorrectionPreviewView>(StatusCodes.Status200OK)]
    [ProducesResponseType<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    public static async Task<IResult> Get(
        Guid organisationId, Guid tournamentId, Guid match, int matchRevision, string outcome, string cause, StandingsDbContext db, CancellationToken cancellationToken)
    {
        // Competition's outcome and cause names, as the match's result carries them.
        if (!Enum.TryParse<Outcome>(outcome, ignoreCase: true, out var proposed) || !Enum.IsDefined(proposed) || string.IsNullOrWhiteSpace(cause))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]> { [string.IsNullOrWhiteSpace(cause) ? "cause" : "outcome"] = ["unknown"] });
        }

        var id = new TournamentId(tournamentId);
        if (await db.Results.AsNoTracking().SingleOrDefaultAsync(results => results.Id == id, cancellationToken) is not { } results
            || results.Preview(match, matchRevision, proposed, cause) is not { } preview)
        {
            // The same answer for another organisation's tournament or match.
            return Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "Not found");
        }

        return Results.Ok(new CorrectionPreviewView(
            tournamentId,
            preview.Revision,
            preview.Updating,
            preview.MatchRevision,
            [.. preview.Entrants.Select(line => new PreviewEntrant(
                line.Entrant.EntryId, line.Entrant.Name, line.Entrant.Status, line.PointsBefore, line.PointsAfter, line.PositionBefore, line.SharedBefore,
                line.PositionAfter, line.SharedAfter))]));
    }
}
