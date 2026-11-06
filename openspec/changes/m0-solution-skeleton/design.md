## Context

The repository holds only documentation: ADRs 0001–0012 (Proposed), the roadmap, and the functional and visual design inputs. M0 was split into three changes during exploration (2026-11-06):

```
            m0-solution-skeleton  (this change)
               │                │
       m0-messaging        m0-web-shell
  Wolverine, EF Core,     Angular 22, TanStack Query,
  outbox/inbox, RabbitMQ  Tailwind 4, admin (CSR) and
  locally, probe message  public (hybrid), API client
  in tests only
```

Decisions taken in that exploration that belong to the later changes are recorded there: RabbitMQ as the local broker through Aspire (a revision of ADR 0009's follow-up), and an outbox proven by a message that exists only in tests.

## Screens

None. This change has no user interface, so mockups are not applicable.

## Goals / Non-Goals

**Goals:**

- A solution layout every later change extends without restructuring.
- The ADR 0004 rules enforced by tests from the first commit, because one project per module means the compiler can't enforce them.
- The first test against real PostgreSQL, so CI proves Docker and Testcontainers work before anything depends on them.
- Answer ADR 0010's follow-up (the assertion library).

**Non-Goals:**

- Wolverine, EF Core, migrations, the outbox, the broker: `m0-messaging`.
- Angular and the generated API client: `m0-web-shell`.
- Domain base types (aggregate root, domain event) in `Herald.BuildingBlocks`: they arrive with the first aggregate in M1, shaped by its use.
- Deployment and Azure (M4).

## Decisions

### Frontend boundary (carried to `m0-web-shell`)

Frontend decisions carried to `m0-web-shell` (ADR 0011): one Angular workspace with admin (CSR) and public/participant (hybrid) apps; shared UI, tokens and generated API client. Corporate pages use SSG under their own layout; public tournament pages and the initial discovery view use SSR; personal workflows and live updates run in the browser. There is no separate corporate framework.

`m0-web-shell` establishes both shells, hybrid route configuration and a representative prerender/hydration check. API-backed SSR, metadata and visibility/request-cache isolation are verified with the first public tournament page. The complete corporate site and discovery flows are outside M0. M4 resolves SSR runtime hosting (ADR 0012). None of this adds frontend work to this solution-skeleton change.

The later frontend change creates an internal `ui` library consumed by both shells, separate from `api-client`. Share tokens and common controls; keep feature components and app-local shared components within their app. `ui` has no dependency on apps, API clients, sessions, permissions or app routes and must support SSR. M0 adds only the pieces used by the shells. A component/state catalogue follows with the first controls as development tooling, not a third product application; the tool and external component foundation remain follow-ups (ADR 0011).

### Layout

```
Herald.slnx
global.json                 SDK 10.0.403 (rollForward latestFeature), test runner MTP
Directory.Build.props       net10.0, nullable, warnings as errors, code style in build
Directory.Packages.props    central package management, exact versions
src/
  Herald.AppHost/           Aspire: postgres (data volume) + database "herald" + host
  Herald.ServiceDefaults/   OpenTelemetry, health endpoints, resilience, service discovery
  Herald.Host/              ASP.NET Core; calls each module's AddXxxModule()
  Herald.BuildingBlocks/    empty
  Herald.Contracts/         empty; references BuildingBlocks
  Herald.Registration/      Domain/ Application/{Commands,Queries,Ports}/ Adapters/
  Herald.Competition/       same
  Herald.Standings/         same
tests/
  Herald.Architecture.Tests/
  Herald.Host.Tests/        API tests: WebApplicationFactory + Testcontainers PostgreSQL
```

The SDK is pinned so that `dotnet format` gives the same result locally and in CI; `latestFeature` lets patch releases in.

Module test projects (domain and use-case tests) are not created until the modules have code (M1).

### Module entry point

Each module exposes one `IServiceCollection` extension (`AddRegistrationModule()` and so on) in `Adapters`, and the host calls the three. It is the single place a module plugs into the host, and it gives the architecture tests a real type in each assembly to load the assembly from. It registers nothing yet; `m0-messaging` adds the module's `DbContext` and Wolverine discovery there.

Alternative: reflection-based module discovery in the host. Rejected: three explicit calls are clearer than a scan.

### Architecture tests: NetArchTest.eNhancedEdition

Rules are written per module over namespaces (`Herald.<Module>.Domain` must not depend on `Herald.Contracts`, `Wolverine`, `Microsoft.EntityFrameworkCore`, `Npgsql`, `Microsoft.AspNetCore`, or the module's own `Application` and `Adapters`), plus assembly-level rules between projects. One test per rule per module, generated from a module list, with names that read as sentences.

Alternatives: ArchUnitNET (Apache-2.0), richer but heavier and with its own rule language; reading `.csproj` files, which catches project references but not types. NetArchTest (MIT) works with any test framework and its failures list the offending types.

The test of "every module is checked" asserts that the three expected assemblies are loaded, so renaming a module can't silently skip its rules.

### Database health without EF Core yet

The host uses `Aspire.Npgsql` (`AddNpgsqlDataSource("herald")`), which registers an `NpgsqlDataSource` and a health check. That is the smallest way to make `/health` mean "the database is reachable" in this change. `m0-messaging` switches to the EF Core integration, which brings its own health check; this package is removed then if nothing else uses it.

`/health` and `/alive` are the service defaults' endpoints. They are mapped in Development, as the defaults do; exposing them in Azure (for Container Apps probes) is decided in M4.

### Tests

xUnit v3 on Microsoft.Testing.Platform (ADR 0010) and Shouldly 4.3.0 (BSD-3-Clause) for assertions. FluentAssertions was ruled out: from version 8 it requires a commercial licence, the same case ADR 0009 describes for MediatR and MassTransit. AwesomeAssertions (an Apache-2.0 fork of FluentAssertions 7) was the other free option; Shouldly's failure messages, which quote the expression that failed, read better next to sentence-style test names.

The API tests start one PostgreSQL container per test collection (ADR 0010) and give its connection string to the host through `WebApplicationFactory` configuration.

### CI

One job on `ubuntu-latest` (Docker available): restore, `dotnet format --verify-no-changes`, Release build, `dotnet test --solution Herald.slnx`. Triggers: `pull_request` and `push` to `main`; `permissions: contents: read`; a concurrency group per ref with `cancel-in-progress`. The web job is added by `m0-web-shell`.

## Risks / Trade-offs

- [The `Domain` namespace rules pass vacuously while modules have no domain types] → the "every module is checked" test guards against missing assemblies; the rules start to bite with the first aggregate in M1, and that change verifies a violation fails.
- [Pinned SDK falls behind] → `rollForward: latestFeature`; bump the pin when CI's `setup-dotnet` or format results diverge.
- [`Aspire.Npgsql` is temporary] → recorded here; `m0-messaging` removes it.
- [The AppHost isn't exercised in CI] → its wiring is small; an Aspire integration test (`Aspire.Hosting.Testing`) is added if it starts to grow or break.

## Migration Plan

Not applicable: nothing is deployed.

## Open Questions

None for this change. Carried to `m0-messaging`: whether Wolverine creates its tables at startup or through migrations (ADR 0008), pre-generating Wolverine's code (ADR 0005), Wolverine HTTP endpoints in OpenAPI (ADR 0005/0011), and the ADR 0009 revision for RabbitMQ locally.
