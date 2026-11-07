# 0006. Aggregates own the rules and raise domain events, on small building blocks of our own

- Status: Proposed
- Date: 2026-11-06
- Consolidated: 2026-11-07

## Context

Herald's value is in its rules: admitted entries consume capacity, match readiness differs from admission, a round needs valid terminal outcomes, and only effective results affect standings. H1 operators enter results; H2 competitors report for confirmation. Domain invariants remain in aggregates/policies while features coordinate authority, persistence and the operation response.

Some consequences happen in the same context, such as an effective result changing a match's state; others update another module's projection. Closing registration, preparing pairings, publishing them and starting competition are distinct actions. A pending report does not update competitive standings.

## Decision

Model each context with aggregates that enforce their invariants in their own methods. State changes only through those methods; constructors and factories reject invalid state; identifiers are strongly typed; values such as a score or a capacity are value objects.

An aggregate records **domain events** (for example `EffectiveResultRecorded` or `RoundCompleted`) as it changes. The owning operation persists its state, required business revision evidence and outgoing integration messages atomically. The exact ordering of local event dispatch and persistence is verified in the implementing change. Facts needed elsewhere are mapped to **integration events** in `Herald.Contracts` and published through the outbox (ADR 0008). Domain events never leave the module; integration events are versioned contracts. Illustrative event names do not fix public payloads before their slice is specified.

The base types (`Entity<TId>`, `AggregateRoot<TId>`, the domain event interface, value object equality) are Herald's own, in `Herald.BuildingBlocks`, small enough to read in one sitting. Records cover value objects where structural equality is enough.

Aggregate boundaries are decided per change, in its `design.md`. The first open question is whether a match belongs to the tournament aggregate or is an aggregate of its own advanced by a process manager.

## Alternatives considered

- **A DDD base library from a package:** less code to write, but another dependency in `Domain` and less control over what the domain sees.
- **Publishing integration events directly from aggregates:** fewer types, but the domain would know about messaging, and internal changes would leak to every consumer.
- **Anaemic entities with rules in handlers:** quicker to write, and exactly what this project exists not to do.

## Consequences

- Positive: rules are tested on the aggregate with no infrastructure; events describe meaningful changes. Required durable history is explicitly stored by the owning module (ADR 0007), not inferred from transient event dispatch or operational logs.
- Negative: more types (event, integration event, mapping) per fact; base classes have to stay minimal or they become a framework.
- Follow-ups: the match aggregate boundary, in the first Competition change.
