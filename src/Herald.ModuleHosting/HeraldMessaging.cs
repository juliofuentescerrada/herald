using JasperFx;
using Wolverine;
using Wolverine.EntityFrameworkCore;
using Wolverine.Postgresql;

namespace Herald.ModuleHosting;

// Messaging every host of Herald modules shares: the host and the messaging tests.
public static class HeraldMessaging
{
    // How long a handled envelope id is remembered to reject redeliveries; set explicitly
    // (transactional-messaging spec). Chosen in ADR 0016: local queues redeliver only after a restart,
    // and snapshot consumers are idempotent beyond any window.
    public static readonly TimeSpan DeduplicationWindow = TimeSpan.FromMinutes(5);

    public static WolverineOptions UseHeraldMessaging(this WolverineOptions options, bool createTablesOnStartup)
    {
        options.PersistMessagesWithPostgresqlUsingDataSourceFromContainer(schemaName: ModuleDatabase.MessageStoreSchema);
        options.AutoBuildMessageStorageOnStartup = createTablesOnStartup ? AutoCreate.CreateOrUpdate : AutoCreate.None;
        options.Durability.KeepAfterMessageHandling = DeduplicationWindow;
        options.UseEntityFrameworkCoreTransactions();
        options.Policies.AutoApplyTransactions();
        options.Policies.UseDurableLocalQueues();
        options.Policies.UseDurableOutboxOnAllSendingEndpoints();
        options.Policies.UseDurableInboxOnAllListeners();
        return options;
    }
}
