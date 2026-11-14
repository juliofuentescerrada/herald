using System.Text.Json;
using Herald.Competition.Domain;
using Herald.ModuleHosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Herald.Competition.Persistence;

public sealed class CompetitionDbContext(DbContextOptions<CompetitionDbContext> options, OrganisationContext organisation)
    : OrganisationScopedDbContext(options, organisation)
{
    public const string Schema = "competition";

    public DbSet<Schedule> Schedules => Set<Schedule>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.MapModule(Schema);

        OrganisationOwned<Schedule>(modelBuilder);
        modelBuilder.Entity<Schedule>(schedule =>
        {
            schedule.Ignore(s => s.DomainEvents);
            schedule.Ignore(s => s.Current);
            schedule.Ignore(s => s.Blockers);
            schedule.Ignore(s => s.IsDraftStale);
            schedule.Ignore(s => s.DraftChange);
            schedule.Ignore(s => s.CrossedChange);
            schedule.Property(s => s.Id).HasConversion(id => id.Value, value => new TournamentId(value));
            // Two writes based on the same schedule cannot both succeed.
            schedule.Property(s => s.Revision).IsConcurrencyToken();
            // The field, the draft and the publications are read and written whole with their schedule:
            // documents, not rows (design D-1).
            Json(schedule.Property(s => s.Field));
            Json(schedule.Property(s => s.Draft));
            Json(schedule.Property(s => s.Publications));
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
