## Context

**Status — 7 November 2026:** in-progress proposal and spike. The architecture consolidation aligns slice boundaries and milestone names only. Messaging storage, transport and code-generation details below remain candidates where their checks are incomplete; the spike is complete; per-module stores fail in Wolverine 6.62.0, so one shared store is used (decided 2026-11-07). No messaging implementation is implied.

Second M0 change, on top of `m0-solution-skeleton` (archived): the five modules exist, empty, each with `Domain`, `Application` and `Adapters` folders and its `AddXxxModule()` entry point in `Adapters`; the host checks database health through `Aspire.Npgsql`. This change wires Wolverine, EF Core and the outbox/inbox (ADRs 0005, 0007, 0008) and a broker (ADR 0009), with no domain yet: base types arrive with the first aggregate in H1.

Decisions taken in exploration (2026-11-06), revised with the spike's findings (2026-11-07).

## Decisions

### One shared message store (decided 2026-11-07 after the spike)

Every module's outbox, inbox and dead letters live in one Wolverine message store in the `wolverine` schema of the `herald` database. A handler's change and its envelopes still commit in one transaction, because the module's `DbContext` and that store share the database. Module schemas hold only module state (ADR 0007).

- Each module's `DbContext` is registered with `AddDbContextWithWolverineIntegration`; Wolverine maps its envelope entities to the store's schema, so a handler's messages are saved in its `SaveChanges`. No module registers a store of its own.
- **Who creates which tables (decided 2026-11-07, answers ADR 0008's follow-up).** Each module's EF Core migrations create its own tables. Wolverine's tables are created by Wolverine through Weasel, never copied into EF migrations: at start-up in Development and tests (`AutoBuildMessageStorageOnStartup`); elsewhere the host runs with `AutoBuildMessageStorageOnStartup = AutoCreate.None`, and `db-apply` (the host exposes JasperFx's commands, as code generation already needs) is an explicit deployment step, with `db-assert` to detect drift. Wiring that step into the Azure pipeline belongs to M4. Rejected: creation at start-up everywhere (the running application would need DDL rights and replicas would race); Wolverine's DDL copied into EF migrations (it drifts with every Wolverine upgrade).
- Each module registers its `DbContext` and handler discovery from its own entry point, keeping the host at one call per module (spike point 5).

Preferred but not possible with Wolverine 6.62.0: one store per module in its own schema (ancillary stores), so a module would own everything it persists (ADR 0004) and could move to its own host with its data. The spike (point 3) found that Wolverine's EF Core integration maps every `DbContext`'s envelope tables to one schema, which leaves envelopes in the wrong module's store: messages are redelivered on restart or stay unhandled. Revisit when Wolverine maps envelopes per `DbContext`; until then, splitting a module out includes moving its in-flight messages out of the shared tables. No upstream issue has been filed.

**Spike first.** Before the rest of the change, a throwaway spike checked (results under Spike findings):

1. Ancillary stores in the **same database, different schemas** work: the API documentation describes them for separate databases.
2. A handler's state change and its outgoing message commit or roll back together in its module's schema.
3. A message from one module to another lands in the receiver's inbox schema, and a redelivery is handled once.
4. Envelope tables through each module's migrations, and the main store's tables (created at startup or by a host migration).
5. Module-level configuration from `AddXxxModule()`.

6. Wolverine's Azure Service Bus transport sends and receives through the emulator started by Aspire (next decision).
7. Host start-up time with dynamic and with pre-generated code (see the code generation decision).

Point 3 failed for per-module stores, so the change uses the shared store above.

### The Azure Service Bus emulator as the local broker

Locally, in CI and in tests that need a broker, Herald runs the Azure Service Bus emulator through Aspire, the first option of ADR 0009's follow-up. The routing is explicit, one topic per publishing module (ADR 0009), and the same code runs locally and in Azure: Wolverine's routing configuration is per transport (`ToAzureServiceBusTopic` is not `ToRabbitExchange`), so a different local broker would leave the Azure routing unexercised until M4.

Topics and subscriptions are declared in the AppHost (`AddServiceBusTopic`, `AddServiceBusSubscription`), from which Aspire generates the emulator's configuration; the AppHost is their only source (decided 2026-11-07). Wolverine provisions nothing: no `AutoProvision`, its system queues are off (`SystemQueuesAreEnabled(false)`), and transports are not set up at start-up (`AddResourceSetupOnStartup` is not used). The emulator would accept Wolverine's administration calls (spike point 6), but that needs a management connection string Aspire does not provide, and two sources of topology would diverge; the same AppHost declarations are the starting point for the Azure resources in M4.

