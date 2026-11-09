using System.Security.Claims;
using Herald.ModuleHosting;
using Herald.Organisations.Domain;
using Herald.Organisations.Persistence;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Wolverine.Http;

namespace Herald.Organisations.Features.GetMe;

public sealed record SignedInPerson(string DisplayName, IReadOnlyList<OwnedOrganisation> Organisations);

public sealed record OwnedOrganisation(Guid Id, string Name);

public static class GetMeEndpoint
{
    [WolverineGet("/api/me")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("getMe")]
    public static async Task<SignedInPerson> Get(ClaimsPrincipal user, OrganisationsDbContext db, CancellationToken cancellationToken)
    {
        var caller = Caller.From(user)!;
        // Reviewed bypass: the person's own memberships, across the organisations they own.
        var organisations = await db.Organisations.IgnoreQueryFilters().AsNoTracking()
            .Where(organisation => organisation.Memberships.Any(membership => membership.Role == MembershipRole.Owner
                && db.Persons.Identified(caller).Any(person => person.Id == membership.PersonId)))
            .OrderBy(organisation => organisation.CreatedAt)
            .Select(organisation => new { organisation.Id, organisation.Name })
            .ToListAsync(cancellationToken);

        return new SignedInPerson(user.Identity?.Name ?? "", [.. organisations.Select(o => new OwnedOrganisation(o.Id.Value, o.Name.Value))]);
    }
}
