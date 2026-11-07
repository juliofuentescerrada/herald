using Herald.ModuleHosting;
using Wolverine;

namespace Herald.Standings;

public static class StandingsModule
{
    public static WolverineOptions AddStandingsModule(this WolverineOptions options) =>
        options.AddHeraldModule(typeof(StandingsModule).Assembly);
}
