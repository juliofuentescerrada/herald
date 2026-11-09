using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace Herald.ModuleHosting;

// A module DbContext whose organisation-owned entities are filtered and stamped with the current
// organisation (ADR 0014). The organisation is a shadow property: the domain never sees it.
public abstract class OrganisationScopedDbContext(DbContextOptions options, OrganisationContext organisation) : DbContext(options)
{
    public const string OrganisationProperty = "OrganisationId";
    public const string OrganisationFilter = "organisation";

    // No context means Guid.Empty, which no row has: nothing instead of everything.
    // A DbContext member, so EF Core reads it per query instead of baking it into the cached model.
    protected Guid CurrentOrganisationId => organisation.OrganisationId ?? Guid.Empty;

    protected void OrganisationOwned<TEntity>(ModelBuilder modelBuilder)
        where TEntity : class
    {
        var entity = modelBuilder.Entity<TEntity>();
        entity.Property<Guid>(OrganisationProperty);
        entity.HasIndex(OrganisationProperty);
        entity.HasQueryFilter(OrganisationFilter, row => EF.Property<Guid>(row, OrganisationProperty) == CurrentOrganisationId);
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        ScopeChanges();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        ScopeChanges();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private void ScopeChanges()
    {
        foreach (var entry in ChangeTracker.Entries().Where(IsOrganisationOwned))
        {
            if (entry.State is not (EntityState.Added or EntityState.Modified or EntityState.Deleted))
            {
                continue;
            }

            var current = organisation.OrganisationId
                ?? throw new InvalidOperationException($"{entry.Metadata.DisplayName()} is organisation-owned and there is no organisation context.");
            var owner = entry.Property(OrganisationProperty);
            if (entry.State == EntityState.Added && (Guid)owner.CurrentValue! == Guid.Empty)
            {
                owner.CurrentValue = current;
            }
            else if ((Guid)owner.OriginalValue! != current || (Guid)owner.CurrentValue! != current)
            {
                throw new InvalidOperationException($"{entry.Metadata.DisplayName()} belongs to another organisation.");
            }
        }
    }

    private static bool IsOrganisationOwned(EntityEntry entry) =>
        entry.Metadata.FindProperty(OrganisationProperty)?.IsShadowProperty() == true;
}
