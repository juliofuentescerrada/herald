# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Herald runs tournaments (league, knockout, single match) and is game-agnostic: game-specific rules are policies. It is the maintainer's reference project for .NET and Azure: modular monolith with vertical slices, CQRS, DDD with events, Angular, Azure. Sibling projects: Arcana (`../arcana`), Archivist (`../archivist`), PauperPilot (`../pauper-pilot`). Start with `README.md`, `docs/roadmap.md` (delivery and current state) and `docs/adr/`.

## Where the rules are

- `src/CLAUDE.md`: modules, CQRS, events, notifications, durable history and backend commands. `tests/CLAUDE.md`: tests. `web/CLAUDE.md`: frontend. They load when you work in those folders.
- The `herald-screens` skill: screens, UI states, layout and mockups, including on every proposal.
- The `herald-docs` skill: documentation sources, ADRs, decisions, archiving and status.
- `openspec/config.yaml`: the context and per-artifact rules OpenSpec gives proposals.

## Working with OpenSpec

- Specs live in `openspec/specs/` and describe what is implemented; proposed changes live in `openspec/changes/`. No production code without an approved change: propose (`/opsx:propose`), human review, implement (`/opsx:apply`), archive (`/opsx:archive`). Run `openspec validate <change>` before asking for review.
- Product decisions are the maintainer's. A rule the decision register (`docs/herald-functional-discovery.md` §15) does not settle is asked, not decided.

## Rules

- Everything in English (ADR 0003). Organisation, never "tenant", for the organising entity; British spelling in code and docs.
- Original work only: no code, names, structure or text taken from other codebases, the maintainer's employers' included. Concepts are public knowledge; their implementation here is Herald's own.
- The core is game-agnostic (ADR 0002): no game names or rules in `Domain`; a game's rules enter as a policy, its data through an adapter. No Wizards of the Coast content in the repository.
- One maintained source per responsibility (ADR 0001): state a fact where it belongs and link to it elsewhere.
- Licences: a dependency must be free for an open-source personal project; check the licence of the exact version before adding it (ADR 0009 records why MediatR and MassTransit were left out).
- M4 waits for the shared platform (ADR 0012): never add Herald resources to Arcana's state.

## Commands

Docker is required for the tests and the AppHost. In a Claude Code cloud session the daemon is installed but not running: start it with `dockerd > /tmp/dockerd.log 2>&1 &` first.

- Build: `dotnet build Herald.slnx`
- Format check (as CI): `dotnet format Herald.slnx --verify-no-changes`
- All tests: `dotnet test --solution Herald.slnx`
- After changing a handler or endpoint: `dotnet run --project src/Herald.Host -- codegen write`; after changing an endpoint, also `cd web && pnpm api:generate`. Commit both results, or CI fails.
