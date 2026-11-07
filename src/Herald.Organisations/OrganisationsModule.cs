using Herald.ModuleHosting;
using Herald.Organisations.Persistence;
using Wolverine;

namespace Herald.Organisations;

public static class OrganisationsModule
{
    public static WolverineOptions AddOrganisationsModule(this WolverineOptions options) =>
        options.AddHeraldModule<OrganisationsDbContext>(OrganisationsDbContext.Schema);
}
