using Herald.ModuleHosting;
using Herald.Standings.Persistence;
using Wolverine;

namespace Herald.Standings;

public static class StandingsModule
{
    public static WolverineOptions AddStandingsModule(this WolverineOptions options) =>
        options.AddHeraldModule<StandingsDbContext>(StandingsDbContext.Schema);
}
