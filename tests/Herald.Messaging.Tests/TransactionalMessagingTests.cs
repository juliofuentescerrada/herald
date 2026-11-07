using Herald.Messaging.Tests.Probes.Receiver;
using Herald.Messaging.Tests.Probes.Sender;
using Herald.ModuleHosting;
using Microsoft.Extensions.DependencyInjection;
using Shouldly;
using Wolverine;
using Wolverine.Runtime;
using Wolverine.Tracking;

namespace Herald.Messaging.Tests;

[Collection(PostgresTests.Name)]
public sealed class TransactionalMessagingTests(PostgresFixture postgres)
{
    private static readonly TimeSpan _trackingTimeout = TimeSpan.FromSeconds(30);
    private static readonly string _probeRecorded = typeof(ProbeRecorded).FullName!;

    // shortcut: a fixed pause to let recovery or a duplicate run; nothing signals "nothing happened". Upgrade if it proves flaky.
    private static readonly TimeSpan _quietPeriod = TimeSpan.FromSeconds(5);

    [Fact]
    public async Task A_handlers_change_and_its_message_commit_together_and_the_message_is_delivered()
    {
        var database = await NewDatabaseAsync();
        await using var host = await ProbeHost.StartAsync(database.ConnectionString);
        var id = Guid.NewGuid();

        await host.TrackActivity().Timeout(_trackingTimeout).InvokeMessageAndWaitAsync(new RecordProbe(id));

        (await database.CountAsync($"select count(*) from probe_sender.\"Records\" where \"Id\" = '{id}'")).ShouldBe(1);
        (await database.CountAsync($"select count(*) from probe_receiver.\"Receipts\" where \"RecordId\" = '{id}'")).ShouldBe(1);
    }

    [Fact]
    public async Task A_handler_that_throws_after_publishing_leaves_neither_its_change_nor_a_message()
    {
        var database = await NewDatabaseAsync();
        await using var host = await ProbeHost.StartAsync(database.ConnectionString);

        await Should.ThrowAsync<InvalidOperationException>(() => host.TrackActivity().Timeout(_trackingTimeout)
            .DoNotAssertOnExceptionsDetected()
            .InvokeMessageAndWaitAsync(new RecordProbe(Guid.NewGuid(), FailAfterPublishing: true)));
        await Task.Delay(_quietPeriod, TestContext.Current.CancellationToken);

        (await database.CountAsync("select count(*) from probe_sender.\"Records\"")).ShouldBe(0);
        (await database.CountAsync("select count(*) from wolverine.wolverine_outgoing_envelopes")).ShouldBe(0);
        (await database.CountAsync("select count(*) from wolverine.wolverine_incoming_envelopes")).ShouldBe(0);
        (await database.CountAsync("select count(*) from probe_receiver.\"Receipts\"")).ShouldBe(0);
    }

    [Fact]
    public async Task A_message_between_modules_passes_through_the_shared_store_and_is_not_delivered_again_after_a_restart()
    {
        var database = await NewDatabaseAsync();
        await using (var host = await ProbeHost.StartAsync(database.ConnectionString))
        {
            await host.TrackActivity().Timeout(_trackingTimeout).InvokeMessageAndWaitAsync(new RecordProbe(Guid.NewGuid()));
            await host.StopAsync(TestContext.Current.CancellationToken);
        }

        (await database.CountAsync($"select count(*) from wolverine.wolverine_incoming_envelopes where message_type = '{_probeRecorded}' and status = 'Handled'")).ShouldBe(1);
        (await database.CountAsync("select count(*) from wolverine.wolverine_incoming_envelopes where status <> 'Handled'")).ShouldBe(0);
        (await database.CountAsync("select count(*) from wolverine.wolverine_outgoing_envelopes")).ShouldBe(0);
        (await database.CountAsync("select count(*) from information_schema.tables where table_schema like 'probe_%' and table_name like 'wolverine%'")).ShouldBe(0);

        await using var restarted = await ProbeHost.StartAsync(database.ConnectionString);
        await Task.Delay(_quietPeriod, TestContext.Current.CancellationToken);

        (await database.CountAsync("select count(*) from probe_receiver.\"Receipts\"")).ShouldBe(1);
    }

    [Fact]
    public async Task A_redelivered_message_is_handled_once_within_the_deduplication_window_also_after_a_restart()
    {
        var database = await NewDatabaseAsync();
        var envelopeId = Guid.NewGuid();
        var recordId = Guid.NewGuid();
        await using (var host = await ProbeHost.StartAsync(database.ConnectionString))
        {
            host.Services.GetRequiredService<IWolverineRuntime>().Options.Durability.KeepAfterMessageHandling.ShouldBe(HeraldMessaging.DeduplicationWindow);

            await RedeliverAsync(host, envelopeId, recordId);
            await EventuallyAsync(async () => await database.CountAsync("select count(*) from probe_receiver.\"Receipts\"") == 1);
            await RedeliverAsync(host, envelopeId, recordId);
            await Task.Delay(_quietPeriod, TestContext.Current.CancellationToken);
            await host.StopAsync(TestContext.Current.CancellationToken);
        }

        await using var restarted = await ProbeHost.StartAsync(database.ConnectionString);
        await RedeliverAsync(restarted, envelopeId, recordId);
        await Task.Delay(_quietPeriod, TestContext.Current.CancellationToken);

        (await database.CountAsync("select count(*) from probe_receiver.\"Receipts\"")).ShouldBe(1);
    }

    [Fact]
    public async Task A_message_whose_handler_always_fails_ends_in_the_dead_letters_with_its_receiving_endpoint()
    {
        var database = await NewDatabaseAsync();
        await using var host = await ProbeHost.StartAsync(database.ConnectionString);

        await host.TrackActivity().Timeout(_trackingTimeout).DoNotAssertOnExceptionsDetected()
            .SendMessageAndWaitAsync(new AlwaysFails(Guid.NewGuid()));

        (await database.ColumnAsync("select message_type || ' at ' || received_at from wolverine.wolverine_dead_letters"))
            .ShouldBe([$"{typeof(AlwaysFails).FullName} at {LocalQueueOf<AlwaysFails>()}"]);
    }

    // A broker redelivering the same envelope: same id, same destination.
    private static async Task RedeliverAsync(Microsoft.AspNetCore.Builder.WebApplication host, Guid envelopeId, Guid recordId)
    {
        var runtime = host.Services.GetRequiredService<IWolverineRuntime>();
        var agent = runtime.Endpoints.GetOrBuildSendingAgent(new Uri(LocalQueueOf<ProbeRecorded>()));
        await agent.StoreAndForwardAsync(new Envelope(new ProbeRecorded(recordId))
        {
            Id = envelopeId,
            Destination = agent.Destination,
            MessageType = _probeRecorded,
            ContentType = "application/json",
            Serializer = runtime.Options.DefaultSerializer,
        });
    }

    // Wolverine names a message's durable local queue after its type.
    private static string LocalQueueOf<T>() => $"local://{typeof(T).FullName!.ToLowerInvariant()}/";

    private static async Task EventuallyAsync(Func<Task<bool>> condition)
    {
        var deadline = DateTime.UtcNow + _trackingTimeout;
        while (!await condition())
        {
            DateTime.UtcNow.ShouldBeLessThan(deadline, "the condition did not become true in time");
            await Task.Delay(100, TestContext.Current.CancellationToken);
        }
    }

    private async Task<MessagingDatabase> NewDatabaseAsync() => new(await postgres.CreateDatabaseAsync());
}
