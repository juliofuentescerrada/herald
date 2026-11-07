# 0004. A modular monolith of modules with the domain at the centre and vertical slices around it

- Status: Proposed
- Date: 2026-11-06
- Consolidated: 2026-11-07

## Context

Tournaments split into contexts with their own language and rules. An **organisation** (a shop, club or community) owns its members, their permissions and its tournaments. A **tournament** is configured, published and moves through its lifecycle. **Registration** cares about capacity, a waiting list and a deadline. **Competition** cares about rounds, matches, results and who advances. **Standings** answers "who is first?" and "what is the bracket now?", and changes only because something happened elsewhere.

Those boundaries come from early discovery (`docs/herald-functional-discovery.md`, §4), which itself says its areas are not automatically bounded contexts. They will move as the domain is designed in detail; the architecture has to absorb that without being rewritten.

The domain logic has to be testable without a database, a broker or HTTP, and replaceable infrastructure is part of what Herald shows: results could come from players, from an organiser or from a simulator.

Handlers and HTTP endpoints run through Wolverine (ADR 0005), where an endpoint is a handler: the HTTP entry point and the use case are one method.

Herald is maintained by one person and runs on a small budget.

## Decision

Build one deployable host with one module per bounded context. Inside a module, the domain is at the centre and the use cases are vertical slices around it:

- `Domain`: aggregates, value objects, domain events and policies. It references only `Herald.BuildingBlocks`, no framework.
- `Features`: one namespace per use case, holding its request, validation, Wolverine endpoint/handler and response contract. Start with one file; use a folder when a slice needs several cohesive files. A command enforces business invariants through aggregates; a query projects directly to its read model (ADR 0005). A feature never depends on another feature, including its request or handler types.
- `Persistence`: the module's EF Core `DbContext`, its mappings and migrations, in the module's own schema (ADR 0007).
- The module's entry point at its root (`RegistrationModule.AddRegistrationModule()`), the single place it plugs into the host.

Features may use their module's domain and persistence directly. Do not introduce global `Commands`, `Queries`, `Validators`, `Services` or repository layers that scatter a use case across technical categories. Persistence depends on domain concepts, not on feature handlers. Module composition may wire every part together; it contains no business workflow.

An interface to something outside Herald (a result source, a clock) is a port declared where its responsibility belongs: in the feature for a use-case-specific dependency, or in `Domain` for a domain policy. Its implementation lives with the relevant technical concern. Folders appear with their first file.

**Reuse follows responsibility.** Shared business concepts, invariants and policies belong in `Domain`. Persistence helpers remain in `Persistence`; hosting belongs in `Herald.ModuleHosting` when introduced by `m0-messaging`. HTTP contracts, technical validation and authorisation mechanisms do not become domain logic because two features use them. Extract a narrowly named module-local capability only for demonstrated reuse, with explicit permitted dependencies; do not create a general shared-services layer. A feature must not invoke another feature's handler to compose a workflow.

Modules never reference each other. Their published language is the integration events in `Herald.Contracts`, separate from HTTP DTOs owned by features. Shared technical projects do not provide back doors into another module's data or use cases. `Herald.ModuleHosting` may configure modules but knows no module or business rule. Each module owns its PostgreSQL schema; there are no joins across schemas.

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

**Cross-module workflows have an owner.** Tournaments owns publication/start/finalisation intent; Registration supplies authoritative admission and readiness facts; Competition supplies effective match/result facts; Standings supplies a revisioned projection. Each H1 slice defines the authoritative conditions, reviewed revisions, operation outcome and coordination needed before making a transition effective. A stale projection cannot authorise a competitive transition. Detailed coordination is specified with that use case, without cross-schema reads or feature-to-feature calls. Reconsider a boundary if its invariants cannot be expressed coherently.

Organisation scope and the responsible actor enter through the application boundary and are validated for each operation, including direct API access. Each owning module preserves the required business revisions and authorship (ADR 0007). These responsibilities apply from H1, independently of later participant collaboration.

**Implementation status:** this is the target design. The implemented M0 skeleton still has `Application`/`Adapters` and the corresponding accepted specifications. `m0-messaging` contains the explicit migration and architecture-test delta. The vertical-slice direction is confirmed; detailed implementation and remaining Proposed decisions still follow their change's review gates.

## Alternatives considered

- **Microservices:** independent deployment and scaling that one maintainer doesn't need, at the cost of more infrastructure, more pipelines and distributed debugging from day one. The module boundaries keep the option open.
- **A layered application** (controllers, services, repositories across the whole app): simpler at first, but the boundaries between contexts are invisible and the domain tends to depend on persistence.
- **Hexagonal layers inside each module** (`Application` with commands, queries and ports; `Adapters` with endpoints and persistence): the first version of this ADR. With Wolverine's endpoints the HTTP adapter and the use case are the same method, so the split between the two layers is artificial, and `Adapters` becomes a drawer for unrelated things. The domain at the centre and the ports to the outside, which are what the hexagon protects, remain.
- **One project per part of a module** (`Domain` as its own assembly): project references let the compiler enforce some boundaries, but more projects per module add ceremony at this size. Namespace and project checks with representative violation fixtures verify the chosen rules in CI; they do not replace separate database and organisation-isolation checks.
- **Fixing the list of modules in this ADR:** a clear map, but every boundary found in detailed design would mean superseding an architectural decision whose rules did not change.

## Consequences

- Positive: the domain is tested on its own; a use case stays cohesive; a module could become a service by moving it whole; one host keeps local runs and costs simple; boundaries can move without an ADR.
- Negative: one process means one failure domain and one deployment; the boundaries depend on tests and discipline; moving a boundary after data exists means migrating data between schemas; a feature may combine HTTP and use-case code, and application invocations must preserve the configured validation/transaction pipeline.
- Follow-ups: organisation-data isolation and authority with the first H1 persistence/access slice; ownership and revision conditions with the first cross-module operation; demonstrate domain, project and feature boundaries with negative architecture-test fixtures. Detailed messaging remains in `m0-messaging`. Split a module into its own host only when a measured need appears, with a new ADR.
