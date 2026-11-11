# 0016. Integration events between modules of the host travel through durable local queues

- Status: Proposed
- Date: 2026-11-11

## Context

`h1-entries` brings Herald's first integration events. Tournaments owns a tournament's capacity, admission, entry kind and registration window; Registration owns guests and admission (D-08). Each needs facts the other owns: Registration cannot admit without the capacity and the window, and Tournaments cannot keep capacity at or above the admitted entries without their count. Modules never reference each other (ADR 0004), so the facts cross as integration events in `Herald.Contracts`, through the outbox and inbox (ADR 0008).

ADR 0009 routes integration events through Azure Service Bus, one topic per publishing module, with the emulator in the AppHost. Every module still runs in one host process. The end-to-end suite runs the host without a broker (ADR 0015), and the emulator needs a SQL Server container, beyond the local Docker budget for the host's tests and the suite. Wolverine already runs durable local queues through the same PostgreSQL store (`UseDurableLocalQueues`), with the same transactional and once-only guarantees as its external transports.

## Decision

- **Between modules of one host, durable local queues.** An integration event published by one module and handled by another module of the same host is routed to a named durable local queue of the consuming module (`tournaments`, `registration`), declared in that module's entry point. The outbox commits it with the publisher's state change; the inbox records it before the consumer handles it. No external broker is involved, so the host, its tests, the end-to-end suite and Aspire route the same way.
- **Service Bus when a party leaves the process.** When a publisher or consumer runs outside the host, or an external consumer appears, its events are routed through Service Bus as ADR 0009 describes. Handlers and contracts do not change; only routing does.
- **Contracts and idempotency are transport-independent.** Contracts live in `Herald.Contracts`, one namespace per publishing module, carry a version, and use primitives and enumerations of their own. Events that describe state are full snapshots with the publisher's revision; a consumer keeps the highest revision and ignores older ones, so redelivery after the deduplication window, reordering and replays change nothing.
- **Deduplication window.** It stays at five minutes, now chosen: local queues redeliver only after a restart, and snapshot consumers are idempotent beyond any window.

## Alternatives considered

- **Service Bus as ADR 0009 states:** the routing a reader expects in an Azure reference, but every host test and end-to-end run would need the emulator and its SQL Server container, or a substitute, for messages that never leave the process.
- **Service Bus in Aspire and Azure, local queues in tests and the suite:** the same handlers, but the routing that runs in production would never run in automated tests, and two routings must be kept in step.
- **Synchronous in-process requests between modules (Wolverine `InvokeAsync`):** immediate consistency, but every write of one module would depend on the other's availability and schema, which the modular boundary is meant to prevent.
- **Wolverine's PostgreSQL transport:** an external-style queue without a new broker; it adds polling and configuration for no gain over local queues while every module shares one process and one store.

## Consequences

- Positive: integration events between modules run in every environment, including CI and the end-to-end suite, without a broker; the guarantees of ADR 0008 hold; contracts and handlers are ready for Service Bus when a module leaves the process.
- Negative: Service Bus routing is not exercised by Herald's automated tests until a party leaves the process; the AppHost's emulator carries no Herald traffic yet. Each module's view of the other is eventually consistent, so crossed changes must be detected and reported by the consumer (`h1-entries` design D-5).
- Follow-ups: route through Service Bus, with its topology in the AppHost and a broker test in CI, when a module or consumer leaves the host; revisit the deduplication window if a transport redelivers later than a restart.

Direction proposed by `h1-entries` and chosen by the maintainer on 11 November 2026; implemented by that change. It refines ADR 0009 (Proposed) for traffic inside the host.
