using Herald.ModuleHosting;
using Herald.Organisations.Domain;
using Herald.Organisations.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Wolverine.Http;

namespace Herald.Organisations.Features.GetOrganisation;

public sealed record OrganisationSummary(Guid Id, string Name);

public static class GetOrganisationEndpoint
{
    // The host's membership step has already answered 404 unless the caller belongs to this organisation.
    [WolverineGet("/api/organisations/{organisationId}")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("getOrganisation")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    public static async Task<OrganisationSummary> Get(Guid organisationId, OrganisationsDbContext db, CancellationToken cancellationToken)
    {
        var id = new OrganisationId(organisationId);
        var organisation = await db.Organisations.AsNoTracking()
            .Where(o => o.Id == id)
            .Select(o => new { o.Id, o.Name })
            .SingleAsync(cancellationToken);
        return new OrganisationSummary(organisation.Id.Value, organisation.Name.Value);
    }
}
