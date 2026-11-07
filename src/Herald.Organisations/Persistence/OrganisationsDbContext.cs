using Herald.ModuleHosting;
using Microsoft.EntityFrameworkCore;

namespace Herald.Organisations.Persistence;

public sealed class OrganisationsDbContext(DbContextOptions<OrganisationsDbContext> options) : DbContext(options)
{
    public const string Schema = "organisations";

    protected override void OnModelCreating(ModelBuilder modelBuilder) => modelBuilder.MapModule(Schema);
}
