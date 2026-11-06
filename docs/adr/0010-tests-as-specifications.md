# 0010. Tests read as specifications, and run against real PostgreSQL above the domain

- Status: Proposed
- Date: 2026-11-06

## Context

Herald's tests are part of what it shows: a reviewer should be able to read the rules of a league from its test names. Tests that pass against an in-memory fake and fail against the real database prove little, and the outbox, the schemas and concurrent results only behave truthfully on PostgreSQL.

## Decision

- **Names read as sentences:** `Reporting_a_result_twice_for_the_same_match_is_rejected`. One behaviour per test.
- **Domain tests:** aggregates and policies, no mocks and no infrastructure; the bulk of the suite.
- **Use-case tests:** a command or a query through Wolverine against real PostgreSQL in a container (Testcontainers), checking state and the messages left in the outbox.
- **API tests:** the host in memory (`WebApplicationFactory`) over the same container, for HTTP contracts, authorisation and errors.
- **Architecture tests:** the dependency rules of ADR 0004.
- **Front end:** Vitest and Testing Library, testing what the user sees and does; Playwright for a few end-to-end journeys.

xUnit v3 on Microsoft.Testing.Platform, as in the maintainer's other projects. Mocks only at ports to things outside Herald (a clock, a result source).

## Alternatives considered

- **EF Core's in-memory provider for use cases:** fast, but it ignores transactions, constraints and SQL, which is exactly where Herald's concurrency rules live.
- **SQLite:** closer, still not PostgreSQL.
- **Mocking repositories:** tests the wiring of mocks more than the system.

## Consequences

- Positive: tests document the domain and catch what the database would catch in production.
- Negative: Docker is required to run the suite, and container tests are slower; they share containers per collection to stay fast.
- Follow-ups: the assertion library, chosen in M0.
