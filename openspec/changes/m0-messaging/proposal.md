## Why

Every module will change state and tell other modules about it, and ADR 0008 promises that neither can happen without the other. Nothing proves that yet: the skeleton has empty modules and no Wolverine, EF Core or broker. This second M0 change wires them and proves the outbox and inbox before H1's first aggregate depends on them, answering the M0 follow-ups of ADRs 0005, 0008 and 0009.

## What Changes

- **A spike first** (throwaway, outside the solution) checks the riskiest assumptions in `design.md`: one Wolverine message store per module in one database, the Azure Service Bus emulator with Wolverine's transport, envelope tables through EF Core migrations, module-level configuration, and start-up time with dynamic and pre-generated code. If it fails, the design is revised before the rest.
- **Modules become vertical slices** (ADR 0004 revised): each module's entry point moves to its root, the `Application` and `Adapters` folders go, and `Persistence` holds its `DbContext` and migrations. **BREAKING** for the architecture rules: "Application does not depend on Adapters" is replaced by "a feature does not depend on another feature".
- **`Herald.ModuleHosting`**, a new project that plugs a module into the host: its Wolverine store in its schema, its `DbContext`, the routing of its handlers and endpoints. Modules and the host reference it; `Domain` must not.
- **Wolverine in the host** (`WolverineFx`, `WolverineFx.Http`, `WolverineFx.EntityFrameworkCore`, `WolverineFx.Postgresql`, `WolverineFx.AzureServiceBus`): a main store in a `wolverine` schema, one ancillary store per module, EF Core transactions, HTTP endpoints, and the Service Bus transport with one topic per publishing module.
- **EF Core per module**: one `DbContext` per module in its schema, whose migrations create the module's own tables; Wolverine creates its envelope tables through Weasel (at start-up in Development and tests, `db-apply` as a deployment step elsewhere); the host moves from `Aspire.Npgsql` to Aspire's EF Core integration, keeping one database health check.
- **The Azure Service Bus emulator** in the AppHost as the local broker, with topics and subscriptions declared there. No broker in CI yet.
- **Probe modules in a test project** (a sender and a receiver) prove, against PostgreSQL: state and message commit or roll back together, each module uses its own store, a redelivery is handled once, a failing message reaches dead letters, and a Wolverine endpoint appears in the OpenAPI document.
- **Pre-generated Wolverine code** for production, committed in the host, with a CI check that fails when it is stale (Wolverine has no start-up check, see the spike); dynamic generation in development and tests.
- Docs: ADRs 0005, 0008 and 0009 answer their M0 follow-ups; `CLAUDE.md` commands (migrations, code generation); the roadmap.

Out of scope: domain base types and the first aggregate (H1); a broker test in CI (H1, with the first integration event); the build-time OpenAPI document and the TypeScript client (`m0-web-shell`); broker health and Azure resources (M4). No screens: mockups are not applicable.

## Capabilities

### New Capabilities

- `transactional-messaging`: a module's state change and its outgoing messages commit together in the module's own store; messages between modules are received through the receiver's inbox once, and failures are kept as dead letters.
- `handler-code-generation`: production runs Wolverine's pre-generated code without compiling at run time; CI fails when the committed code is stale.
- `api-description`: the host describes its HTTP endpoints, Wolverine's included, in an OpenAPI document.

### Modified Capabilities

- `module-boundaries`: modules are vertical slices; the Application/Adapters rule is replaced by independent features; modules may reference `Herald.ModuleHosting`, which `Domain` must not use.
- `local-environment`: the AppHost also starts the Azure Service Bus emulator with the modules' topics and subscriptions.

## Impact

- New: `src/Herald.ModuleHosting/`, `src/Herald.Host/Internal/Generated/`, each module's `Persistence/`, `tests/Herald.Messaging.Tests/`, the spike's notes in `design.md`.
- Moved: each module's entry point from `Adapters/` to its root (namespace `Herald.<Module>`); empty `Application/` and `Adapters/` folders removed.
- New dependencies, all MIT unless noted, versions checked on 2026-11-06: WolverineFx, WolverineFx.Http, WolverineFx.EntityFrameworkCore, WolverineFx.Postgresql and WolverineFx.AzureServiceBus 6.62.0; Aspire.Npgsql.EntityFrameworkCore.PostgreSQL and Aspire.Hosting.Azure.ServiceBus 13.6.4; Npgsql.EntityFrameworkCore.PostgreSQL 10.0.3 (PostgreSQL licence); Microsoft.AspNetCore.OpenApi and the EF Core design-time tools at the version the spike pins. `Aspire.Npgsql` is removed.
- Docker: the AppHost starts the emulator's two containers locally; CI is unchanged apart from the code generation check.
- Docs: ADRs 0005, 0008 and 0009 (follow-ups answered; still Proposed, so revised); `CLAUDE.md`; `docs/roadmap.md`.
