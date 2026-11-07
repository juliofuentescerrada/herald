using Herald.Competition.Persistence;
using Herald.ModuleHosting;
using Wolverine;

namespace Herald.Competition;

public static class CompetitionModule
{
    public static WolverineOptions AddCompetitionModule(this WolverineOptions options) =>
        options.AddHeraldModule<CompetitionDbContext>(CompetitionDbContext.Schema);
}
