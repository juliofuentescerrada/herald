using System.Reflection;
using Wolverine;

namespace Herald.ModuleHosting;

// The one way a module plugs into the host, so probe modules in tests are hosted like the real ones.
// It runs inside the host's UseWolverine: Wolverine applies extensions registered through DI only
// once the service collection is read-only, too late for a module's own services.
public static class ModuleRegistration
{
    public static WolverineOptions AddHeraldModule(this WolverineOptions options, Assembly module)
    {
        options.Discovery.IncludeAssembly(module);
        return options;
    }
}
