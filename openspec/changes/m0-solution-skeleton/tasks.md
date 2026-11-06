## 1. Solution and build settings

- [x] 1.1 Add `global.json` (SDK 10.0.100, `rollForward: latestPatch`, test runner Microsoft.Testing.Platform), `Directory.Build.props` and `Directory.Packages.props` with exact versions
- [x] 1.2 Create `Herald.slnx` with `src/` and `tests/` folders

## 2. Shared projects and modules

- [x] 2.1 Create `Herald.BuildingBlocks` and `Herald.Contracts` (Contracts references BuildingBlocks), both empty
- [x] 2.2 Create `Herald.Organisations`, `Herald.Tournaments`, `Herald.Registration`, `Herald.Competition` and `Herald.Standings`, each referencing BuildingBlocks and Contracts, with `Domain`, `Application/{Commands,Queries,Ports}` and `Adapters` folders
- [x] 2.3 Add each module's `AddXxxModule()` entry point in `Adapters`

## 3. Host, service defaults and AppHost

- [x] 3.1 Create `Herald.ServiceDefaults` (OpenTelemetry, health endpoints `/health` and `/alive`, resilience, service discovery)
- [x] 3.2 Create `Herald.Host`: service defaults, each module's entry point, `AddNpgsqlDataSource("herald")` with its health check
- [x] 3.3 Create `Herald.AppHost`: PostgreSQL with a data volume and database `herald`, the host referencing it and waiting for it
- [x] 3.4 Run the AppHost locally and confirm the dashboard shows both resources and `/health` is Healthy

## 4. Tests

- [x] 4.1 Create `Herald.Architecture.Tests` (xUnit v3, Shouldly, NetArchTest.eNhancedEdition) with the rules of the `module-boundaries` spec, one sentence-named test per rule per module
- [x] 4.2 Keep the module list in one place in the test project and add the test that every listed module assembly is found and checked
- [x] 4.3 Temporarily add a forbidden dependency in one module, confirm the rule fails naming the type, and remove it
- [x] 4.4 Create `Herald.Host.Tests` with a shared PostgreSQL container per collection and `WebApplicationFactory`
- [x] 4.5 Test `/health` healthy with the database, and `/health` 503 with `/alive` 200 when the database does not answer

## 5. CI

- [x] 5.1 Add `.github/workflows/ci.yml`: `pull_request` and push to `main`, `contents: read`, concurrency per ref; restore, format check, Release build, tests
- [x] 5.2 Confirm the workflow passes on the pull request, and fails on an unformatted file

## 6. Docs

- [x] 6.1 Revise ADR 0010 (still Proposed): the assertion library is Shouldly, and why FluentAssertions 8 was left out
- [x] 6.2 Fill `CLAUDE.md` Commands: build, format check, all tests, a single test (`dotnet test --solution Herald.slnx --filter-method "*Name*"` or the MTP equivalent), run the AppHost
- [x] 6.3 Update `docs/roadmap.md`: M0 is three changes, this one first and archived before the other two are proposed; replace the "Next:" line, which still says to propose M0
