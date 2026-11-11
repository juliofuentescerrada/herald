using Herald.Contracts.Registration.V1;
using Herald.ModuleHosting;
using Herald.Tournaments.Persistence;
using Wolverine;

namespace Herald.Tournaments;

public static class TournamentsModule
{
    public const string Queue = "tournaments";

    public static WolverineOptions AddTournamentsModule(this WolverineOptions options)
    {
        // Integration events this module consumes come through its durable local queue (ADR 0016).
        options.PublishMessage<TournamentFieldChanged>().ToLocalQueue(Queue);
        return options.AddHeraldModule<TournamentsDbContext>(TournamentsDbContext.Schema);
    }
}
