using Herald.ModuleHosting;
using Wolverine;

namespace Herald.Organisations;

public static class OrganisationsModule
{
    public static WolverineOptions AddOrganisationsModule(this WolverineOptions options) =>
        options.AddHeraldModule(typeof(OrganisationsModule).Assembly);
}
