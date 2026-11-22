using Herald.Contracts.Competition.V1;
using Herald.ModuleHosting;
using Herald.Standings.Persistence;
using Wolverine;

namespace Herald.Standings;

public static class StandingsModule
{
    public const string Queue = "standings";

    public static WolverineOptions AddStandingsModule(this WolverineOptions options)
    {
        // Integration events this module consumes come through its durable local queue (ADR 0016).
        options.PublishMessage<TournamentResultsChanged>().ToLocalQueue(Queue);
        // Tournaments consumes these and the results too; each module's handler is sticky to its own queue.
        options.PublishMessage<CompetitionFinalised>().ToLocalQueue(Queue);
        options.PublishMessage<CompetitionReopened>().ToLocalQueue(Queue);
        return options.AddHeraldModule<StandingsDbContext>(StandingsDbContext.Schema);
    }
}
