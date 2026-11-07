## 1. Spike (throwaway, outside the solution)

- [x] 1.1 In the scratchpad, a console host with Wolverine 6.62.0, two "modules" (assemblies) with a `DbContext` each and an ancillary store in their own schema of one PostgreSQL database, plus the main store in `wolverine`
- [x] 1.2 Check that a handler's row and its published message commit or roll back together in its module's schema (design point 2) and that a message between the two lands in the receiver's inbox schema (point 3)
- [x] 1.3 Check whether a test can redeliver an envelope with the same id and see it handled once (point 3); if not, record how the requirement is tested instead
- [x] 1.4 Check the envelope tables through each module's EF Core migrations (`MapWolverineEnvelopeStorage`) and how the main store's tables are created (point 4)
- [x] 1.5 Check that each module configures its store and routing from its own registration (a Wolverine extension through DI), with the host calling one method per module (point 5)
- [x] 1.6 Start the Azure Service Bus emulator with Aspire (`AddAzureServiceBus().RunAsEmulator()`, topics and subscriptions declared in the AppHost) and send and receive through Wolverine's transport; record whether Wolverine's provisioning must be turned off (point 6)
- [x] 1.7 Measure host start-up with dynamic and with pre-generated code (point 7)
- [x] 1.8 Record the findings and the pinned versions in `design.md`; if points 1–2 or 6 fail, stop and revise the design with the maintainer before going on

## 2. Modules as vertical slices and Herald.ModuleHosting

- [x] 2.1 Move each module's entry point to its root (namespace `Herald.<Module>`), remove the empty `Application` and `Adapters` folders, and update the host's usings
- [x] 2.2 Create `Herald.ModuleHosting` (referenced by modules and host) with the module registration found in the spike, called inside the host's `UseWolverine`: discovery of the module's handlers and endpoints (its `DbContext` registration joins it in 3.2, with the first `DbContext`)
- [x] 2.3 Update the architecture tests to the `module-boundaries` spec: entry point at the root, domain independence, feature independence including nested namespaces, no Persistence-to-Features dependency, shared-project limits; remove the Application/Adapters rule
- [x] 2.4 Prove the checks with representative passing and failing fixtures, including nested feature dependencies, an unused forbidden project reference and, once modules have a `DbContext`, a table outside the module schema; state separately what namespace, project and schema checks prove

## 3. Persistence and Wolverine in the host

- [x] 3.1 Add the packages to `Directory.Packages.props` with the versions pinned in the spike, checking each licence
- [x] 3.2 Give each module a `Persistence/<Module>DbContext` in its schema, registered through `Herald.ModuleHosting` with Wolverine's EF Core integration, with the envelope entities mapped to the shared store by Wolverine (they stay out of migrations), a design-time factory and an initial migration holding only the module's own tables
- [x] 3.3 Configure Wolverine in the host: one shared store in `wolverine`, EF Core transactions, durable local queues, Wolverine HTTP endpoints, the Service Bus transport with one topic per publishing module (no provisioning, system queues off), migrations applied and Wolverine's tables created at start-up in Development and tests, `AutoCreate.None` elsewhere, and JasperFx's commands (`db-apply`, `db-assert`, `codegen`) run from the host
- [x] 3.4 Keep `Aspire.Npgsql`: the five contexts and Wolverine's store use its `herald` data source, keeping a single database health check; the health tests pass, the unavailable-database one now pausing the database after start-up (Wolverine `Balanced` needs the database to start)
- [x] 3.5 Add the Service Bus emulator to the AppHost with the modules' topics and subscriptions; run the AppHost and confirm in the dashboard that PostgreSQL, the emulator and the host are running and healthy

## 4. Messaging tests with probe modules

- [x] 4.1 Create `tests/Herald.Messaging.Tests` with a sender and a receiver probe module registered through `Herald.ModuleHosting`, against PostgreSQL in Testcontainers, waiting with Wolverine's message tracking
- [x] 4.2 Test that a handler's change and its message commit together and the message is delivered
- [x] 4.3 Test that a throwing handler leaves neither the change nor an outgoing envelope
- [x] 4.4 Test that a message between the probes is recorded in `wolverine` and in no module schema, leaves nothing pending, and is not delivered again after a host restart
- [x] 4.5 Test that a redelivered message is handled once within the explicitly configured deduplication window, including after a host restart (as found in 1.3)
- [x] 4.6 Test that a message whose handler always throws ends in the dead letters with its receiving endpoint
- [x] 4.7 Give the receiver probe a Wolverine HTTP endpoint and test that it appears in the OpenAPI document with its route, method and response type

## 5. Generated code

- [x] 5.1 Configure dynamic code generation in Development and tests, static elsewhere, and fix the generated code's output path to `Herald.Host/Internal/Generated`
- [x] 5.2 Generate and commit the code in `Herald.Host/Internal/Generated`, exclude it from `dotnet format`, and confirm the host starts in Production on it (static, application assembly `Herald.Host`); with no handler in any module yet the code is two empty registries, so handling a message in Production is first confirmed with H1's first handler
- [x] 5.3 Add the CI step that regenerates the code and fails on a difference; confirm it fails on a pull request that changes a handler without regenerating

## 6. Docs

- [x] 6.1 Revise ADR 0005 (follow-ups: pre-generated code in production; Wolverine endpoints in OpenAPI), ADR 0008 (module tables through EF migrations, Wolverine's tables through `db-apply` outside Development, one shared store and why per-module stores were set aside) and ADR 0009 (the emulator through Aspire, the AppHost as the only topology source), all still Proposed
- [x] 6.2 `CLAUDE.md` commands: add a migration to a module, apply and check Wolverine's tables (`db-apply`, `db-assert`), regenerate Wolverine's code; Status
- [x] 6.3 `docs/roadmap.md`: mark `m0-messaging`
