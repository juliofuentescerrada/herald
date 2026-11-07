using Herald.ModuleHosting;
using Microsoft.EntityFrameworkCore;

namespace Herald.Competition.Persistence;

public sealed class CompetitionDbContext(DbContextOptions<CompetitionDbContext> options) : DbContext(options)
{
    public const string Schema = "competition";

    protected override void OnModelCreating(ModelBuilder modelBuilder) => modelBuilder.MapModule(Schema);
}
