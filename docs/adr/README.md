# Architecture decision records

One significant decision per record: context, decision, alternatives and consequences, good and bad.

- Numbered in order, never renumbered.
- Status: `Proposed`, `Accepted`, `Superseded by NNNN`, `Deprecated`.
- Proposed records can be refined. Accepted decisions normally change through a superseding ADR. The maintainer authorised an in-place pre-development consolidation on 7 November 2026 (ADR 0001); revised records identify it. This does not accept every proposed detail.
- Decision status and implementation status are separate. `openspec/specs/` describes the implemented skeleton; active changes describe migrations and new capabilities. ADR 0004's vertical slices and the messaging decisions of ADRs 0005, 0008 and 0009 are implemented in the `m0-messaging` branch, pending its review and archive; no production Angular workspace exists.

| # | Decision | Status |
|---|---|---|
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions, and plan changes with OpenSpec | Proposed |
| [0002](0002-product-scope-v1.md) | Game-agnostic foundation and historical delivery scope | Superseded for scope by 0013 |
| [0003](0003-english-everywhere.md) | English everywhere | Proposed |
| [0004](0004-modular-monolith-with-vertical-slices.md) | Modular monolith, vertical slices, protected domain and explicit reuse/coordination | Proposed; direction confirmed |
| [0005](0005-cqrs-with-wolverine.md) | CQRS inside each module, with Wolverine as the in-process bus | Proposed |
| [0006](0006-tactical-ddd-with-domain-events.md) | Aggregates own the rules and raise domain events, on small building blocks of our own | Proposed |
| [0007](0007-postgresql-ef-core-state-stored.md) | State stored in PostgreSQL with EF Core, one schema per module; no event sourcing for now | Proposed |
| [0008](0008-transactional-outbox-and-inbox.md) | Integration events leave through a transactional outbox, and arrive through an inbox | Proposed |
| [0009](0009-azure-service-bus-through-wolverine.md) | Azure Service Bus through Wolverine; MediatR and MassTransit left out for their licences | Proposed |
| [0010](0010-tests-as-specifications.md) | Tests read as specifications, and run against real PostgreSQL above the domain | Proposed |
| [0011](0011-angular-front-end-and-generated-api-contract.md) | Two Angular apps, functional features, shared UI and generated API contracts | Proposed; rendering/features direction confirmed |
| [0012](0012-azure-hosting.md) | Host on Azure Container Apps, with managed identity and OpenTofu | Proposed |
| [0013](0013-functional-delivery-scope.md) | Functional delivery with identity and direct teams from H1 | Accepted |
