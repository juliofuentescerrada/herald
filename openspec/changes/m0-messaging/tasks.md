## 1. Spike (throwaway, outside the solution)

- [x] 1.1 In the scratchpad, a console host with Wolverine 6.62.0, two "modules" (assemblies) with a `DbContext` each and an ancillary store in their own schema of one PostgreSQL database, plus the main store in `wolverine`
- [ ] 1.2 Check that a handler's row and its published message commit or roll back together in its module's schema (design point 2) and that a message between the two lands in the receiver's inbox schema (point 3)
- [ ] 1.3 Check whether a test can redeliver an envelope with the same id and see it handled once (point 3); if not, record how the requirement is tested instead
- [ ] 1.4 Check the envelope tables through each module's EF Core migrations (`MapWolverineEnvelopeStorage`) and how the main store's tables are created (point 4)
- [x] 1.5 Check that each module configures its store and routing from its own registration (a Wolverine extension through DI), with the host calling one method per module (point 5)
- [ ] 1.6 Start the Azure Service Bus emulator with Aspire (`AddAzureServiceBus().RunAsEmulator()`, topics and subscriptions declared in the AppHost) and send and receive through Wolverine's transport; record whether Wolverine's provisioning must be turned off (point 6)
- [ ] 1.7 Measure host start-up with dynamic and with pre-generated code (point 7)
- [ ] 1.8 Record the findings and the pinned versions in `design.md`; if points 1–2 or 6 fail, stop and revise the design with the maintainer before going on

## 2. Modules as vertical slices and Herald.ModuleHosting

- [ ] 2.1 Move each module's entry point to its root (namespace `Herald.<Module>`), remove the empty `Application` and `Adapters` folders, and update the host's usings
- [ ] 2.2 Create `Herald.ModuleHosting` (referenced by modules and host) with the module registration found in the spike: store in the module's schema, `DbContext`, routing of the module's handlers and endpoints
- [ ] 2.3 Update the architecture tests to the `module-boundaries` spec: entry point at the root, domain independence, feature independence including nested namespaces, no Persistence-to-Features dependency, shared-project limits; remove the Application/Adapters rule
- [ ] 2.4 Prove the checks with representative passing and failing fixtures, including nested feature dependencies and an unused forbidden project reference; state separately what namespace, project and database checks prove

## 3. Persistence and Wolverine in the host

- [ ] 3.1 Add the packages to `Directory.Packages.props` with the versions pinned in the spike, checking each licence
- [ ] 3.2 Give each module a `Persistence/<Module>DbContext` in its schema, with the envelope tables mapped, a design-time factory and an initial migration
- [ ] 3.3 Configure Wolverine in the host: main store in `wolverine`, EF Core transactions, durable local queues, Wolverine HTTP endpoints, the Service Bus transport with one topic per publishing module, migrations applied at start-up in Development
- [ ] 3.4 Replace `Aspire.Npgsql` with Aspire's EF Core integration for the five contexts on the `herald` connection, keeping a single database health check; the existing health tests still pass
- [ ] 3.5 Add the Service Bus emulator to the AppHost with the modules' topics and subscriptions; run the AppHost and confirm in the dashboard that PostgreSQL, the emulator and the host are running and healthy

## 4. Messaging tests with probe modules

- [ ] 4.1 Create `tests/Herald.Messaging.Tests` with a sender and a receiver probe module registered through `Herald.ModuleHosting`, against PostgreSQL in Testcontainers, waiting with Wolverine's message tracking
- [ ] 4.2 Test that a handler's change and its message commit together and the message is delivered
- [ ] 4.3 Test that a throwing handler leaves neither the change nor an outgoing envelope
- [ ] 4.4 Test that the sent envelope is in the sender's schema, the received one in the receiver's, and none in `wolverine`
- [ ] 4.5 Test that a redelivered message is handled once (as found in 1.3)
- [ ] 4.6 Test that a message whose handler always throws ends in the receiver's dead letters
- [ ] 4.7 Give the receiver probe a Wolverine HTTP endpoint and test that it appears in the OpenAPI document with its route, method and response type

## 5. Generated code

- [ ] 5.1 Configure dynamic code generation in Development and tests, static with the start-up assertion elsewhere
- [ ] 5.2 Generate and commit the code in `Herald.Host/Internal/Generated`, exclude it from `dotnet format`, and confirm the host starts in Production with it and fails naming the missing type without it
- [ ] 5.3 Add the CI step that regenerates the code and fails on a difference; confirm it fails on a pull request that changes a handler without regenerating

## 6. Docs

- [ ] 6.1 Revise ADR 0005 (follow-ups: pre-generated code in production; Wolverine endpoints in OpenAPI), ADR 0008 (envelope tables through each module's migrations, one store per module) and ADR 0009 (the emulator works locally, or what the spike found), all still Proposed
- [ ] 6.2 `CLAUDE.md` commands: add a migration to a module, regenerate Wolverine's code; Status
- [ ] 6.3 `docs/roadmap.md`: mark `m0-messaging`
