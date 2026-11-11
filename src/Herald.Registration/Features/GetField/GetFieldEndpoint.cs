using Herald.ModuleHosting;
using Herald.Registration.Domain;
using Herald.Registration.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Wolverine.Http;

namespace Herald.Registration.Features.GetField;

public static class GetFieldEndpoint
{
    // A tournament has a field once Registration has its terms, from its publication on.
    [WolverineGet("/api/organisations/{organisationId}/tournaments/{tournamentId}/entries")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("getField")]
    [ProducesResponseType<FieldDetails>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    public static async Task<IResult> Get(Guid organisationId, Guid tournamentId, RegistrationDbContext db, CancellationToken cancellationToken)
    {
        var id = new TournamentId(tournamentId);
        return await db.Fields.AsNoTracking().SingleOrDefaultAsync(field => field.Id == id, cancellationToken) is { } field
            ? Results.Ok(await FieldDetails.OfAsync(field, db, cancellationToken))
            : FieldResults.NotFound();
    }
}
