# 0010. Tests read as specifications, and run against real PostgreSQL above the domain

- Status: Proposed
- Date: 2026-11-06
- Consolidated: 2026-11-07

## Context

Herald's tests are part of what it shows: a reviewer should be able to read the rules of a league from its test names. Tests that pass against an in-memory fake and fail against the real database prove little, and the outbox, the schemas and concurrent results only behave truthfully on PostgreSQL.

## Decision

- **Names read as sentences:** `Retrying_the_same_result_operation_returns_its_original_receipt` and `A_stale_result_revision_is_rejected`. Repeating the same operation is different from conflicting new intent. One behaviour per test.
- **Domain tests:** aggregates and policies, no mocks and no infrastructure; the bulk of the suite.
- **Use-case tests:** a command or a query through Wolverine against real PostgreSQL in a container (Testcontainers), checking state and the messages left in the outbox.
- **API tests:** the host in memory (`WebApplicationFactory`) over the same container, for HTTP contracts, authorisation and errors.
- **Architecture tests:** module/project independence, Domain independence and feature independence from ADR 0004. Check the target namespace and project rules as the migration lands; demonstrate failures with negative fixtures rather than relying on empty modules. Type-dependency checks do not alone prove package isolation or database-schema ownership; verify those at the appropriate build/persistence boundary.
- **Front end:** Vitest and Testing Library for behaviour within each feature; Playwright for a few complete journeys. Add import-boundary checks for both apps, features, app platform and shared libraries (ADR 0011). Build both shells and verify generated-contract freshness in CI. Test representative prerendering/hydration in M0; verify request isolation, organisation/user changes and real API-backed SSR when the first data-bearing public page arrives.

xUnit v3 on Microsoft.Testing.Platform, as in the maintainer's other projects, with **Shouldly** for assertions: its failure messages quote the expression that failed, which reads well next to sentence-style names. Mocks only at ports to things outside Herald (a clock, a result source).

## Alternatives considered

- **EF Core's in-memory provider for use cases:** fast, but it ignores transactions, constraints and SQL, which is exactly where Herald's concurrency rules live.
- **SQLite:** closer, still not PostgreSQL.
- **Mocking repositories:** tests the wiring of mocks more than the system.
- **FluentAssertions:** from version 8 it requires a commercial licence, the case ADR 0009 describes for MediatR and MassTransit. **AwesomeAssertions** (an Apache-2.0 fork of version 7) is free, but Shouldly's messages read better here.

## Consequences

- Positive: tests document the domain and catch what the database would catch in production.
- Negative: Docker is required to run the suite, and container tests are slower; they share containers per collection to stay fast.
- Follow-ups: `m0-messaging` replaced the skeleton's Application/Adapters checks with slice checks proved by fixtures; `m0-web-shell` introduces frontend checks. H1 adds domain and web/API acceptance examples from the functional baseline, including revisions, effective outcomes, privacy and team readiness. `e2e-critical-paths` adds the Playwright journeys in `e2e/` (ADR 0015): nine critical paths against the composed system with a fake OpenID Connect provider and axe checks, run after each merge to `main`; each H1 feature adds its journeys there.
