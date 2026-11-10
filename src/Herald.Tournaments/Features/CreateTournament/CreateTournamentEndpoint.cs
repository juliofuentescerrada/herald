using Herald.ModuleHosting;
using Herald.Tournaments.Domain;
using Herald.Tournaments.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Wolverine.Http;

namespace Herald.Tournaments.Features.CreateTournament;

// The client generates the identifier and keeps it for retries of the same attempt.
public sealed record CreateTournament(Guid TournamentId, TournamentConfiguration Configuration);

public static class CreateTournamentEndpoint
{
    [WolverinePost("/api/organisations/{organisationId}/tournaments")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("createTournament")]
    [ProducesResponseType<TournamentDetails>(StatusCodes.Status201Created)]
    [ProducesResponseType<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json")]
    public static async Task<IResult> Post(
        Guid organisationId, CreateTournament command, OrganisationContext context, TournamentsDbContext db, CancellationToken cancellationToken)
    {
        var configuration = (command.Configuration ?? new TournamentConfiguration("")).Normalised();
        var broken = configuration.Check().ToList();
        if (command.TournamentId == Guid.Empty)
        {
            broken.Add(new("tournamentId", "required"));
        }

        if (broken.Count > 0)
        {
            return TournamentResults.Rejected(broken);
        }

        var id = new TournamentId(command.TournamentId);
        if (await db.Tournaments.SingleOrDefaultAsync(tournament => tournament.Id == id, cancellationToken) is { } existing)
        {
            return existing.Repeats(configuration) ? Created(organisationId, existing) : Conflict();
        }

        var actor = context.ActorId ?? throw new InvalidOperationException("No acting person in the organisation context.");
        var created = Tournament.Draft(id, configuration, actor, DateTimeOffset.UtcNow);
        db.Tournaments.Add(created);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (exception.IsDuplicateKey())
        {
            // Another organisation's tournament, or a simultaneous attempt: nothing about the holder is revealed.
            // Forgotten, or the transaction's own save would try the insert again.
            db.Entry(created).State = EntityState.Detached;
            return Conflict();
        }

        return Created(organisationId, created);
    }

    private static IResult Created(Guid organisationId, Tournament tournament) => Results.Created(
        $"/api/organisations/{organisationId}/tournaments/{tournament.Id.Value}", TournamentDetails.Of(tournament));

    private static IResult Conflict() => Results.Problem(statusCode: StatusCodes.Status409Conflict, title: "Conflict");
}
