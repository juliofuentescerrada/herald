using Herald.BuildingBlocks;
using Herald.Organisations.Domain;
using Herald.Organisations.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Herald.Organisations.Features;

// A grant as the Applications page shows it. Tournaments are identifiers (null for all): their titles are the Tournaments module's.
public sealed record GrantDetails(
    Guid Id,
    string Name,
    Guid ApplicationId,
    IReadOnlyList<Guid>? Tournaments,
    IReadOnlyList<OperationGroup> Groups,
    string GrantedBy,
    DateTimeOffset GrantedAt,
    string? RevokedBy,
    DateTimeOffset? RevokedAt);

public static class GrantViews
{
    // The organisation's grants, newest first, with the people who granted and revoked them by display name.
    public static async Task<List<GrantDetails>> ListAsync(OrganisationsDbContext db, GrantId? only, CancellationToken cancellationToken)
    {
        var grants = await db.ApplicationGrants.AsNoTracking()
            .Where(grant => only == null || grant.Id == only)
            .OrderByDescending(grant => grant.GrantedAt)
            .ToListAsync(cancellationToken);
        var people = grants.SelectMany(grant => new[] { grant.GrantedBy, grant.RevokedBy ?? grant.GrantedBy }).Distinct().ToList();
        var names = await db.Persons.AsNoTracking()
            .Where(person => people.Contains(person.Id))
            .ToDictionaryAsync(person => person.Id, person => person.DisplayName, cancellationToken);
        return [.. grants.Select(grant => new GrantDetails(
            grant.Id.Value, grant.Name.Value, grant.Application.ObjectId, grant.Tournaments, grant.Groups,
            names.GetValueOrDefault(grant.GrantedBy, ""), grant.GrantedAt,
            grant.RevokedBy is { } by ? names.GetValueOrDefault(by, "") : null, grant.RevokedAt))];
    }
}
