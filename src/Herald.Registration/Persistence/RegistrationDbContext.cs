using Herald.ModuleHosting;
using Microsoft.EntityFrameworkCore;

namespace Herald.Registration.Persistence;

public sealed class RegistrationDbContext(DbContextOptions<RegistrationDbContext> options) : DbContext(options)
{
    public const string Schema = "registration";

    protected override void OnModelCreating(ModelBuilder modelBuilder) => modelBuilder.MapModule(Schema);
}
