# 0008. Integration events leave through a transactional outbox, and arrive through an inbox

- Status: Proposed
- Date: 2026-11-06
- Consolidated: 2026-11-07 (terminology and scope only)
- Revised: 2026-11-08 (store topology and table creation answered by `m0-messaging`)

## Context

When a result becomes effective, Competition saves the match and has to tell Standings. A pending H2 competitor report does not change competitive points. If Competition saves and then publishes, a failure in between loses the event; if it publishes and then saves, a failure tells Standings about a result that never happened. Brokers also deliver at least once, so a consumer can see the same message twice.

## Decision

Use Wolverine's durable messaging with `WolverineFx.EntityFrameworkCore` and `WolverineFx.PostgreSQL`:

- **Outbox:** a command handler's outgoing messages are stored in the same transaction as the aggregate, and sent only after the commit, with retries.
- **Inbox:** incoming messages are stored before they are handled and marked when done, so a redelivered message is not processed twice.

Every consumer is also idempotent by design (a result already applied is ignored), so correctness doesn't depend on the inbox alone. Messages that keep failing go to a dead-letter queue and are visible, not dropped.

**One shared message store.** Every module's outbox, inbox and dead letters live in one Wolverine store in the `wolverine` schema of the database that holds the modules' state, so a handler's change and its envelopes commit in one transaction. The preferred design, one store per module in its own schema, was set aside: the `m0-messaging` spike found that Wolverine 6.62.0's EF Core integration maps every `DbContext`'s envelopes to one schema, leaving them in the wrong module's store (redelivered on restart, or never marked handled). Revisit when Wolverine maps envelopes per `DbContext`; until then, moving a module out includes moving its in-flight messages.

**Tables.** Each module's EF Core migrations create its own tables; Wolverine's tables are created by Wolverine through Weasel, never copied into migrations. In Development the host does both at start-up; elsewhere it creates nothing (`AutoCreate.None`), `db-apply` is an explicit deployment step and `db-assert` detects drift.

**Redelivery.** The inbox rejects an envelope id it has already handled while that id is remembered: the deduplication window is set explicitly in `Herald.ModuleHosting` (five minutes until H1 chooses its value). It covers transport redelivery, not a publisher sending the same event twice, which consumer idempotency covers. Messaging tests with probe modules prove these properties against PostgreSQL. Durable competitive revision history is a separate module responsibility under ADR 0007.

## Alternatives considered

- **An outbox of our own** (a table, a background publisher with `FOR UPDATE SKIP LOCKED`): the clearest way to show the pattern, but retries, scheduling, recovery after a crash and the inbox are all code to maintain. Its design is still described here so the mechanism is understood, not hidden.
- **Publishing after `SaveChanges`:** simple and wrong under failure.
- **Distributed transactions:** not supported by Azure Service Bus with PostgreSQL, and not worth it.

## Consequences

- Positive: no lost or phantom events; a crash between commit and send recovers on restart.
- Negative: delivery is eventually consistent, and Standings can lag behind Competition by a moment; Wolverine's tables are a deployment step of their own and part of backups; messages belong to no module.
- Follow-ups: choose the deduplication window with the first integration event (H1); wire `db-apply` into deployment (M4); revisit per-module stores when Wolverine supports them.
