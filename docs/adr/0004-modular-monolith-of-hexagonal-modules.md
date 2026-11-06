# 0004. A modular monolith of modules with the domain at the centre and vertical slices around it

- Status: Proposed
- Date: 2026-11-06

## Context

Tournaments split into contexts with their own language and rules. An **organisation** (a shop, club or community) owns its members, their permissions and its tournaments. A **tournament** is configured, published and moves through its lifecycle. **Registration** cares about capacity, a waiting list and a deadline. **Competition** cares about rounds, matches, results and who advances. **Standings** answers "who is first?" and "what is the bracket now?", and changes only because something happened elsewhere.

Those boundaries come from early discovery (`docs/herald-functional-discovery.md`, §4), which itself says its areas are not automatically bounded contexts. They will move as the domain is designed in detail; the architecture has to absorb that without being rewritten.

The domain logic has to be testable without a database, a broker or HTTP, and replaceable infrastructure is part of what Herald shows: results could come from players, from an organiser or from a simulator.

Handlers and HTTP endpoints run through Wolverine (ADR 0005), where an endpoint is a handler: the HTTP entry point and the use case are one method.

Herald is maintained by one person and runs on a small budget.

## Decision

Build one deployable host with one module per bounded context. Inside a module, the domain is at the centre and the use cases are vertical slices around it:

- `Domain`: aggregates, value objects, domain events and policies. It references only `Herald.BuildingBlocks`, no framework.
- `Features`: one file per use case, holding its command or query and the Wolverine endpoint or handler that runs it (with its validation). A command goes through an aggregate; a query projects to a read model (ADR 0005). A feature never depends on another feature: what two features share belongs in `Domain`.
- `Persistence`: the module's EF Core `DbContext`, its mappings and migrations, in the module's own schema (ADR 0007).
- The module's entry point at its root (`RegistrationModule.AddRegistrationModule()`), the single place it plugs into the host.

An interface to something outside Herald (a result source, a clock) is a port: it is declared where it is used (in the feature, or in `Domain` for a policy) and implemented next to `Persistence`, and gets its own folder only once there are several. Folders appear with their first file.

Modules never reference each other. They share only `Herald.Contracts`, the integration events that form their published language. Each module owns its PostgreSQL schema; there are no joins across schemas.

The rules are enforced by architecture tests (dependencies between namespaces and projects), not only by convention: `Domain` depends on no infrastructure, features don't depend on each other, modules don't depend on each other.

**The set of modules is not part of this decision.** It starts as the contexts known today and changes as the design gets more concrete:

| Module | Owns, initially |
|---|---|
| `Herald.Organisations` | Organisations, their members and the permissions they grant per organisation and tournament |
| `Herald.Tournaments` | Tournament configuration, publication, visibility and lifecycle |
| `Herald.Registration` | Entries, capacity, waiting list and check-in |
| `Herald.Competition` | Stages, rounds, matches, results and advancement |
| `Herald.Standings` | Read models: tables, brackets and their explanation |

The OpenSpec change that needs to add, merge, split or rename a module does so and gives its reason in its `design.md`; the list lives in the architecture tests and the README. Platform moderation and team identity are known candidates, not created until a change needs them. Only a change to the rules above needs a new ADR.

## Alternatives considered

- **Microservices:** independent deployment and scaling that one maintainer doesn't need, at the cost of more infrastructure, more pipelines and distributed debugging from day one. The module boundaries keep the option open.
- **A layered application** (controllers, services, repositories across the whole app): simpler at first, but the boundaries between contexts are invisible and the domain tends to depend on persistence.
- **Hexagonal layers inside each module** (`Application` with commands, queries and ports; `Adapters` with endpoints and persistence): the first version of this ADR. With Wolverine's endpoints the HTTP adapter and the use case are the same method, so the split between the two layers is artificial, and `Adapters` becomes a drawer for unrelated things. The domain at the centre and the ports to the outside, which are what the hexagon protects, remain.
- **One project per part of a module** (`Domain` as its own assembly): the compiler enforces the domain's independence, but more projects per module is ceremony at this size; architecture tests give the same guarantee.
- **Fixing the list of modules in this ADR:** a clear map, but every boundary found in detailed design would mean superseding an architectural decision whose rules did not change.

## Consequences

- Positive: the domain is tested on its own; a use case reads in one file; a module could become a service by moving it whole; one host keeps local runs and costs simple; boundaries can move without an ADR.
- Negative: one process means one failure domain and one deployment; the boundaries depend on tests and discipline; moving a boundary after data exists means migrating data between schemas; a feature file mixes HTTP and use-case code, so the use case is reached through Wolverine, not a plain method call.
- Follow-ups: how organisation-owned data is isolated and authorised across modules (an organisation id on each aggregate, row-level security, or other), in an ADR with the first change that stores it (M1). Split a module into its own host only when a measured need appears, with a new ADR.
