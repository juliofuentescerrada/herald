## 1. Solution and build settings

- [ ] 1.1 Add `global.json` (SDK 10.0.403, `rollForward: latestFeature`, test runner Microsoft.Testing.Platform), `Directory.Build.props` and `Directory.Packages.props` with exact versions
- [ ] 1.2 Create `Herald.slnx` with `src/` and `tests/` folders

## 2. Shared projects and modules

- [ ] 2.1 Create `Herald.BuildingBlocks` and `Herald.Contracts` (Contracts references BuildingBlocks), both empty
- [ ] 2.2 Create `Herald.Registration`, `Herald.Competition` and `Herald.Standings`, each referencing BuildingBlocks and Contracts, with `Domain`, `Application/{Commands,Queries,Ports}` and `Adapters` folders
- [ ] 2.3 Add each module's `AddXxxModule()` entry point in `Adapters`

## 3. Host, service defaults and AppHost

- [ ] 3.1 Create `Herald.ServiceDefaults` (OpenTelemetry, health endpoints `/health` and `/alive`, resilience, service discovery)
- [ ] 3.2 Create `Herald.Host`: service defaults, the three module entry points, `AddNpgsqlDataSource("herald")` with its health check
- [ ] 3.3 Create `Herald.AppHost`: PostgreSQL with a data volume and database `herald`, the host referencing it and waiting for it
- [ ] 3.4 Run the AppHost locally and confirm the dashboard shows both resources and `/health` is Healthy

## 4. Tests

- [ ] 4.1 Create `Herald.Architecture.Tests` (xUnit v3, Shouldly, NetArchTest.eNhancedEdition) with the rules of the `module-boundaries` spec, one sentence-named test per rule per module
- [ ] 4.2 Add the test that the three module assemblies are found and checked
- [ ] 4.3 Temporarily add a forbidden dependency in one module, confirm the rule fails naming the type, and remove it
- [ ] 4.4 Create `Herald.Host.Tests` with a shared PostgreSQL container per collection and `WebApplicationFactory`
- [ ] 4.5 Test `/health` healthy with the database, and `/health` 503 with `/alive` 200 when the database does not answer

## 5. CI

- [ ] 5.1 Add `.github/workflows/ci.yml`: `pull_request` and push to `main`, `contents: read`, concurrency per ref; restore, format check, Release build, tests
- [ ] 5.2 Confirm the workflow passes on the pull request, and fails on an unformatted file

## 6. Docs

- [ ] 6.1 Revise ADR 0010 (still Proposed): the assertion library is Shouldly, and why FluentAssertions 8 was left out
- [ ] 6.2 Fill `CLAUDE.md` Commands: build, format check, all tests, a single test (`dotnet test --solution Herald.slnx --filter-method "*Name*"` or the MTP equivalent), run the AppHost
- [ ] 6.3 Update `docs/roadmap.md`: M0 is three changes, this one first
