# Architecture decision records

One significant decision per record: context, decision, alternatives and consequences, good and bad.

- Numbered in order, never renumbered.
- Status: `Proposed`, `Accepted`, `Superseded by NNNN`, `Deprecated`.
- An accepted ADR isn't rewritten; a new ADR supersedes it.

| # | Decision | Status |
|---|---|---|
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions, and plan changes with OpenSpec | Proposed |
| [0002](0002-product-scope-v1.md) | Product scope of v1: game-agnostic tournaments in three formats | Proposed |
| [0003](0003-english-everywhere.md) | English everywhere | Proposed |
| [0004](0004-modular-monolith-of-hexagonal-modules.md) | A modular monolith of hexagonal modules, one per bounded context | Proposed |
| [0005](0005-cqrs-with-wolverine.md) | CQRS inside each module, with Wolverine as the in-process bus | Proposed |
| [0006](0006-tactical-ddd-with-domain-events.md) | Aggregates own the rules and raise domain events, on small building blocks of our own | Proposed |
| [0007](0007-postgresql-ef-core-state-stored.md) | State stored in PostgreSQL with EF Core, one schema per module; no event sourcing for now | Proposed |
| [0008](0008-transactional-outbox-and-inbox.md) | Integration events leave through a transactional outbox, and arrive through an inbox | Proposed |
| [0009](0009-azure-service-bus-through-wolverine.md) | Azure Service Bus through Wolverine; MediatR and MassTransit left out for their licences | Proposed |
| [0010](0010-tests-as-specifications.md) | Tests read as specifications, and run against real PostgreSQL above the domain | Proposed |
| [0011](0011-angular-front-end-and-generated-api-contract.md) | An Angular front end, with the API contract generated from OpenAPI | Proposed |
| [0012](0012-azure-hosting.md) | Host on Azure Container Apps, with managed identity and OpenTofu | Proposed |
