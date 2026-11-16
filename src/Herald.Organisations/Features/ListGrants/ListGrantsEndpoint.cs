using Herald.ModuleHosting;
using Herald.Organisations.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Wolverine.Http;

namespace Herald.Organisations.Features.ListGrants;

public static class ListGrantsEndpoint
{
    [WolverineGet("/api/organisations/{organisationId}/applications")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("listGrants")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    public static async Task<IReadOnlyList<GrantDetails>> Get(Guid organisationId, OrganisationsDbContext db, CancellationToken cancellationToken) =>
        // shortcut: no paging, a pilot organisation has a handful of grants; add it with H5's application console.
        await GrantViews.ListAsync(db, null, cancellationToken);
}
