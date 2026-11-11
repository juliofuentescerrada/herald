using Herald.ModuleHosting;
using Microsoft.EntityFrameworkCore.Design;

namespace Herald.Registration.Persistence;

// Used only by the EF Core tools to build migrations.
public sealed class RegistrationDesignTimeFactory : IDesignTimeDbContextFactory<RegistrationDbContext>
{
    public RegistrationDbContext CreateDbContext(string[] args) =>
        new(ModuleDatabase.DesignTimeOptions<RegistrationDbContext>(RegistrationDbContext.Schema), new OrganisationContext());
}
