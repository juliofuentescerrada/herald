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

- Everything in English (ADR 0003). Organisation, never "tenant", for the organising entity; British spelling in code and docs. `scripts/rules.mjs` checks both (`docs/rules/`), after each edit, before each commit and in CI; an intended exception goes in `docs/rules/` with its reason.
- Original work only: no code, names, structure or text taken from other codebases, the maintainer's employers' included. Concepts are public knowledge; their implementation here is Herald's own.
- The core is game-agnostic (ADR 0002): no game names or rules in `Domain`; a game's rules enter as a policy, its data through an adapter. No Wizards of the Coast content, and no sibling project named in code except what Herald shares with it (checked by `scripts/rules.mjs`).
- One maintained source per responsibility (ADR 0001): state a fact where it belongs and link to it elsewhere.
- Licences: a dependency must be free for an open-source personal project (ADR 0009 records why MediatR and MassTransit were left out). `scripts/rules.mjs` checks every package against `docs/rules/licences.json`; a licence not on it is the maintainer's decision.
- M4 waits for the shared platform (ADR 0012): never add Herald resources to Arcana's state.

## Working economically

- Check with `scripts/check [rules|dotnet|web|all]`: CI's steps with one line each and only the errors on failure. A new machine or cloud session is prepared by `scripts/bootstrap`.
- A test that proves a specified scenario carries its marker (`[Trait("covers", "<capability>: <scenario>")]`, a Playwright `covers` annotation or `// covers:`); `scripts/spec-coverage.mjs` fails on a new scenario without one. `docs/rules/uncovered-scenarios.txt` only shrinks: never add a line.
- Before opening a slice's pull request, write `git diff main...HEAD` to a file and have the `herald-reviewer` subagent review it with its change's name; the pull request records its findings and how each was resolved, and ends with `node scripts/harness-metrics.mjs <session ids> --markdown` for the sessions the slice took (`--list` shows them; without ids it takes the latest).
- Use CodeGraph (`codegraph_explore`, configured in `.mcp.json`) before reading code files: one call returns the relevant source, its callers and the tests affected. A fresh clone needs `codegraph init` once; the index then follows file changes.
- Read large documents by section (`grep` for the D-, F- or § reference, then read those lines), never whole: the discovery alone is about 37,000 tokens.
- Stop and ask instead of retrying when the same CI failure returns after one fix, when a flaky journey fails again after one retry, or when a slice clearly outgrows its `tasks.md` (propose splitting it). Never skip or disable a test to get green.
- Schedule only one-off wake-ups; no recurring schedule that starts sessions without a limit.
- `.claude/hooks/guard.mjs` enforces a tool budget since the maintainer's last message, refuses a command after repeated identical failures and limits pushes (ADR 0018). When it refuses, report where you stopped and end the turn; do not work around it.

## Commands

Docker is required for the tests and the AppHost. In a Claude Code cloud session the daemon is installed but not running: start it with `dockerd > /tmp/dockerd.log 2>&1 &` first.

- Build: `dotnet build Herald.slnx`
- Format check (as CI): `dotnet format Herald.slnx --verify-no-changes`
- All tests: `dotnet test --solution Herald.slnx`
- Synthetic data: `tools/Herald.Seed` seeds scenarios through the endpoints (ADR 0019); Aspire runs it with `seed-object-id` set (`docs/operations/identity.md`). A change that alters a state the seeds use updates or adds its scenario in `tools/Herald.Seed/Scenarios.cs`.
- After changing a handler or endpoint: `dotnet run --project src/Herald.Host -- codegen write`; after changing an endpoint, also `cd web && pnpm api:generate`. Commit both results, or CI fails.
