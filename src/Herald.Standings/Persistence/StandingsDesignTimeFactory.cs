using Herald.ModuleHosting;
using Microsoft.EntityFrameworkCore.Design;

namespace Herald.Standings.Persistence;

// Used only by the EF Core tools to build migrations.
public sealed class StandingsDesignTimeFactory : IDesignTimeDbContextFactory<StandingsDbContext>
{
    public StandingsDbContext CreateDbContext(string[] args) => new(ModuleDatabase.DesignTimeOptions<StandingsDbContext>(StandingsDbContext.Schema));
}
