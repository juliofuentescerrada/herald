# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Herald runs tournaments (league, knockout, single match) and is game-agnostic: game-specific rules are policies. It is the maintainer's reference project for .NET and Azure: modular monolith with vertical slices, CQRS, DDD with events, Angular, Azure. Sibling projects: Arcana (`../arcana`), Archivist (`../archivist`), PauperPilot (`../pauper-pilot`). Start with `README.md`, `docs/roadmap.md` and `docs/adr/`.

## Working with OpenSpec

- Specs live in `openspec/specs/`; proposed changes in `openspec/changes/`. No production code without an approved change: propose (`/opsx:propose`), human review, implement (`/opsx:apply`), archive (`/opsx:archive`). Run `openspec validate <change>` before asking for review.
- On every `/opsx:propose`, identify all screens to create or modify and explicitly ask the user for mockups of each affected screen, including relevant states. Reuse supplied mockups when they cover the proposed change; record their references in the change's `design.md`. If mockups are missing, keep the proposal pending visual input instead of declaring it ready for implementation. For changes without screen impact, state that mockups are not applicable.
- A hard-to-reverse or debatable decision gets an ADR in `docs/adr/` (template `0000-template.md`). Proposed records may be refined; accepted decisions normally change by supersession. The maintainer explicitly authorised in-place ADR/document revision for the pre-development consolidation of 7 November 2026 (ADR 0001). Preserve the distinction between confirmed direction, proposed defaults and implementation.
- Keep one maintained source per responsibility (ADR 0001): `README.md` for orientation/status; `docs/herald-functional-discovery.md` for product rules, journeys and decisions; `docs/roadmap.md` for delivery; `docs/adr/` for architecture; `docs/herald-visual-direction.md` for visual contracts and screen/state coverage. Measurements and reviews go in the change's `design.md`.
- `docs/herald-domain-overview.pptx`, `docs/assets/mockups/` and `prototypes/frontend/` are versioned explanatory/visual supports. They do not override functional rules or imply production functionality. The older round-management PNG is superseded for semantics; use the corrected outcomes/standings concept and current deterministic prototypes. Apply Refactoring UI, preserving confirmed square corners and the documented spacing scale.
- Current `openspec/specs/` describes the implemented M0 skeleton; target deltas remain in active changes until implemented and archived. Archived changes and dated reviews are historical evidence, not live architecture instructions.
- `openspec/config.yaml` (`context:`) repeats these conventions: keep it in sync with this file.
- Pull requests follow `.github/pull_request_template.md` and link their OpenSpec change.

## Rules

- Everything in English (ADR 0003).
- UI sharing (ADR 0011): an internal `ui` library from M0, consumed by both shells, separate from `api-client`; feature and app-local shared presentation remain in their app. `ui` supports SSR and has no app/API/query-cache/session/permission/routing dependencies. `api-client` owns no UI, navigation or business state. Add a component/state catalogue as development tooling with the first controls, not a third product app.
- Frontend (ADR 0011): one Angular workspace, admin (CSR) and public/participant (hybrid) apps; SSG for corporate pages, SSR for dynamic public entry pages, CSR for personal workflows and live updates. Shared UI/tokens/API client, isolated SSR request state and public-only shared caches. Hosting includes an SSR runtime (ADR 0012).
- Frontend features own routes, components, forms, queries/mutations and tests. Features do not import other features or the other app; app composition accesses their explicit entry points. App platform owns session/organisation context and API configuration without importing features. Query owns server state; signals own local interaction state. Define invalidation on user/organisation change. Enforce the import matrix in CI from the first workspace; do not mirror backend modules mechanically or require an Angular NgModule/library per feature.
- Original work only: no code, names, structure or text taken from other codebases, the maintainer's employers' included. Concepts are public knowledge; their implementation here is Herald's own.
- The core is game-agnostic (ADR 0002): no game names or rules in `Domain`; a game's rules enter as a policy, its data through an adapter. No Wizards of the Coast content in the repository.
- Organisation, never "tenant", for the organising entity; British spelling in code and docs (ADR 0003).
- Modules (ADR 0004): one per bounded context; the set evolves (initially Organisations, Tournaments, Registration, Competition and Standings). Each target module has `Domain`, `Features` (one namespace per use case, one file or cohesive folder), `Persistence` and composition at the root. Features never depend on other features. Shared business rules belong in Domain; shared technical concerns belong with their responsibility, not automatically in Domain or a generic services layer. Domain knows only building blocks/framework-independent domain types. Modules never reference each other; their integration language is `Herald.Contracts`. Proposed `Herald.ModuleHosting` is technical composition only. One PostgreSQL schema per module, no cross-schema joins. Cross-module transitions have an explicit owner, authoritative conditions and reviewed revisions.
- CQRS (ADR 0005): commands enforce aggregate invariants and may return identities, receipts, outcome/revision metadata and typed errors; queries project read models with no tracking. Querying an eventual projection is distinct from acknowledging a mutation. Handlers run through Wolverine; Wolverine types stay out of Domain.
- Events (ADRs 0006, 0008): aggregates raise domain events; a module publishes integration events (`Herald.Contracts`) only through the Wolverine outbox, in the same transaction as the state change. Consumers are idempotent. A contract change is backwards compatible or versioned.
- Durable history (ADR 0007): owning modules persist required predecessor revisions, actor/time/reason and participation evidence with the effective change. Logs and message retention are not the competitive audit trail. Only effective results affect standings; pending reports do not.
- Licences: a dependency must be free for an open-source personal project; check the licence of the exact version before adding it (ADR 0009 records why MediatR and MassTransit were left out).
- Tests (ADR 0010): names read as sentences; domain tests without mocks; use-case and API tests against real PostgreSQL (Testcontainers).

## Commands

Docker is required for the tests and the AppHost.

- Build: `dotnet build Herald.slnx`
- Format check (as CI): `dotnet format Herald.slnx --verify-no-changes`
- All tests: `dotnet test --solution Herald.slnx`
- One test: `dotnet test --project tests/Herald.Host.Tests --filter-method "*Name*"` (filter per project: a project where no test matches fails the run)
- Run locally (PostgreSQL + host, Aspire dashboard): `dotnet run --project src/Herald.AppHost`

## Status

Pre-development baseline v0.7, consolidated 7 November 2026. ADR 0013 accepts H1–H7 scope; ADR 0002 is superseded for scope. Other ADRs remain Proposed where indicated, even when their high-level direction is confirmed. Only `m0-solution-skeleton` is implemented/archived; its old Application/Adapters layout remains until the `m0-messaging` migration. `m0-messaging` is in progress in its own branch; `m0-web-shell` is a draft. No tournament functionality or production Angular code exists. H1 includes scoped identity and direct teams; proposed product defaults require their decision gates. M4 waits for the shared platform (ADR 0012): never add Herald resources to Arcana's state.
