using Herald.ModuleHosting;
using Herald.Tournaments.Domain;
using Microsoft.EntityFrameworkCore;

namespace Herald.Tournaments.Persistence;

public sealed class TournamentsDbContext(DbContextOptions<TournamentsDbContext> options, OrganisationContext organisation)
    : OrganisationScopedDbContext(options, organisation)
{
    public const string Schema = "tournaments";

    // Local to the tournament's reference time zone (design D-2).
    private const string LocalDateTime = "timestamp without time zone";

    public DbSet<Tournament> Tournaments => Set<Tournament>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.MapModule(Schema);

        OrganisationOwned<Tournament>(modelBuilder);
        modelBuilder.Entity<Tournament>(tournament =>
        {
            tournament.Ignore(t => t.DomainEvents);
            tournament.Property(t => t.Id).HasConversion(id => id.Value, value => new TournamentId(value));
            tournament.Property(t => t.Publication).HasConversion<string>().HasMaxLength(20);
            tournament.Property(t => t.Registration).HasConversion<string>().HasMaxLength(20);
            // Two writes based on the same revision cannot both succeed.
            tournament.Property(t => t.Revision).IsConcurrencyToken();
            tournament.HasIndex(OrganisationProperty, nameof(Tournament.CreatedAt));
            tournament.ComplexProperty(t => t.Configuration, configuration =>
            {
                configuration.Property(c => c.Title).HasMaxLength(TournamentConfiguration.TitleMaxLength);
                configuration.Property(c => c.GameVariant).HasMaxLength(TournamentConfiguration.GameVariantMaxLength);
                configuration.Property(c => c.Venue).HasMaxLength(TournamentConfiguration.VenueMaxLength);
                configuration.Property(c => c.TimeZone).HasMaxLength(TournamentConfiguration.TimeZoneMaxLength);
                configuration.Property(c => c.EntryKind).HasConversion<string>().HasMaxLength(20);
                configuration.Property(c => c.Location).HasConversion<string>().HasMaxLength(20);
                configuration.Property(c => c.Admission).HasConversion<string>().HasMaxLength(20);
                configuration.Property(c => c.CheckIn).HasConversion<string>().HasMaxLength(20);
                configuration.Property(c => c.Visibility).HasConversion<string>().HasMaxLength(20);
                configuration.Property(c => c.RegistrationOpensAt).HasColumnType(LocalDateTime);
                configuration.Property(c => c.RegistrationClosesAt).HasColumnType(LocalDateTime);
                configuration.Property(c => c.PlannedStartAt).HasColumnType(LocalDateTime);
            });
        });
    }
}
