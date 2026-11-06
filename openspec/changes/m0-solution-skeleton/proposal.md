## Why

Nothing is built yet, and every later milestone needs a solution to put code in, module boundaries that are enforced from the first commit, and a CI that keeps them. This is the first of three M0 changes (`docs/roadmap.md`): it lays the .NET skeleton so that `m0-messaging` (Wolverine, outbox, RabbitMQ) and `m0-web-shell` (Angular) can proceed in parallel on top of it.

## What Changes

- A .NET 10 solution `Herald.slnx` with central package management, shared build properties and a pinned SDK running tests on Microsoft.Testing.Platform.
- `Herald.BuildingBlocks` and `Herald.Contracts`, created empty: their content arrives with the first code that needs it.
- Three modules, `Herald.Registration`, `Herald.Competition` and `Herald.Standings`, one project each with `Domain`, `Application` (`Commands`, `Queries`, `Ports`) and `Adapters`, each exposing one registration entry point the host calls.
- `Herald.Host` (ASP.NET Core), which composes the modules and reports its health, including the database's.
- `Herald.ServiceDefaults` (OpenTelemetry, health endpoints, resilience) and `Herald.AppHost` (.NET Aspire), which starts PostgreSQL and the host.
- Architecture tests that enforce ADR 0004: modules don't reference each other, `Domain` depends on nothing but the building blocks, `Application` doesn't depend on `Adapters`.
- An API test of the host's health against real PostgreSQL (Testcontainers), the first test of the ADR 0010 kind.
- xUnit v3 with Shouldly as the assertion library, which answers the ADR 0010 follow-up.
- A GitHub Actions workflow: format, build and test on every pull request and on `main`.
- `CLAUDE.md` gets its Commands section; the roadmap marks this change.

Out of scope: Wolverine, EF Core, the outbox and the broker (`m0-messaging`); the Angular workspace and app shell (`m0-web-shell`). No screens: mockups are not applicable.

## Capabilities

### New Capabilities

- `module-boundaries`: the dependency rules between modules, layers and the shared projects, enforced by tests.
- `local-environment`: one command starts the host and its database locally, and the host reports its health.
- `continuous-integration`: every pull request and every push to `main` checks formatting, builds and runs the tests.

### Modified Capabilities

None: `openspec/specs/` is empty.

## Impact

- New: `Herald.slnx`, `global.json`, `Directory.Build.props`, `Directory.Packages.props`, `src/`, `tests/`, `.github/workflows/ci.yml`.
- New dependencies, all checked on 2026-11-06: Aspire 13.6.4 (`Aspire.AppHost.Sdk`, `Aspire.Hosting.PostgreSQL`, `Aspire.Npgsql`, MIT), xUnit v3 4.0.2 (Apache-2.0), Shouldly 4.3.0 (BSD-3-Clause), NetArchTest.eNhancedEdition 1.4.5 (MIT), Testcontainers.PostgreSql 4.16.0 (MIT), Microsoft.AspNetCore.Mvc.Testing 10.0.14 (MIT), plus the OpenTelemetry and resilience packages of the service defaults.
- Docs: ADR 0010's follow-up is answered (it is still Proposed, so it is revised, not superseded); `CLAUDE.md` and `docs/roadmap.md` updated.
- Running the tests needs Docker.
