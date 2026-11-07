using Herald.ModuleHosting;
using Microsoft.EntityFrameworkCore.Design;

namespace Herald.Competition.Persistence;

// Used only by the EF Core tools to build migrations.
public sealed class CompetitionDesignTimeFactory : IDesignTimeDbContextFactory<CompetitionDbContext>
{
    public CompetitionDbContext CreateDbContext(string[] args) => new(ModuleDatabase.DesignTimeOptions<CompetitionDbContext>(CompetitionDbContext.Schema));
}
