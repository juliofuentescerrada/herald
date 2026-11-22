using Herald.ModuleHosting;
using Herald.Organisations.Domain;
using Microsoft.EntityFrameworkCore;

namespace Herald.Organisations.Persistence;

public sealed class OrganisationsDbContext(DbContextOptions<OrganisationsDbContext> options, OrganisationContext organisation)
    : OrganisationScopedDbContext(options, organisation)
{
    public const string Schema = "organisations";

    private const string MembershipOrganisation = "OrganisationRef";

    public DbSet<Person> Persons => Set<Person>();

    public DbSet<Organisation> Organisations => Set<Organisation>();

    public DbSet<Membership> Memberships => Set<Membership>();

    public DbSet<IdentityRelink> IdentityRelinks => Set<IdentityRelink>();

    public DbSet<ApplicationGrant> ApplicationGrants => Set<ApplicationGrant>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.MapModule(Schema);

        modelBuilder.Entity<Person>(person =>
        {
            person.Ignore(p => p.DomainEvents);
            person.Property(p => p.Id).HasConversion(id => id.Value, value => new PersonId(value));
            person.Ignore(p => p.Identity);
            person.Property<Guid>(nameof(IdentityKey.DirectoryId));
            person.Property<Guid>(nameof(IdentityKey.ObjectId));
            person.HasIndex(nameof(IdentityKey.DirectoryId), nameof(IdentityKey.ObjectId)).IsUnique();
        });

        modelBuilder.Entity<Organisation>(organisation =>
        {
            organisation.Ignore(o => o.DomainEvents);
            organisation.Ignore(o => o.Owner);
            organisation.Property(o => o.Id).HasConversion(id => id.Value, value => new OrganisationId(value));
            organisation.Property(o => o.Name)
                .HasConversion(name => name.Value, value => OrganisationName.Create(value))
                .HasMaxLength(OrganisationName.MaxLength);
            organisation.Property(o => o.CreatedBy).HasConversion(id => id.Value, value => new PersonId(value));
            organisation.HasOne<Person>().WithMany().HasForeignKey(o => o.CreatedBy).OnDelete(DeleteBehavior.Restrict);
            organisation.HasMany(o => o.Memberships).WithOne().HasForeignKey(MembershipOrganisation).IsRequired();
        });

        OrganisationOwned<Membership>(modelBuilder);
        modelBuilder.Entity<Membership>(membership =>
        {
            membership.Property(m => m.PersonId).HasConversion(id => id.Value, value => new PersonId(value));
            membership.HasKey(OrganisationProperty, nameof(Membership.PersonId));
            // The typed foreign key cannot be the Guid isolation column (EF Core needs matching CLR types),
            // so both exist and the database keeps them equal.
            membership.ToTable(table => table.HasCheckConstraint(
                "CK_Membership_OrganisationRef_matches_owner", $"\"{MembershipOrganisation}\" = \"{OrganisationProperty}\""));
            membership.HasIndex(m => m.PersonId);
            membership.HasOne<Person>().WithMany().HasForeignKey(m => m.PersonId).OnDelete(DeleteBehavior.Restrict);
            membership.Property(m => m.Role).HasConversion<string>().HasMaxLength(20);
        });

        OrganisationOwned<ApplicationGrant>(modelBuilder);
        modelBuilder.Entity<ApplicationGrant>(grant =>
        {
            grant.Ignore(g => g.DomainEvents);
            grant.Ignore(g => g.Application);
            grant.Ignore(g => g.Active);
            grant.Property(g => g.Id).HasConversion(id => id.Value, value => new GrantId(value));
            grant.Property(g => g.Name)
                .HasConversion(name => name.Value, value => GrantName.Create(value))
                .HasMaxLength(GrantName.MaxLength);
            grant.Property<Guid>(nameof(IdentityKey.DirectoryId));
            grant.Property<Guid>(nameof(IdentityKey.ObjectId));
            // At most one active grant per application and organisation; also refuses a simultaneous second grant.
            grant.HasIndex(OrganisationProperty, nameof(IdentityKey.DirectoryId), nameof(IdentityKey.ObjectId))
                .IsUnique()
                .HasFilter($"\"{nameof(ApplicationGrant.RevokedAt)}\" IS NULL");
            grant.PrimitiveCollection(g => g.Tournaments).HasField("_tournaments");
            grant.PrimitiveCollection(g => g.Groups).HasField("_groups").ElementType().HasConversion<string>();
            grant.Property(g => g.GrantedBy).HasConversion(id => id.Value, value => new PersonId(value));
            grant.Property(g => g.RevokedBy).HasConversion(id => id!.Value.Value, value => new PersonId(value));
            grant.HasOne<Person>().WithMany().HasForeignKey(g => g.GrantedBy).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<IdentityRelink>(relink =>
        {
            relink.Property(r => r.PersonId).HasConversion(id => id.Value, value => new PersonId(value));
            relink.ComplexProperty(r => r.Previous);
            relink.ComplexProperty(r => r.Current);
            relink.HasOne<Person>().WithMany().HasForeignKey(r => r.PersonId).OnDelete(DeleteBehavior.Restrict);
        });
    }
}
