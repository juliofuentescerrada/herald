using Herald.ModuleHosting;
using Herald.Registration.Domain;
using Herald.Registration.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Wolverine.Http;

namespace Herald.Registration.Features.GetRoster;

public static class GetRosterEndpoint
{
    // Every entry of a team tournament has a roster, a cancelled one's included; an individual tournament has none.
    [WolverineGet("/api/organisations/{organisationId}/tournaments/{tournamentId}/entries/{entryId}/roster")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("getRoster")]
    [ProducesResponseType<RosterDetails>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    public static async Task<IResult> Get(Guid organisationId, Guid tournamentId, Guid entryId, RegistrationDbContext db, CancellationToken cancellationToken)
    {
        var id = new TournamentId(tournamentId);
        return await db.Fields.AsNoTracking().SingleOrDefaultAsync(field => field.Id == id, cancellationToken) is { Terms.EntryKind: EntryKind.Team } field
            && field.Find(new EntryId(entryId)) is { } entry
            ? Results.Ok(await RosterDetails.OfAsync(field, entry, db, cancellationToken))
            : FieldResults.NotFound();
    }
}
