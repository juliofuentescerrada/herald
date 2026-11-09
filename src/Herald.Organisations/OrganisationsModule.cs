using Herald.ModuleHosting;
using Herald.Organisations.Persistence;
using Microsoft.Extensions.DependencyInjection;
using Wolverine;

namespace Herald.Organisations;

public static class OrganisationsModule
{
    public static WolverineOptions AddOrganisationsModule(this WolverineOptions options)
    {
        options.Services.AddScoped<IOrganisationAccess, OrganisationAccess>();
        return options.AddHeraldModule<OrganisationsDbContext>(OrganisationsDbContext.Schema);
    }
}
