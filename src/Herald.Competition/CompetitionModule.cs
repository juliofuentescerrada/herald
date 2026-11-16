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
        options.PublishMessage<TournamentFrozenRostersChanged>().ToLocalQueue(Queue);
        // Registration consumes the cancellation too; each module's handler is sticky to its own queue.
        options.PublishMessage<TournamentCancelled>().ToLocalQueue(Queue);
        options.PublishMessage<TournamentArchiveChanged>().ToLocalQueue(Queue);
        return options.AddHeraldModule<CompetitionDbContext>(CompetitionDbContext.Schema);
    }
}
