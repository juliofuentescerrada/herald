## Context

ADR 0019 (Proposed) decides that previews and local runs are populated with synthetic data made by the application's own rules: through the real endpoints, in process, with self-signed tokens for persona identities. The API tests already host Herald in process with `WebApplicationFactory` (`tests/Herald.Host.Tests/HostFactory.cs`) and sign tokens with a key only they know (`TestTokens.cs`). The admin API covers every write the H1 scenarios need: create organisation, create, save and publish tournament, open and close registration, create guest, enter guest, admit and cancel entry, add and remove roster members.

## Goals / Non-Goals

**Goals:** a populated local run with one command; scenarios that stay valid as endpoints change; a tool ready for M4's slots.

**Non-Goals:** the slots, pipeline and persona accounts (M4); seeding through the deployed API; generating large or random data sets.

## Decisions

- **D-1 In-process host, real endpoints.** The tool builds Herald's host with `WebApplicationFactory<Program>` against the target connection string, replaces the bearer validation with its own signing key (as the tests do) and sends HTTP requests through the factory's in-memory client. *Alternatives:* writing through aggregates and DbContexts (repeats the endpoints' orchestration and skips the integration events); SQL scripts (break with migrations). See ADR 0019.
- **D-2 Waiting for the outbox.** Cross-module steps (Tournaments' entry terms reaching Registration) travel through durable local queues. Before exiting, the tool waits until Wolverine reports no outgoing or incoming envelopes pending for the host, with a timeout that fails the run. Anything left would still be delivered by the real host, because the queues are durable, but a seed must finish complete.
- **D-3 Personas from configuration.** `Herald:Seed:Personas:<name>:DirectoryId` and `:ObjectId`, with a display name. Tokens carry `tid`, `oid`, `name` and the organiser role, as the directory's would. Locally the main persona defaults to the maintainer's account when its identifiers are set in user secrets; CI uses fixed test identifiers.
- **D-4 Scenarios as code.** One class per scenario with a name, its persona and its steps as API calls, run in a fixed order. Names come from fixed lists in the tool. Dates are computed from the seeding time (registration opened yesterday, closes in five days, starts in a week) in the tournament's time zone.
- **D-5 Idempotent by scenario.** Before running a scenario the tool asks `GET /api/me` for its persona; if the persona already owns the scenario's organisation, the scenario is skipped. A kept database (local volume, `main`) is never seeded twice; a reset recreates the database first.
- **D-6 Never production.** The tool refuses to run when `Herald:Environment` (or the host environment) is `Production`, before connecting.
- **D-7 Shared test support.** `HostFactory` and `TestTokens` move to `tests/Herald.Testing` (a class library), referenced by `Herald.Host.Tests` and `tools/Herald.Seed`. The factory gains the target connection string and the option to keep the database as it is.
- **D-8 Aspire.** The AppHost adds the tool as a project resource that waits for the host and runs once, only when the persona parameters are set; otherwise the dashboard shows it as skipped with the reason.
- **D-9 CI.** After the .NET tests, CI seeds a throwaway PostgreSQL database (the one Testcontainers already provides in the tests, or a service container) and fails if any scenario fails. `scripts/check dotnet` runs the same step.

## Open questions for the maintainer

- **Q-1** Should the local main persona be your own directory account (you see the seeded organisation after signing in), or a fixed test identity you never sign in as? D-3 assumes your account.
- **Q-2** `tools/` is a new top-level folder; the alternative is `src/Herald.Seed`, which the architecture tests would then have to exempt from the module rules. D-7 and the proposal assume `tools/`.
- **Q-3** Any scenario you want from the start beyond those listed (for example, a tournament at capacity with a long waiting queue)?

## Risks / Trade-offs

- An endpoint change that breaks a scenario fails CI → intended: seeds stay true to the rules; the fix is in the same pull request.
- `WebApplicationFactory` is test tooling used outside tests → acceptable for a development tool that never ships in the host's image.
- Waiting on the outbox depends on Wolverine's durability API → isolated in one method of the tool, with a clear timeout message.
