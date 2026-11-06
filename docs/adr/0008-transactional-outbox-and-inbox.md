# 0008. Integration events leave through a transactional outbox, and arrive through an inbox

- Status: Proposed
- Date: 2026-11-06

## Context

When a result is reported, Competition saves the match and has to tell Standings. If it saves and then publishes, a failure in between loses the event; if it publishes and then saves, a failure tells Standings about a result that never happened. Brokers also deliver at least once, so a consumer can see the same message twice.

## Decision

Use Wolverine's durable messaging with `WolverineFx.EntityFrameworkCore` and `WolverineFx.PostgreSQL`:

- **Outbox:** a command handler's outgoing messages are stored in the same transaction as the aggregate, and sent only after the commit, with retries.
- **Inbox:** incoming messages are stored before they are handled and marked when done, so a redelivered message is not processed twice.

Every consumer is also idempotent by design (a result already applied is ignored), so correctness doesn't depend on the inbox alone. Messages that keep failing go to a dead-letter queue and are visible, not dropped.

## Alternatives considered

- **An outbox of our own** (a table, a background publisher with `FOR UPDATE SKIP LOCKED`): the clearest way to show the pattern, but retries, scheduling, recovery after a crash and the inbox are all code to maintain. Its design is still described here so the mechanism is understood, not hidden.
- **Publishing after `SaveChanges`:** simple and wrong under failure.
- **Distributed transactions:** not supported by Azure Service Bus with PostgreSQL, and not worth it.

## Consequences

- Positive: no lost or phantom events; a crash between commit and send recovers on restart.
- Negative: delivery is eventually consistent, and Standings can lag behind Competition by a moment; Wolverine's tables have to be part of migrations and backups.
- Follow-ups: in M0, decide whether Wolverine creates its tables at startup or through migrations.
