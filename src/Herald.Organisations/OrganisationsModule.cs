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
        options.Services.AddScoped<IActorNames, ActorNames>();
        // Resolved at run time, so other modules' generated code never builds this module's database context itself.
        options.CodeGeneration.AlwaysUseServiceLocationFor<IActorNames>();
        return options.AddHeraldModule<OrganisationsDbContext>(OrganisationsDbContext.Schema);
    }
}
