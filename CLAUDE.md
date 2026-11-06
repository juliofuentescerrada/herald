# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Herald runs tournaments (league, knockout, single match) and is game-agnostic: game-specific rules are policies. It is the maintainer's reference project for .NET and Azure: modular monolith with vertical slices, CQRS, DDD with events, Angular, Azure. Sibling projects: Arcana (`../arcana`), Archivist (`../archivist`), PauperPilot (`../pauper-pilot`). Start with `README.md`, `docs/roadmap.md` and `docs/adr/`.

## Working with OpenSpec

- Specs live in `openspec/specs/`; proposed changes in `openspec/changes/`. No production code without an approved change: propose (`/opsx:propose`), human review, implement (`/opsx:apply`), archive (`/opsx:archive`). Run `openspec validate <change>` before asking for review.
- On every `/opsx:propose`, identify all screens to create or modify and explicitly ask the user for mockups of each affected screen, including relevant states. Reuse supplied mockups when they cover the proposed change; record their references in the change's `design.md`. If mockups are missing, keep the proposal pending visual input instead of declaring it ready for implementation. For changes without screen impact, state that mockups are not applicable.
- A hard-to-reverse or debatable decision gets an ADR in `docs/adr/` (template `0000-template.md`); a changed decision gets a new ADR that supersedes the old one, never an edit.
- Docs stay minimal (ADR 0001): `README.md`, this file, `docs/roadmap.md`, `docs/adr/`. Measurements and design notes go in the change's `design.md`. Keep the roadmap current.
- Design inputs already in `docs/` (not yet covered by ADR 0001; don't add more without one): `herald-functional-discovery.md` for domain questions, `herald-visual-direction.md` and `assets/mockups/` for screen work, `herald-domain-overview.pptx`.
- `openspec/config.yaml` (`context:`) repeats these conventions: keep it in sync with this file.
- Pull requests follow `.github/pull_request_template.md` and link their OpenSpec change.

## Rules

- Everything in English (ADR 0003).
- UI sharing (ADR 0011): an internal `ui` library from M0, consumed by both shells, separate from `api-client`; feature and app-local shared components remain in their app. `ui` supports SSR and has no app/API/session/permission/routing dependencies. Add a component/state catalogue as development tooling with the first controls, not a third product app.
- Frontend (ADR 0011): one Angular workspace, admin (CSR) and public/participant (hybrid) apps; SSG for corporate pages, SSR for dynamic public entry pages, CSR for personal workflows and live updates. Shared UI/tokens/API client, isolated SSR request state and public-only shared caches. Hosting includes an SSR runtime (ADR 0012).
- Original work only: no code, names, structure or text taken from other codebases, the maintainer's employers' included. Concepts are public knowledge; their implementation here is Herald's own.
- The core is game-agnostic (ADR 0002): no game names or rules in `Domain`; a game's rules enter as a policy, its data through an adapter. No Wizards of the Coast content in the repository.
- Organisation, never "tenant", for the organising entity; British spelling in code and docs (ADR 0003).
- Modules (ADR 0004): one per bounded context; the set evolves with the design (today Organisations, Tournaments, Registration, Competition, Standings as read models) and a change that moves a boundary explains it in its `design.md`. Each has `Domain`, `Features` (one file per use case: command or query plus its Wolverine endpoint or handler; features don't depend on each other) and `Persistence`, with its entry point at the root. `Domain` references no other project and no package but the building blocks; modules never reference each other, only `Herald.Contracts`; one PostgreSQL schema per module, no cross-schema joins.
- CQRS (ADR 0005): commands go through an aggregate and return at most an id; queries never load aggregates, they project to read models with no tracking. Handlers run through Wolverine; Wolverine types stay out of `Domain`.
- Events (ADRs 0006, 0008): aggregates raise domain events; a module publishes integration events (`Herald.Contracts`) only through the Wolverine outbox, in the same transaction as the state change. Consumers are idempotent. A contract change is backwards compatible or versioned.
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

Design: ADRs 0001–0012 are proposed. M0 is three changes: `m0-solution-skeleton` (done), then `m0-messaging` and `m0-web-shell`. M4 (Azure) waits for a shared platform repository, not designed yet (ADR 0012): never add Herald resources to Arcana's state.
