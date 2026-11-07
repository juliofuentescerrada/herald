using Herald.ModuleHosting;
using Microsoft.EntityFrameworkCore;

namespace Herald.Architecture.Tests.Fixtures.Schemas;

public sealed class Score
{
    public Guid Id { get; init; }
}

// Its table and envelopes where they belong.
public sealed class CompliantContext(DbContextOptions<CompliantContext> options) : DbContext(options)
{
    public DbSet<Score> Scores => Set<Score>();

    protected override void OnModelCreating(ModelBuilder modelBuilder) => modelBuilder.MapModule("scoring");
}

// A table placed in another module's schema.
public sealed class ViolatingContext(DbContextOptions<ViolatingContext> options) : DbContext(options)
{
    public DbSet<Score> Scores => Set<Score>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.MapModule("scoring");
        modelBuilder.Entity<Score>().ToTable("Scores", "standings");
    }
}
