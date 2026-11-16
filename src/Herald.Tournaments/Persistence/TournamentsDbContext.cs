using System.Text.Json;
using Herald.ModuleHosting;
using Herald.Tournaments.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Herald.Tournaments.Persistence;

public sealed class TournamentsDbContext(DbContextOptions<TournamentsDbContext> options, OrganisationContext organisation)
    : OrganisationScopedDbContext(options, organisation)
{
    public const string Schema = "tournaments";

    // Local to the tournament's reference time zone (design D-2).
    private const string LocalDateTime = "timestamp without time zone";

    public DbSet<Tournament> Tournaments => Set<Tournament>();

    public DbSet<FieldCounts> FieldCounts => Set<FieldCounts>();

    public DbSet<ScheduleState> Schedules => Set<ScheduleState>();

    // Whether Competition last reported a published schedule: it locks the field and reopening (D-4).
    public Task<bool> SchedulePublishedAsync(TournamentId id, CancellationToken cancellationToken) =>
        Schedules.AsNoTracking().AnyAsync(schedule => schedule.TournamentId == id && schedule.PublishedRevision != null, cancellationToken);

    // Registration's last report for the tournament, or none before its first.
    public async Task<EntryCounts> EntryCountsAsync(TournamentId id, CancellationToken cancellationToken) =>
        await FieldCounts.AsNoTracking().Where(counts => counts.TournamentId == id)
            .Select(counts => new EntryCounts(counts.Admitted, counts.Waiting, counts.CheckedIn))
            .SingleOrDefaultAsync(cancellationToken);

    // The start conditions as the projections last saw them (h1-competition-start D-2).
    public async Task<StartReadiness> StartReadinessAsync(TournamentId id, CancellationToken cancellationToken)
    {
        var counts = await FieldCounts.AsNoTracking().SingleOrDefaultAsync(counts => counts.TournamentId == id, cancellationToken);
        var schedule = await Schedules.AsNoTracking().SingleOrDefaultAsync(schedule => schedule.TournamentId == id, cancellationToken);
        return new(
            counts?.EligibleRevision,
            counts?.Eligible,
            counts?.Pending,
            counts?.RostersOutsideBounds,
            counts?.SharedMemberNames,
            schedule?.PublishedRevision,
            schedule?.EligibleRevision);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.MapModule(Schema);

        OrganisationOwned<Tournament>(modelBuilder);
        modelBuilder.Entity<Tournament>(tournament =>
        {
            tournament.Ignore(t => t.DomainEvents);
            tournament.Ignore(t => t.IsStarted);
            tournament.Property(t => t.Id).HasConversion(id => id.Value, value => new TournamentId(value));
            tournament.Property(t => t.Publication).HasConversion<string>().HasMaxLength(20);
            tournament.Property(t => t.Registration).HasConversion<string>().HasMaxLength(20);
            tournament.Property(t => t.Competition).HasConversion<string>().HasMaxLength(20);
            // Two writes based on the same revision cannot both succeed.
            tournament.Property(t => t.Revision).IsConcurrencyToken();
            // The schedule's lock bumps only the terms sequence: two snapshots must never share a number (ADR 0016).
            tournament.Property(t => t.TermsRevision).IsConcurrencyToken();
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

        modelBuilder.Entity<FieldCounts>(counts =>
        {
            counts.HasKey(c => c.TournamentId);
            counts.Property(c => c.TournamentId).HasConversion(id => id.Value, value => new TournamentId(value));
            counts.Ignore(c => c.Counts);
            Json(counts.Property(c => c.RostersOutsideBounds));
            Json(counts.Property(c => c.SharedMemberNames));
        });

        modelBuilder.Entity<ScheduleState>(schedule =>
        {
            schedule.HasKey(s => s.TournamentId);
            schedule.Property(s => s.TournamentId).HasConversion(id => id.Value, value => new TournamentId(value));
        });
    }

    private static readonly JsonSerializerOptions _json = new(JsonSerializerDefaults.Web);

    private static void Json<T>(PropertyBuilder<T> property) => property
        .HasColumnType("jsonb")
        .HasConversion(
            value => JsonSerializer.Serialize(value, _json),
            text => JsonSerializer.Deserialize<T>(text, _json)!,
            new ValueComparer<T>(
                (left, right) => JsonSerializer.Serialize(left, _json) == JsonSerializer.Serialize(right, _json),
                value => JsonSerializer.Serialize(value, _json).GetHashCode(),
                value => JsonSerializer.Deserialize<T>(JsonSerializer.Serialize(value, _json), _json)!));
}
