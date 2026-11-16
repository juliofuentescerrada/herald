using Herald.ModuleHosting;
using Herald.Organisations.Domain;
using Herald.Organisations.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Wolverine.Http;

namespace Herald.Organisations.Features.RevokeGrant;

public static class RevokeGrantEndpoint
{
    // Takes effect from the application's next request; a repeat keeps the first revocation.
    [WolverinePost("/api/organisations/{organisationId}/applications/{grantId}/revocation")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("revokeGrant")]
    [ProducesResponseType<GrantDetails>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    public static async Task<IResult> Post(
        Guid organisationId, Guid grantId, OrganisationContext context, OrganisationsDbContext db, CancellationToken cancellationToken)
    {
        var id = new GrantId(grantId);
        if (await db.ApplicationGrants.SingleOrDefaultAsync(grant => grant.Id == id, cancellationToken) is not { } grant)
        {
            return Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "Not found");
        }

        grant.Revoke(new PersonId(context.ActorId ?? throw new InvalidOperationException($"No acting person in organisation {organisationId}.")),
            DateTimeOffset.UtcNow);
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok((await GrantViews.ListAsync(db, id, cancellationToken)).Single());
    }
}
