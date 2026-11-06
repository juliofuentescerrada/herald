# 0007. State stored in PostgreSQL with EF Core, one schema per module; no event sourcing for now

- Status: Proposed
- Date: 2026-11-06

## Context

Herald needs to persist aggregates, read models, and the outbox and inbox (ADR 0008), ideally in one transaction. Event sourcing fits a tournament well (its history is a sequence of results), but it changes how every aggregate, projection and migration is written, and most systems a reader will work on store state.

The maintainer's other projects run on PostgreSQL, and Azure offers it as a managed service.

## Decision

Store the current state of each aggregate with **EF Core** on **PostgreSQL** (Npgsql). Each module has its own `DbContext` and its own schema (`registration`, `competition`, `standings`), with migrations per module. Wolverine's durable inbox and outbox tables live in the same database, so a state change and the messages it produces commit together.

Queries use EF Core projections with `AsNoTracking`; a hand-written SQL query is added only when a projection measurably isn't enough.

Events are not the source of truth. Domain events are dispatched and, when they cross a boundary, published; they are not replayed to rebuild state.

## Alternatives considered

- **Event sourcing** (Marten, or tables of our own): full history and natural projections, but a larger learning step on top of the rest, and a different model for every aggregate. It stays a candidate for a later ADR, for Competition first.
- **SQL Server / Azure SQL:** equally capable; PostgreSQL keeps Herald aligned with the maintainer's other projects and with Wolverine's PostgreSQL support.
- **A database per module:** stronger isolation, but no local transaction between a module's state and the shared outbox tables, and more resources to pay for.

## Consequences

- Positive: familiar model, one transaction for state and messages, cheap to run.
- Negative: history is only what the events and logs keep; projections can't be rebuilt from scratch without replaying from the source module.
- Follow-ups: revisit event sourcing for Competition after v1.
