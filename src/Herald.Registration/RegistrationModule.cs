using Herald.ModuleHosting;
using Herald.Registration.Persistence;
using Wolverine;

namespace Herald.Registration;

public static class RegistrationModule
{
    public static WolverineOptions AddRegistrationModule(this WolverineOptions options) =>
        options.AddHeraldModule<RegistrationDbContext>(RegistrationDbContext.Schema);
}
