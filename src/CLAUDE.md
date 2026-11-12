# Backend rules

Loaded when working under `src/`. The root `CLAUDE.md` still applies.

## Architecture

- Modules (ADR 0004): one per bounded context; the set evolves (initially Organisations, Tournaments, Registration, Competition and Standings). Each target module has `Domain`, `Features` (one namespace per use case, one file or cohesive folder), `Persistence` and composition at the root. Features never depend on other features. Shared business rules belong in Domain; shared technical concerns belong with their responsibility, not automatically in Domain or a generic services layer. Domain knows only building blocks/framework-independent domain types. Modules never reference each other; their integration language is `Herald.Contracts`. `Herald.ModuleHosting` is technical composition only: each module's entry point registers through it inside the host's `UseWolverine`. One PostgreSQL schema per module for its state, no cross-schema joins; Wolverine's outbox, inbox and dead letters share one `wolverine` schema, because Wolverine 6.62.0 cannot keep them per module (`m0-messaging` design). Cross-module transitions have an explicit owner, authoritative conditions and reviewed revisions.
- CQRS (ADR 0005): commands enforce aggregate invariants and may return identities, receipts, outcome/revision metadata and typed errors; queries project read models with no tracking. Querying an eventual projection is distinct from acknowledging a mutation. Handlers run through Wolverine; Wolverine types stay out of Domain.
- Events (ADRs 0006, 0008, 0016): aggregates raise domain events; a module publishes integration events (`Herald.Contracts`) only through the Wolverine outbox, in the same transaction as the state change. Between modules of the host they travel through durable local queues; Service Bus only when a party leaves the process. Consumers are idempotent (state events are revisioned snapshots). A contract change is backwards compatible or versioned.
- Notifications (ADR 0017): a future `Notifications` module consumes integration events; no module sends notices. State events are revisioned snapshots; F-10's notifiable facts become fact events (subject, subject revision, actor, time, reason code; no private text, no wording). Publish a fact event only when a consumer exists, but every change that introduces a notifiable fact persists it so publishing later needs no data migration, and adds it to ADR 0017's inventory.
- Durable history (ADR 0007): owning modules persist required predecessor revisions, actor/time/reason and participation evidence with the effective change. Logs and message retention are not the competitive audit trail. Only effective results affect standings; pending reports do not.

## Commands

- Add a migration to a module (`dotnet-ef` tool): `dotnet ef migrations add <Name> --project src/Herald.<Module> --output-dir Persistence/Migrations`
- Wolverine's tables outside Development (a deployment step): `dotnet run --project src/Herald.Host -- db-apply`; check for drift with `db-assert`. In Development the host applies migrations and creates them at start-up.
- After changing a handler or endpoint, regenerate Wolverine's code and commit it (CI fails otherwise): `dotnet run --project src/Herald.Host -- codegen write`
- After changing an endpoint, regenerate the OpenAPI documents and the web client and commit them (CI fails otherwise): `cd web && pnpm api:generate`. Every endpoint declares `[EndpointGroupName(HeraldApi.Public)]` (or `Admin`) and `[EndpointName("operation")]`, or a host test fails.
- Run locally (PostgreSQL, Service Bus emulator and host, Aspire dashboard): `dotnet run --project src/Herald.AppHost`
