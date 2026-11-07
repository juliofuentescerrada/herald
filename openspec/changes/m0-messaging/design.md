## Context

**Status — 7 November 2026:** in-progress proposal and spike. The architecture consolidation aligns slice boundaries and milestone names only. Messaging storage, transport and code-generation details below remain candidates where their checks are incomplete; the recorded inbox failure is unresolved and belongs to this change. No messaging implementation is implied.

Second M0 change, on top of `m0-solution-skeleton` (archived): the five modules exist, empty, each with `Domain`, `Application` and `Adapters` folders and its `AddXxxModule()` entry point in `Adapters`; the host checks database health through `Aspire.Npgsql`. This change wires Wolverine, EF Core and the outbox/inbox (ADRs 0005, 0007, 0008) and a broker (ADR 0009), with no domain yet: base types arrive with the first aggregate in H1.

Decisions taken in exploration (2026-11-06), to be confirmed by the spike where marked.

## Decisions

### One message store per module

Each module keeps its outbox, inbox and dead letters in its own PostgreSQL schema, next to its tables, so a module owns everything it persists (ADR 0004) and could move to its own host with its data.

Wolverine 6.62.0 supports this as ancillary message stores (checked in the package's API documentation, not yet in code):

- The host registers the **main store** in a `wolverine` schema. Wolverine requires one; it holds node and agent information only, no module's messages. It is the host's schema, not a module's.
- Each module registers an **ancillary store** in its schema (`PersistMessagesWithPostgresql(..., schemaName, MessageStoreRole.Ancillary)`), enrols its `DbContext` in it (`Enroll<TDbContext>()`), and routes every handler and endpoint of its assembly to it (`Policies.UseAncillaryStorageFromAssemblyContaining<T>(...)`).
- A message crossing modules is stored in the sender's outbox and in the receiver's inbox: Wolverine assigns an incoming envelope to the store of the handler that receives it.
- The envelope tables are part of each module's EF Core model (`MapWolverineEnvelopeStorage(modelBuilder, schema)`), so each module's migrations create them. This is the candidate answer to ADR 0008's follow-up (migrations, not creation at startup), pending spike point 4.
- Each module configures its store from its own entry point, keeping the host at one call per module; the mechanism (a Wolverine extension registered through DI) is confirmed by the spike.

Alternative: one shared store in a `wolverine` schema for every module. Simpler to configure and one set of recovery agents, but the outbox and inbox belong to no module, and splitting a module out would mean moving its messages out of a shared table.

**Spike first.** Before the rest of the change, a throwaway spike checks:

1. Ancillary stores in the **same database, different schemas** work: the API documentation describes them for separate databases.
2. A handler's state change and its outgoing message commit or roll back together in its module's schema.
3. A message from one module to another lands in the receiver's inbox schema, and a redelivery is handled once.
4. Envelope tables through each module's migrations, and the main store's tables (created at startup or by a host migration).
5. Module-level configuration from `AddXxxModule()`.

6. Wolverine's Azure Service Bus transport sends and receives through the emulator started by Aspire (next decision).
7. Host start-up time with dynamic and with pre-generated code (see the code generation decision).

If 1 or 2 fails, fall back to one shared store and record why here.

### The Azure Service Bus emulator as the local broker

Locally, in CI and in tests that need a broker, Herald runs the Azure Service Bus emulator through Aspire, the first option of ADR 0009's follow-up. The routing is explicit, one topic per publishing module (ADR 0009), and the same code runs locally and in Azure: Wolverine's routing configuration is per transport (`ToAzureServiceBusTopic` is not `ToRabbitExchange`), so a different local broker would leave the Azure routing unexercised until M4.

Topics and subscriptions are declared in the AppHost (`AddServiceBusTopic`, `AddServiceBusSubscription`), from which Aspire generates the emulator's configuration. If the emulator does not support the administration calls Wolverine uses to provision them, Wolverine's provisioning is turned off locally and the AppHost declaration is the source; the spike checks which.

Alternatives:
- **RabbitMQ**, recorded in `m0-solution-skeleton`'s design because it served as a local stand-in for Service Bus with MassTransit in other projects. MassTransit hides the broker behind conventional topology; Wolverine's explicit routing does not, so it would mean two routing configurations. Wolverine's conventional routing would avoid that, at the cost of one topic per message type instead of per module.
- **Wolverine's PostgreSQL transport:** no extra container, but a different transport and semantics from Azure.

If the emulator does not work with Wolverine, the local broker is evaluated again with what the spike found, rather than falling back to a fixed choice.

### Probe modules in tests prove the messaging, with no test code in production

M0 has no domain, so two probe modules that exist only in a test project (a sender and a receiver, each with its own schema, `DbContext`, store and handler) prove:

1. A handler's row and its outgoing message commit together.
2. When the handler throws, neither the row nor an outgoing envelope remains.
3. The sent envelope is in the sender's schema and the received one in the receiver's, none in `wolverine`.
4. A redelivered envelope is handled once (whether Wolverine lets a test redeliver an envelope with the same id is checked in the spike).
5. A handler that always throws leaves the message in the receiver's dead letters.

They run against PostgreSQL in Testcontainers over Wolverine's durable local queues, which go through the outbox and inbox without a broker, and wait for delivery with Wolverine's message tracking rather than delays.

Alternatives: technical code (a ping) in real modules, which puts non-domain code in production; or proving the outbox only with H1's first integration event, which leaves M0's exit criterion unmet.

### A shared project plugs a module into the host

The probes prove something only if they are registered exactly like the real modules, so the module registration (its store, `DbContext`, handler routing and, later, its topic) is one helper, not a copy per module. It lives in a new project, `Herald.ModuleHosting` (how a module is hosted: the name keeps it from becoming a drawer for anything shared), referenced by the modules and the host. Architecture tests keep `Domain` from depending on it, and it references no module.

This modifies the `module-boundaries` spec, which allows a module to reference only `Herald.BuildingBlocks` and `Herald.Contracts`.

Alternatives: a copy in each `AddXxxModule()` (the tests would prove a sixth copy, not the real ones); `Herald.BuildingBlocks` (Wolverine would reach everything that references it, `Domain` included).

### Wolverine's code: dynamic in development and tests, pre-generated and committed for production

Answers ADR 0005's follow-up. Wolverine generates the code that runs each handler. By environment:

- **Development and tests:** dynamic: generated and compiled with Roslyn at start-up, so a changed handler needs no extra step.
- **Production:** static: the host loads pre-generated types from its own assembly (`Herald.Host/Internal/Generated`, written by `dotnet run -- codegen write`) and asserts at start-up that every expected type exists, so a missing regeneration stops the host instead of failing later. Roslyn is not loaded, which shortens cold starts after scale to zero (ADR 0012) and keeps the AOT option open.
- **The generated code is committed, and CI regenerates it and fails on a difference**: the same pattern as the generated API client (ADR 0011). A reader can see what Wolverine does under the hood.

Alternatives: dynamic everywhere (no generated files, slower cold starts and Roslyn in memory); static code generated when the image is built in M4 (no files in pull requests, but production code nobody reviewed, and a second pattern for generated code); Wolverine's `Auto` mode (convenient, but it writes missing files at run time and can hide them).

The spike measures start-up in both modes (point 7). If the difference is negligible, generating at image build time or dynamic everywhere is reconsidered with those numbers.

### Modules become vertical slices around the domain

ADR 0004 is revised (still Proposed): with Wolverine's endpoints the HTTP entry point and the use case are one method, so the `Application` / `Adapters` split inside a module is replaced by:

```
Herald.Registration/
  RegistrationModule.cs      entry point, at the root (namespace Herald.Registration)
  Domain/                    aggregates, value objects, events, policies; no infrastructure
  Features/                  one namespace (one file or cohesive folder) per use case: request, validation, endpoint/handler and response
  Persistence/               DbContext, mappings, migrations, envelope tables (the module's schema)
```

This change moves each module's entry point to its root and removes the empty `Application` and `Adapters` folders; `Features` appears with the first use case (H1), `Persistence` with each module's `DbContext` here.

The architecture tests change with it: `Domain` depends on no infrastructure (Wolverine, EF Core, Npgsql, ASP.NET Core, `Herald.Contracts`, the shared project); a feature does not depend on another feature; the rule "Application does not depend on Adapters" goes. This modifies the `module-boundaries` spec, together with the shared project above.

Wolverine's HTTP endpoints stay (ADR 0005), so ADR 0005's OpenAPI follow-up is answered here: the receiving probe module exposes one Wolverine endpoint, and a test checks that it appears in the OpenAPI document (`Microsoft.AspNetCore.OpenApi`) with its route and response type. Writing the document at build time and generating the client stay in `m0-web-shell`.

Alternatives: keep the hexagonal layers (the first version of ADR 0004); the same slices named after the hexagon (`Features` as the driving side, `Ports` and `Persistence` as the driven side), dropped in favour of folders that appear only when needed.

### One database health check

The host moves from `Aspire.Npgsql` to Aspire's EF Core integration for PostgreSQL, with each module's `DbContext` on the same `herald` connection, registered through the shared project. `/health` keeps a single database check: five checks against one database add no information and multiply the connections each probe opens. There is no broker health check in M0 (no broker in CI); how Service Bus health reaches the Container Apps probes is decided in M4.

### No broker in CI in M0

The messaging tests above need no broker. The emulator runs through Aspire locally and in the spike (point 6); a test through the broker joins CI with the first real integration event (H1), so pull requests don't start the emulator's two containers before there is routing worth testing.

## Spike findings (in progress)

Spike in the scratchpad (2026-11-06): two module assemblies, each with a `DbContext` and an ancillary store in its schema of one PostgreSQL 18.3 database, the main store in `wolverine`, durable local queues, Wolverine 6.62.0.

- **Point 1 (same database, different schemas): works.** Six stores start; each module's envelope tables live in its schema.
- **Point 2 (state and message together): works.** A handler that publishes and then throws leaves neither its row nor a delivered message.
- **Point 3 (receiver's inbox): fails over local queues.** A message published by module A's handler and handled by module B is stored as incoming in **A's** schema; B's handler commits in B's schema and marks the envelope handled in B's store, where it has no row. The row in A stays `Incoming`, unowned, and A's recovery agent delivers it again on every restart: in the spike B handled it twice. Dead letters, in contrast, land in the receiver's schema.
- **Point 5 (module-level configuration): works, differently than planned.** `services.ConfigureWolverine(...)` cannot register a store (Wolverine applies it once the service collection is read-only). A module registers instead on `WolverineOptions` (`opts.AddRegistrationModule()`, with `opts.Services` for its `DbContext`), called inside the host's `UseWolverine`: still one call per module.
- **Code generation:** core Wolverine no longer ships Roslyn; dynamic generation needs `WolverineFx.RuntimeCompilation` (MIT). Static production code can leave it out.
- Not yet run: points 4 (migrations), 6 (emulator), 7 (start-up times).

## Risks / Trade-offs

- [Ancillary stores are documented for separate databases] → the spike checks same-database schemas before anything depends on it.
- [One set of durability agents per store: six stores polling PostgreSQL] → measure in the spike; matters for scale to zero and cold starts in M4.
- [The `wolverine` schema belongs to the host, not a module] → it holds no module data; the architecture rules on modules are unchanged.
- [The emulator needs two containers (the emulator and its SQL engine) and noticeable memory] → accepted for parity with Azure; measured in the spike.

## Open Questions

The receiver-inbox failure recorded above, redelivery behaviour, migrations, emulator integration and start-up measurements remain open in this messaging investigation. Reconcile the candidate design, specifications and unchecked tasks with the spike evidence before implementation. The documentation consolidation does not choose a resolution or declare these details accepted.
