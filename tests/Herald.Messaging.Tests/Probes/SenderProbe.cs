using Herald.ModuleHosting;
using Microsoft.EntityFrameworkCore;
using Wolverine;

namespace Herald.Messaging.Tests.Probes.Sender;

// A probe module that exists only here: it saves a record and tells the receiver about it.
public static class SenderProbe
{
    public const string Schema = "probe_sender";

    public static WolverineOptions AddSenderProbe(this WolverineOptions options) =>
        options.AddHeraldModule<SenderDbContext>(Schema);
}

public sealed record RecordProbe(Guid Id, bool FailAfterPublishing = false);

public sealed class ProbeRecord
{
    public Guid Id { get; init; }
}

public sealed class SenderDbContext(DbContextOptions<SenderDbContext> options) : DbContext(options)
{
    public DbSet<ProbeRecord> Records => Set<ProbeRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder) => modelBuilder.MapModule(SenderProbe.Schema);
}

public static class RecordProbeHandler
{
    public static async Task Handle(RecordProbe command, SenderDbContext database, IMessageBus bus)
    {
        database.Records.Add(new ProbeRecord { Id = command.Id });
        await bus.PublishAsync(new Receiver.ProbeRecorded(command.Id));
        if (command.FailAfterPublishing)
        {
            throw new InvalidOperationException("The probe fails after publishing.");
        }
    }
}
