using Herald.ModuleHosting;
using Microsoft.EntityFrameworkCore;

namespace Herald.Standings.Persistence;

public sealed class StandingsDbContext(DbContextOptions<StandingsDbContext> options) : DbContext(options)
{
    public const string Schema = "standings";

    protected override void OnModelCreating(ModelBuilder modelBuilder) => modelBuilder.MapModule(Schema);
}
