using Herald.Competition.Persistence;
using Herald.Contracts.Registration.V1;
using Herald.Contracts.Tournaments.V1;
using Herald.ModuleHosting;
using Wolverine;

namespace Herald.Competition;

public static class CompetitionModule
{
    public const string Queue = "competition";

    public static WolverineOptions AddCompetitionModule(this WolverineOptions options)
    {
        // Integration events this module consumes come through its durable local queue (ADR 0016).
        options.PublishMessage<TournamentEligibleFieldChanged>().ToLocalQueue(Queue);
        options.PublishMessage<TournamentCompetitionStarted>().ToLocalQueue(Queue);
        return options.AddHeraldModule<CompetitionDbContext>(CompetitionDbContext.Schema);
    }
}