Alternatives:
- **RabbitMQ**, recorded in `m0-solution-skeleton`'s design because it served as a local stand-in for Service Bus with MassTransit in other projects. MassTransit hides the broker behind conventional topology; Wolverine's explicit routing does not, so it would mean two routing configurations. Wolverine's conventional routing would avoid that, at the cost of one topic per message type instead of per module.
- **Wolverine's PostgreSQL transport:** no extra container, but a different transport and semantics from Azure.

If the emulator does not work with Wolverine, the local broker is evaluated again with what the spike found, rather than falling back to a fixed choice.

### Probe modules in tests prove the messaging, with no test code in production

M0 has no domain, so two probe modules that exist only in a test project (a sender and a receiver, each with its own schema, `DbContext` and handler) prove:

1. A handler's row and its outgoing message commit together.
2. When the handler throws, neither the row nor an outgoing envelope remains.
3. A message between them passes through the shared store: the envelope is written in the sender's transaction, marked handled in the receiver's, nothing is left pending afterwards, and nothing is delivered again after a restart; the module schemas hold no envelope tables.
4. A redelivered envelope is handled once within the deduplication window, also after a host restart (redelivered through the sending agent with a fixed envelope id, as found in the spike). The window is set explicitly (`Durability.KeepAfterMessageHandling`) in the shared module hosting, not left at Wolverine's 5-minute default; its value is chosen with the first real integration event.
5. A handler that always throws leaves the message in the receiver's dead letters.

They run against PostgreSQL in Testcontainers over Wolverine's durable local queues, which go through the outbox and inbox without a broker, and wait for delivery with Wolverine's message tracking rather than delays.

Alternatives: technical code (a ping) in real modules, which puts non-domain code in production; or proving the outbox only with H1's first integration event, which leaves M0's exit criterion unmet.

### A shared project plugs a module into the host

The probes prove something only if they are registered exactly like the real modules, so the module registration (its `DbContext`, handler discovery and, later, its topic) is one helper, not a copy per module. It lives in a new project, `Herald.ModuleHosting` (how a module is hosted: the name keeps it from becoming a drawer for anything shared), referenced by the modules and the host. Architecture tests keep `Domain` from depending on it, and it references no module.

This modifies the `module-boundaries` spec, which allows a module to reference only `Herald.BuildingBlocks` and `Herald.Contracts`.

Alternatives: a copy in each `AddXxxModule()` (the tests would prove a sixth copy, not the real ones); `Herald.BuildingBlocks` (Wolverine would reach everything that references it, `Domain` included).

### Wolverine's code: dynamic in development and tests, pre-generated and committed for production

Answers ADR 0005's follow-up. Wolverine generates the code that runs each handler. By environment:

