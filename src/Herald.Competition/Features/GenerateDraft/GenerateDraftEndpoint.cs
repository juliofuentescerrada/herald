using Herald.Competition.Domain;
using Herald.Competition.Persistence;
using Herald.ModuleHosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Wolverine;
using Wolverine.Http;

namespace Herald.Competition.Features.GenerateDraft;

// The operation identity makes a retry return the same draft; the revision is the one on the owner's screen (D-8).
public sealed record GenerateDraft(Guid OperationId, int ExpectedRevision, Seeding Seeding);

public static class GenerateDraftEndpoint
{
    // Generates or regenerates the draft; it sends nothing and creates no result (F-06).
    [WolverinePost("/api/organisations/{organisationId}/tournaments/{tournamentId}/schedule/draft")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("generateDraft")]
    [ProducesResponseType<ScheduleDetails>(StatusCodes.Status200OK)]
    [ProducesResponseType<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json")]
    public static async Task<IResult> Post(
        Guid organisationId, Guid tournamentId, GenerateDraft command, OrganisationContext context, CompetitionDbContext db, IMessageBus bus, CancellationToken cancellationToken)
    {
        var actor = context.ActorId ?? throw new InvalidOperationException($"No acting person in organisation {organisationId}.");
        // The draw's seed is chosen here and recorded with the draft, so the domain stays deterministic (D-6).
        int? seed = command.Seeding == Seeding.Draw ? Random.Shared.Next() : null;
        return await db.WriteAsync(bus, organisationId, tournamentId,
            schedule => schedule.Generate(command.OperationId, command.Seeding, seed, command.ExpectedRevision, actor, DateTimeOffset.UtcNow), cancellationToken);
    }
}
