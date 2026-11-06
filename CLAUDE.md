# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Herald runs tournaments (league, knockout, single match) and is game-agnostic: game-specific rules are policies. It is the maintainer's reference project for .NET and Azure: hexagonal modules, CQRS, DDD with events, Angular, Azure. Sibling projects: Arcana (`../arcana`), Archivist (`../archivist`), PauperPilot (`../pauper-pilot`). Start with `README.md`, `docs/roadmap.md` and `docs/adr/`.

## Working with OpenSpec

- Specs live in `openspec/specs/`; proposed changes in `openspec/changes/`. No production code without an approved change: propose (`/opsx:propose`), human review, implement (`/opsx:apply`), archive (`/opsx:archive`). Run `openspec validate <change>` before asking for review.
- A hard-to-reverse or debatable decision gets an ADR in `docs/adr/` (template `0000-template.md`); a changed decision gets a new ADR that supersedes the old one, never an edit.
- Docs stay minimal (ADR 0001): `README.md`, this file, `docs/roadmap.md`, `docs/adr/`. Measurements and design notes go in the change's `design.md`. Keep the roadmap current.

## Rules

- Everything in English (ADR 0003).
- Original work only: no code, names, structure or text taken from other codebases, the maintainer's employers' included. Concepts are public knowledge; their implementation here is Herald's own.
- The core is game-agnostic (ADR 0002): no game names or rules in `Domain`; a game's rules enter as a policy, its data through an adapter. No Wizards of the Coast content in the repository.
- Modules (ADR 0004): one per bounded context, each with `Domain`, `Application` (`Commands`, `Queries`, `Ports`) and `Adapters`. `Domain` references no other project and no package but the building blocks; modules never reference each other, only `Herald.Contracts`; one PostgreSQL schema per module, no cross-schema joins.
- CQRS (ADR 0005): commands go through an aggregate and return at most an id; queries never load aggregates, they project to read models with no tracking. Handlers run through Wolverine; Wolverine types stay out of `Domain`.
- Events (ADRs 0006, 0008): aggregates raise domain events; a module publishes integration events (`Herald.Contracts`) only through the Wolverine outbox, in the same transaction as the state change. Consumers are idempotent.
- Licences: a dependency must be free for an open-source personal project; check the licence of the exact version before adding it (ADR 0009 records why MediatR and MassTransit were left out).
- Tests (ADR 0010): names read as sentences; domain tests without mocks; use-case and API tests against real PostgreSQL (Testcontainers).

## Commands

None yet: the solution is created by M0 (`docs/roadmap.md`).

## Status

Design: ADRs 0001–0012 are proposed. Next: M0 (solution skeleton, AppHost, CI). M4 (Azure) waits for a shared platform repository, not designed yet (ADR 0012): never add Herald resources to Arcana's state.
