# 0006. Aggregates own the rules and raise domain events, on small building blocks of our own

- Status: Proposed
- Date: 2026-11-06

## Context

Herald's value is in its rules: a full tournament puts new players on the waiting list, a round can't close while a match has no result, a knockout winner advances to exactly one slot, a result is reported once and confirmed by the opponent. If those rules live in handlers or in the database, the architecture is ceremony.

Some consequences happen in the same context (closing registration creates the schedule) and some in others (a reported result moves the standings).

## Decision

Model each context with aggregates that enforce their invariants in their own methods. State changes only through those methods; constructors and factories reject invalid state; identifiers are strongly typed; values such as a score or a capacity are value objects.

An aggregate records **domain events** (`ResultReported`, `RoundCompleted`) as it changes. After the command handler saves the aggregate, its events are dispatched in the same transaction: handlers in the same module react to them, and the ones that matter elsewhere are mapped to **integration events** in `Herald.Contracts` and published through the outbox (ADR 0008). Domain events never leave the module; integration events are versioned contracts.

The base types (`Entity<TId>`, `AggregateRoot<TId>`, the domain event interface, value object equality) are Herald's own, in `Herald.BuildingBlocks`, small enough to read in one sitting. Records cover value objects where structural equality is enough.

Aggregate boundaries are decided per change, in its `design.md`. The first open question is whether a match belongs to the tournament aggregate or is an aggregate of its own advanced by a process manager.

## Alternatives considered

- **A DDD base library from a package:** less code to write, but another dependency in `Domain` and less control over what the domain sees.
- **Publishing integration events directly from aggregates:** fewer types, but the domain would know about messaging, and internal changes would leak to every consumer.
- **Anaemic entities with rules in handlers:** quicker to write, and exactly what this project exists not to do.

## Consequences

- Positive: rules are tested on the aggregate with no infrastructure; the events double as a readable history of what happened.
- Negative: more types (event, integration event, mapping) per fact; base classes have to stay minimal or they become a framework.
- Follow-ups: the match aggregate boundary, in the first Competition change.
