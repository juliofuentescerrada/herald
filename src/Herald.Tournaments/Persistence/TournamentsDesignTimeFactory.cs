using Herald.ModuleHosting;
using Microsoft.EntityFrameworkCore.Design;

namespace Herald.Tournaments.Persistence;

// Used only by the EF Core tools to build migrations.
public sealed class TournamentsDesignTimeFactory : IDesignTimeDbContextFactory<TournamentsDbContext>
{
    public TournamentsDbContext CreateDbContext(string[] args) => new(ModuleDatabase.DesignTimeOptions<TournamentsDbContext>(TournamentsDbContext.Schema));
}
