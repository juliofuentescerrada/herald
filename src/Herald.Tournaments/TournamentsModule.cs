using Herald.ModuleHosting;
using Wolverine;

namespace Herald.Tournaments;

public static class TournamentsModule
{
    public static WolverineOptions AddTournamentsModule(this WolverineOptions options) =>
        options.AddHeraldModule(typeof(TournamentsModule).Assembly);
}
