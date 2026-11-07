# 0007. State stored in PostgreSQL with EF Core, one schema per module; no event sourcing for now

- Status: Proposed
- Date: 2026-11-06
- Consolidated: 2026-11-07

## Context

Herald needs to persist aggregates, read models, and the outbox and inbox (ADR 0008), ideally in one transaction. Event sourcing fits a tournament well (its history is a sequence of results), but it changes how every aggregate, projection and migration is written, and most systems a reader will work on store state.

The maintainer's other projects run on PostgreSQL, and Azure offers it as a managed service.

## Decision

Store the current state of each aggregate with **EF Core** on **PostgreSQL** (Npgsql). Each module has its own `DbContext` and its own schema (`registration`, `competition`, `standings`), with migrations per module. Wolverine's durable inbox and outbox tables live in the same database, so a state change and the messages it produces commit together.

Queries use EF Core projections with `AsNoTracking`; a hand-written SQL query is added only when a projection measurably isn't enough.

Events are not the source of truth. Domain events are dispatched and, when they cross a boundary, published; they are not replayed to rebuild state.

Each module also stores the durable business evidence its operations require: effective and predecessor revisions, responsible user/application, time, reason and referenced roster/lineup or rules revision where applicable. A correction supersedes a result without deleting its predecessor. The operation commits this evidence with the corresponding state change; a rollback leaves neither a partial decision nor an uncommitted audit record. Operational logs and inbox/outbox retention are not the product's audit trail. The concrete records and identity-retention policy belong to their H1 slices and the functional decision ledger.

Standings are derived and carry the effective input revision they reflect. Their owning operation defines how to rebuild or reconcile them from retained source records. A public view may lag visibly; a finalisation or other dependent competitive transition must use a verified current revision. This does not require event sourcing.

## Alternatives considered

- **Event sourcing** (Marten, or tables of our own): full history and natural projections, but a larger learning step on top of the rest, and a different model for every aggregate. It stays a candidate for a later ADR, for Competition first.
- **SQL Server / Azure SQL:** equally capable; PostgreSQL keeps Herald aligned with the maintainer's other projects and with Wolverine's PostgreSQL support.
- **A database per module:** stronger isolation, but more resources and operational coordination for this project. A module could still transact its state with its own outbox; the detailed store topology is evaluated in `m0-messaging`.

## Consequences

- Positive: familiar model, one transaction for state and messages, cheap to run.
- Negative: revision retention and projection reconstruction must be designed explicitly; storing current state alone is insufficient for Herald's history requirements.
- Follow-ups: define business revision records, organisation isolation and reconstruction in the first H1 slices that persist them. Revisit event sourcing only if a demonstrated need justifies a new decision.