- **Development and tests:** dynamic: generated and compiled with Roslyn on each handler's first use (spike point 7), so a changed handler needs no extra step.
- **Production:** static: the host loads pre-generated types from its own assembly (`Herald.Host/Internal/Generated`, written by `dotnet run -- codegen write`) without compiling anything. There is no start-up check (decided 2026-11-07): in static mode Wolverine knows only the handlers listed in its generated registry, so a handler added without regenerating would fail on first use, and a Herald check would have to repeat Wolverine's handler discovery; the CI check below catches that case before merge. Roslyn is not loaded, which shortens cold starts after scale to zero (ADR 0012) and keeps the AOT option open.
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
  Persistence/               DbContext, mappings, migrations (the module's schema)
```

This change moves each module's entry point to its root and removes the empty `Application` and `Adapters` folders; `Features` appears with the first use case (H1), `Persistence` with each module's `DbContext` here.

The architecture tests change with it: `Domain` depends on no infrastructure (Wolverine, EF Core, Npgsql, ASP.NET Core, `Herald.Contracts`, the shared project); a feature does not depend on another feature; the rule "Application does not depend on Adapters" goes. This modifies the `module-boundaries` spec, together with the shared project above.

Wolverine's HTTP endpoints stay (ADR 0005), so ADR 0005's OpenAPI follow-up is answered here: the receiving probe module exposes one Wolverine endpoint, and a test checks that it appears in the OpenAPI document (`Microsoft.AspNetCore.OpenApi`) with its route and response type. Writing the document at build time and generating the client stay in `m0-web-shell`.

Alternatives: keep the hexagonal layers (the first version of ADR 0004); the same slices named after the hexagon (`Features` as the driving side, `Ports` and `Persistence` as the driven side), dropped in favour of folders that appear only when needed.

### One database health check

The host moves from `Aspire.Npgsql` to Aspire's EF Core integration for PostgreSQL, with each module's `DbContext` on the same `herald` connection, registered through the shared project. `/health` keeps a single database check: five checks against one database add no information and multiply the connections each probe opens. There is no broker health check in M0 (no broker in CI); how Service Bus health reaches the Container Apps probes is decided in M4.

### No broker in CI in M0

The messaging tests above need no broker. The emulator runs through Aspire locally and in the spike (point 6); a test through the broker joins CI with the first real integration event (H1), so pull requests don't start the emulator's two containers before there is routing worth testing.

## Spike findings

Spike in the scratchpad (2026-11-06): two module assemblies, each with a `DbContext` and an ancillary store in its schema of one PostgreSQL 18.3 database, the main store in `wolverine`, durable local queues, Wolverine 6.62.0.

- **Point 1 (same database, different schemas): works.** Six stores start; each module's envelope tables live in its schema.
- **Point 2 (state and message together): works.** A handler that publishes and then throws leaves neither its row nor a delivered message.
- **Point 3 (one store per module): fails; Wolverine 6.62.0 cannot keep each module's envelopes in its own schema (corrected 2026-11-07, after the emulator run).** Root cause, read in the decompiled `Wolverine.EntityFrameworkCore`: `AddDbContextWithWolverineIntegration<T>` replaces EF's model customizer with `WolverineModelCustomizer`, which maps **every** `DbContext`'s envelope tables to the schema of the single `DatabaseSettings` resolved from the container (the last store registered), overriding the module's own `MapWolverineEnvelopeStorage(schema)`; the method's `wolverineDatabaseSchema` argument is never used. Consequences seen in the statement log:
  - *Default mapping* (every context mapped to module B's schema, the last registered): over local queues the incoming row and its `Handled` mark both land in `b`, which looked correct on the first 7 November re-run only because B was the receiver. Over Service Bus, A's transaction writes its outgoing envelope into `b.wolverine_outgoing_envelopes` (atomically with A's row), the sending agent then deletes from `a.wolverine_outgoing_envelopes`, and the orphan in `b` is resent by B's recovery on the next start; B's inbox rejects it as a duplicate only while the deduplication window lasts. With five modules every EF-written envelope would land in the last module's schema.
  - *Each context forced to its own schema* (EF's default customizer restored through `ConfigureDbContext`): the 6 November failure returns: the message is stored as incoming in the **sender's** schema, B marks it handled in its own store, and the row in `a` stays `Incoming` indefinitely.
  - *One shared store* (no ancillary stores; every module's context maps its envelopes to `wolverine`): works over local queues and over the emulator. The statement log shows A's row and the outgoing envelope in one transaction, delivery deleting that same `wolverine` row, B's row and its `Handled` mark in one transaction, nothing left behind, and no redelivery after a restart.
- **Point 3 (redelivery): handled once within the retention window; a test can do it.** A test redelivers through public API: `IWolverineRuntime.Endpoints.GetOrBuildSendingAgent(localQueueUri).StoreAndForwardAsync(envelope)` with a fixed `Envelope.Id`, the message, its type name, `ContentType` and `Options.DefaultSerializer`. A second delivery, and a third after restarting the host, are rejected by the inbox key (`DuplicateIncomingEnvelopeException`, logged at error level by `DurableLocalQueue`) and the handler runs once. Limits: the inbox key is the envelope id alone (`MessageIdentity.IdOnly`, enough while each module has its own inbox table); handled rows are kept for `KeepAfterMessageHandling` (5 minutes by default), after which the same id is handled again; and the same payload under a new envelope id is handled again. Envelope deduplication therefore covers transport redelivery, not a publisher sending the same event twice: that needs the consumer's own idempotency (ADR 0006).
- **Point 5 (module-level configuration): works, differently than planned.** `services.ConfigureWolverine(...)` cannot register a store (Wolverine applies it once the service collection is read-only). A module registers instead on `WolverineOptions` (`opts.AddRegistrationModule()`, with `opts.Services` for its `DbContext`), called inside the host's `UseWolverine`: still one call per module.
- **Code generation:** core Wolverine no longer ships Roslyn; dynamic generation needs `WolverineFx.RuntimeCompilation` (MIT). Static production code can leave it out.
- **Point 4 (migrations): Wolverine's tables do not come from EF Core migrations; Weasel's commands create them.** `MapWolverineEnvelopeStorage` marks the incoming and outgoing tables `ExcludeFromMigrations` and maps no dead-letter tables: it exists so a handler's envelopes join its `SaveChanges`. A module's initial migration therefore holds only its own tables. Each ancillary store needs four tables (`wolverine_incoming_envelopes`, `_outgoing_envelopes`, `_dead_letters`, `_dead_letter_history`); the main store has nine (the four plus nodes, node assignments, node records, agent restrictions and the control queue). Checked sequence: EF migrations create `a."Items"` and `b."Received"`; with `AutoBuildMessageStorageOnStartup = AutoCreate.None` and the host exposing `RunJasperFxCommands`, `db-assert` fails, `db-apply` creates the tables of all three stores, `db-assert` passes, and the host then starts and delivers (point 3 sequence) without creating anything. `db-dump`/`db-patch` cannot select one store: all three share a `DatabaseUri` and the ancillary stores have an empty `SubjectUri`, so there is no per-module SQL export; `db-list` also lists each store three times (cosmetic). Wolverine 6.62.0 with Weasel 9.49.0 and JasperFx 2.100.1.
- **Point 7 (start-up): start-up is the same; pre-generated code saves about 1.8 s on the first message.** Release build, one fresh process per run, local PostgreSQL already prepared, six runs each, times from building the host:

  | Mode | Host started (ms) | First message handled, `CreateItem` → `ItemCreated` (ms) | Roslyn loaded |
  | --- | --- | --- | --- |
  | Dynamic, `WolverineFx.RuntimeCompilation` | 1,225–1,428 | 3,352–3,652 | yes |
  | Static, pre-generated, without `RuntimeCompilation` | 1,253–1,374 | 1,657–1,833 | no |

  Dynamic generation is lazy: it costs nothing at start-up and is paid on the first message of each handler, so with H1's handlers the cold-start penalty after scale to zero grows with the handlers a request touches. The difference is not negligible, so the decision above stands. Other observations: `codegen write` writes to the current directory's `Internal/Generated` unless the output path is set, so the host's must be fixed; deleting a generated file breaks compilation (the generated registry references it); in static mode a handler added without regenerating does **not** stop start-up, it fails on first use with `IndeterminateRoutesException`; `codegen test` compiles in memory and does not compare with the committed files, so the CI check is `codegen write` followed by a diff; `WolverineFx.EntityFrameworkCore` depends on `Microsoft.EntityFrameworkCore.Design`, which copies about 15 MB of Roslyn assemblies into the output even when they are never loaded.
- **Point 6 (emulator): works through Aspire; Wolverine can provision, and does not have to.** Aspire 13.6.4 starts `azure-messaging/servicebus-emulator:2.0.0` with `mssql/server:2022-latest` (it ran within Docker Desktop's 1.92 GB, next to other workloads) and writes the emulator's configuration from `AddServiceBusTopic`/`AddServiceBusSubscription`. With the topic and subscription declared in the AppHost, Wolverine sends and receives over `asb://topic/module-a/module-b` once two things are off: `AddResourceSetupOnStartup` (it also sets up transports, calling the administration API through the AMQP connection string) and Wolverine's system queues (`SystemQueuesAreEnabled(false)`: dead-letter, retries and response queues that the AppHost does not declare). Alternatively `UseAzureServiceBusEmulator(amqp, management).AutoProvision()` creates an undeclared topic, subscription and the system queues through the emulator's administration port (5300); Aspire exposes that port only as its `emulatorhealth` endpoint and passes no management connection string, so the AppHost has to build one from that endpoint.
- **Re-checked with the shared store (2026-11-07):** redelivery behaves as in point 3 (duplicates rejected, also after a restart; a new envelope id is handled again); migrations as in point 4 (`db-assert` fails, `db-apply` creates the nine tables in `wolverine`, `db-assert` passes, the host runs with `AutoCreate.None`). With one store, `db-dump` now exports its SQL.

## Risks / Trade-offs

- [Messages belong to no module] → accepted until Wolverine maps envelopes per `DbContext` (decision above); module state stays in module schemas and the architecture rules on modules are unchanged.
- [Wolverine's EF Core integration decides the envelope schema globally] → the probe tests check where envelopes land, so an upgrade that changes it fails a test.
- [The emulator needs two containers (the emulator and its SQL engine) and noticeable memory] → accepted for parity with Azure; measured in the spike.

## Open Questions

None from the spike. The deduplication window's value is chosen with the first real integration event (H1).
