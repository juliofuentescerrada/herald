using System.Text.Json;
using Herald.ModuleHosting;
using Herald.Standings.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace Herald.Standings.Persistence;

public sealed class StandingsDbContext(DbContextOptions<StandingsDbContext> options, OrganisationContext organisation)
    : OrganisationScopedDbContext(options, organisation)
{
    public const string Schema = "standings";

    private static readonly JsonSerializerOptions _json = new(JsonSerializerDefaults.Web);

    public DbSet<TournamentResults> Results => Set<TournamentResults>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.MapModule(Schema);
        modelBuilder.MapReceipts();
        OrganisationOwned<Receipt>(modelBuilder);

        OrganisationOwned<TournamentResults>(modelBuilder);
        modelBuilder.Entity<TournamentResults>(results =>
        {
            results.Ignore(r => r.DomainEvents);
            results.Ignore(r => r.Final);
            results.Ignore(r => r.NoChampion);
            results.Property(r => r.Finals)
                .HasColumnType("jsonb")
                .HasConversion(
                    value => JsonSerializer.Serialize(value, _json),
                    text => JsonSerializer.Deserialize<IReadOnlyList<FinalRevision>>(text, _json)!,
                    new ValueComparer<IReadOnlyList<FinalRevision>>(
                        (left, right) => JsonSerializer.Serialize(left, _json) == JsonSerializer.Serialize(right, _json),
                        value => JsonSerializer.Serialize(value, _json).GetHashCode(),
                        value => JsonSerializer.Deserialize<IReadOnlyList<FinalRevision>>(JsonSerializer.Serialize(value, _json), _json)!));
            results.Property(r => r.Id).HasConversion(id => id.Value, value => new TournamentId(value));
            // Two snapshots applied at once cannot both win.
            results.Property(r => r.Revision).IsConcurrencyToken();
            // A finalisation and its reopening saved at once cannot both win either: PostgreSQL's row version (h1-finalisation D-4).
            results.Property<uint>("xmin").IsRowVersion();
            // The latest snapshot is the whole input of the table: a document, not rows (D-2).
            results.Property(r => r.Snapshot)
                .HasColumnType("jsonb")
                .HasConversion(
                    value => JsonSerializer.Serialize(value, _json),
                    text => JsonSerializer.Deserialize<ResultsSnapshot>(text, _json)!,
                    new ValueComparer<ResultsSnapshot>(
                        (left, right) => JsonSerializer.Serialize(left, _json) == JsonSerializer.Serialize(right, _json),
                        value => JsonSerializer.Serialize(value, _json).GetHashCode(),
                        value => JsonSerializer.Deserialize<ResultsSnapshot>(JsonSerializer.Serialize(value, _json), _json)!));
        });
    }
}
