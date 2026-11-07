using Herald.ModuleHosting;
using Wolverine;

namespace Herald.Registration;

public static class RegistrationModule
{
    public static WolverineOptions AddRegistrationModule(this WolverineOptions options) =>
        options.AddHeraldModule(typeof(RegistrationModule).Assembly);
}
