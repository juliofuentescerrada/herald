using Herald.ModuleHosting;
using Microsoft.EntityFrameworkCore;
using Wolverine;
using Wolverine.Http;

namespace Herald.Messaging.Tests.Probes.Receiver;

// A probe module that exists only here: it receives the sender's message, and has a handler that always fails.
public static class ReceiverProbe
{
    public const string Schema = "probe_receiver";

    public static WolverineOptions AddReceiverProbe(this WolverineOptions options) =>
        options.AddHeraldModule<ReceiverDbContext>(Schema);
}

// Stands for an integration event in Herald.Contracts.
public sealed record ProbeRecorded(Guid RecordId);

public sealed record AlwaysFails(Guid Id);

public sealed class ProbeReceipt
{
    public Guid Id { get; init; }

    public Guid RecordId { get; init; }
}

public sealed class ReceiverDbContext(DbContextOptions<ReceiverDbContext> options) : DbContext(options)
{
    public DbSet<ProbeReceipt> Receipts => Set<ProbeReceipt>();

    protected override void OnModelCreating(ModelBuilder modelBuilder) => modelBuilder.MapModule(ReceiverProbe.Schema);
}

public static class ProbeRecordedHandler
{
    // No unique key on RecordId, so handling a message twice shows as two receipts.
    public static void Handle(ProbeRecorded message, ReceiverDbContext database) =>
        database.Receipts.Add(new ProbeReceipt { Id = Guid.NewGuid(), RecordId = message.RecordId });
}

public static class AlwaysFailsHandler
{
    public static void Handle(AlwaysFails message) =>
        throw new InvalidOperationException($"The probe always fails ({message.Id}).");
}

public sealed record ReceiptCount(Guid RecordId, int Count);

public static class ReceiptCountEndpoint
{
    [WolverineGet("/probe/receipts/{recordId}")]
    public static async Task<ReceiptCount> Get(Guid recordId, ReceiverDbContext database) =>
        new(recordId, await database.Receipts.CountAsync(receipt => receipt.RecordId == recordId));
}
