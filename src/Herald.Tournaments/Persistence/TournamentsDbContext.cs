using Herald.ModuleHosting;
using Microsoft.EntityFrameworkCore;

namespace Herald.Tournaments.Persistence;

public sealed class TournamentsDbContext(DbContextOptions<TournamentsDbContext> options) : DbContext(options)
{
    public const string Schema = "tournaments";

    protected override void OnModelCreating(ModelBuilder modelBuilder) => modelBuilder.MapModule(Schema);
}
