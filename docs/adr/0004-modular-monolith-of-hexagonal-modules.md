# 0004. A modular monolith of hexagonal modules, one per bounded context

- Status: Proposed
- Date: 2026-11-06

## Context

Tournaments split into contexts with their own language and rules. **Registration** cares about capacity, a waiting list and a deadline. **Competition** cares about rounds, matches, results and who advances. **Standings** answers "who is first?" and "what is the bracket now?", and changes only because something happened elsewhere.

The domain logic has to be testable without a database, a broker or HTTP, and replaceable infrastructure is part of what Herald shows: results could come from players, from an organiser or from a simulator.

Herald is maintained by one person and runs on a small budget.

## Decision

Build one deployable host with one module per bounded context: `Herald.Registration`, `Herald.Competition`, `Herald.Standings`. Each module is hexagonal (ports and adapters):

- `Domain`: aggregates, value objects, domain events and policies. It references only `Herald.BuildingBlocks`, no framework.
- `Application`: `Commands`, `Queries` and `Ports` (the interfaces the use cases need, such as a result source or a clock).
- `Adapters`: inbound (HTTP endpoints, message handlers) and outbound (EF Core persistence, messaging, external sources).

Modules never reference each other. They share only `Herald.Contracts`, the integration events that form their published language. Each module owns its PostgreSQL schema; there are no joins across schemas.

The rules are enforced by architecture tests (dependencies between namespaces and projects), not only by convention.

## Alternatives considered

- **Microservices:** independent deployment and scaling that one maintainer doesn't need, at the cost of more infrastructure, more pipelines and distributed debugging from day one. The module boundaries keep the option open.
- **A layered application** (controllers, services, repositories across the whole app): simpler at first, but the boundaries between contexts are invisible and the domain tends to depend on persistence.
- **One project per layer per module** (`Domain`, `Application`, `Adapters` as separate assemblies): the compiler enforces the dependencies, but nine projects for three modules is ceremony at this size; architecture tests give the same guarantee.

## Consequences

- Positive: the domain is tested on its own; a module could become a service by moving its adapters, not its logic; one host keeps local runs and costs simple.
- Negative: one process means one failure domain and one deployment; the boundaries depend on tests and discipline.
- Follow-ups: split a module into its own host only when a measured need appears, with a new ADR.
