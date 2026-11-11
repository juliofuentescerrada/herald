using Herald.Contracts.Tournaments.V1;
using Herald.ModuleHosting;
using Herald.Registration.Persistence;
using Wolverine;

namespace Herald.Registration;

public static class RegistrationModule
{
    public const string Queue = "registration";

    public static WolverineOptions AddRegistrationModule(this WolverineOptions options)
    {
        // Integration events this module consumes come through its durable local queue (ADR 0016).
        options.PublishMessage<TournamentEntryTermsChanged>().ToLocalQueue(Queue);
        return options.AddHeraldModule<RegistrationDbContext>(RegistrationDbContext.Schema);
    }
}
