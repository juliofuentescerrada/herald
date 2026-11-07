using Herald.ModuleHosting;
using Herald.Tournaments.Persistence;
using Wolverine;

namespace Herald.Tournaments;

public static class TournamentsModule
{
    public static WolverineOptions AddTournamentsModule(this WolverineOptions options) =>
        options.AddHeraldModule<TournamentsDbContext>(TournamentsDbContext.Schema);
}
