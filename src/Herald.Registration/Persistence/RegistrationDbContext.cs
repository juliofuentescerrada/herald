using Herald.ModuleHosting;
using Herald.Registration.Domain;
using Microsoft.EntityFrameworkCore;

namespace Herald.Registration.Persistence;

public sealed class RegistrationDbContext(DbContextOptions<RegistrationDbContext> options, OrganisationContext organisation)
    : OrganisationScopedDbContext(options, organisation)
{
    public const string Schema = "registration";

    public DbSet<Guest> Guests => Set<Guest>();

    public DbSet<Field> Fields => Set<Field>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.MapModule(Schema);

        OrganisationOwned<Guest>(modelBuilder);
        modelBuilder.Entity<Guest>(guest =>
        {
            guest.Ignore(g => g.DomainEvents);
            guest.Property(g => g.Id).HasConversion(id => id.Value, value => new GuestId(value));
            guest.Property(g => g.Kind).HasConversion<string>().HasMaxLength(20);
            guest.Property(g => g.Name).HasMaxLength(Guest.NameMaxLength);
            // Normalising never lengthens a name by more than its decomposed marks, all removed.
            guest.Property(g => g.NormalisedName).HasMaxLength(Guest.NameMaxLength * 2);
            guest.HasIndex(OrganisationProperty, nameof(Guest.Kind), nameof(Guest.NormalisedName));
        });

        // Entries are reached only through their field, which carries the organisation.
        OrganisationOwned<Field>(modelBuilder);
        modelBuilder.Entity<Field>(field =>
        {
            field.Ignore(f => f.DomainEvents);
            field.Ignore(f => f.Queue);
            field.Property(f => f.Id).HasConversion(id => id.Value, value => new TournamentId(value));
            // Two writes based on the same field cannot both succeed: the last slot is decided once (EN-9).
            field.Property(f => f.Revision).IsConcurrencyToken();
            field.ComplexProperty(f => f.Terms, terms =>
            {
                terms.Property(t => t.Registration).HasConversion<string>().HasMaxLength(20);
                terms.Property(t => t.EntryKind).HasConversion<string>().HasMaxLength(20);
                terms.Property(t => t.Admission).HasConversion<string>().HasMaxLength(20);
            });
            field.HasMany(f => f.Entries).WithOne().HasForeignKey("TournamentId").IsRequired();
            field.Navigation(f => f.Entries).HasField("_entries").UsePropertyAccessMode(PropertyAccessMode.Field).AutoInclude();
        });

        modelBuilder.Entity<Entry>(entry =>
        {
            entry.ToTable("Entries");
            entry.Property(e => e.Id).HasConversion(id => id.Value, value => new EntryId(value)).ValueGeneratedNever();
            entry.HasKey("TournamentId", nameof(Domain.Entry.Id));
            entry.Property(e => e.GuestId).HasConversion(id => id.Value, value => new GuestId(value));
            entry.Property(e => e.GuestKind).HasConversion<string>().HasMaxLength(20);
            entry.Property(e => e.State).HasConversion<string>().HasMaxLength(20);
            entry.Property(e => e.WaitingReason).HasConversion<string>().HasMaxLength(20);
            entry.Property(e => e.AdmissionMethod).HasConversion<string>().HasMaxLength(20);
            entry.Property(e => e.AdmissionReason).HasMaxLength(Field.ReasonMaxLength);
            entry.HasIndex(nameof(Domain.Entry.GuestId));
            entry.OwnsMany(e => e.Members, member =>
            {
                member.ToTable("RosterMembers");
                member.WithOwner().HasForeignKey("TournamentId", "EntryId");
                member.Property(m => m.GuestId).HasConversion(id => id.Value, value => new GuestId(value));
                member.HasKey("TournamentId", "EntryId", nameof(RosterMember.GuestId));
            });
            entry.Navigation(e => e.Members).HasField("_members").UsePropertyAccessMode(PropertyAccessMode.Field);
            entry.OwnsMany(e => e.RosterChanges, change =>
            {
                change.ToTable("RosterChanges");
                change.WithOwner().HasForeignKey("TournamentId", "EntryId");
                change.Property(c => c.GuestId).HasConversion(id => id.Value, value => new GuestId(value));
                change.Property(c => c.Kind).HasConversion<string>().HasMaxLength(20);
                change.Property(c => c.RosterRevision).ValueGeneratedNever();
                change.HasKey("TournamentId", "EntryId", nameof(RosterChange.RosterRevision));
            });
            entry.Navigation(e => e.RosterChanges).HasField("_rosterChanges").UsePropertyAccessMode(PropertyAccessMode.Field);
        });
    }
}
