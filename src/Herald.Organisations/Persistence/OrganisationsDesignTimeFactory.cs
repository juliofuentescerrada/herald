using Herald.ModuleHosting;
using Microsoft.EntityFrameworkCore.Design;

namespace Herald.Organisations.Persistence;

// Used only by the EF Core tools to build migrations.
public sealed class OrganisationsDesignTimeFactory : IDesignTimeDbContextFactory<OrganisationsDbContext>
{
    public OrganisationsDbContext CreateDbContext(string[] args) => new(ModuleDatabase.DesignTimeOptions<OrganisationsDbContext>(OrganisationsDbContext.Schema));
}
