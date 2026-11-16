using Herald.Contracts.Competition.V1;
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
        options.PublishMessage<TournamentScheduleChanged>().ToLocalQueue(Queue);
        // Standings consumes these too; each module's handler is sticky to its own queue.
        options.PublishMessage<CompetitionFinalised>().ToLocalQueue(Queue);
        options.PublishMessage<CompetitionReopened>().ToLocalQueue(Queue);
        return options.AddHeraldModule<TournamentsDbContext>(TournamentsDbContext.Schema);
    }
}
