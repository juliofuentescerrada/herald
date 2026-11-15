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

    public DbSet<Match> Matches => Set<Match>();

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
            schedule.Ignore(s => s.StartedPairings);
            schedule.Property(s => s.Id).HasConversion(id => id.Value, value => new TournamentId(value));
            // Two writes based on the same schedule cannot both succeed.
            schedule.Property(s => s.Revision).IsConcurrencyToken();
            // The field, the draft and the publications are read and written whole with their schedule:
            // documents, not rows (design D-1).
            Json(schedule.Property(s => s.Field));
            Json(schedule.Property(s => s.Draft));
            Json(schedule.Property(s => s.Publications));
            Json(schedule.Property(s => s.Rosters));
        });

        OrganisationOwned<Match>(modelBuilder);
        modelBuilder.Entity<Match>(match =>
        {
            match.Ignore(m => m.DomainEvents);
            match.Ignore(m => m.State);
            match.Ignore(m => m.IsTeamMatch);
            match.Property(m => m.Id).HasConversion(id => id.Value, value => new MatchId(value));
            match.Property(m => m.TournamentId).HasConversion(id => id.Value, value => new TournamentId(value));
            match.HasIndex(m => m.TournamentId);
            match.Property(m => m.Revision).IsConcurrencyToken();
            // A match's lineups and start are read and written whole with it.
            Json(match.Property(m => m.FirstLineups));
            Json(match.Property(m => m.SecondLineups));
            Json(match.Property(m => m.Start));
            Json(match.Property(m => m.Resolution));
        });
    }

    // Once per tournament: the started revision's pairings become matches, unless they already did (h1-match-lineups D-1).
    public async Task ScheduleMatchesAsync(Schedule schedule, CancellationToken cancellationToken)
    {
        if (schedule.StartedPairings is not null && !await Matches.AnyAsync(match => match.TournamentId == schedule.Id, cancellationToken))
        {
            Matches.AddRange(schedule.ScheduleMatches());
        }
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
