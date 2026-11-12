# Test rules

Loaded when working under `tests/`. The root `CLAUDE.md` and `src/CLAUDE.md` still apply.

- Tests (ADR 0010): names read as sentences; domain tests without mocks; use-case and API tests against real PostgreSQL (Testcontainers), so Docker must be running.
- One test: `dotnet test --project tests/Herald.Host.Tests --filter-method "*Name*"`. The filter applies per project: a project where no test matches fails the run, so name the project.
