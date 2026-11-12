## Context

ADR 0018 (Proposed) delivers H2 onwards with the agent implementing unattended and the maintainer testing previews; ADR 0019 (Proposed) adds seeded previews; `dev-synthetic-data` seeds local runs. The harness already has `scripts/check`, the loop guard (`.claude/hooks/guard.mjs`), CodeGraph, rules split by folder and the `herald-*` skills. This change adds the checks and observation that replace reading the code.

Findings that shape the design (12 November 2026):

- **Test names do not match scenario titles.** In `team-rosters`, "An owner adds a player to a waiting team" has no test of that name; `openspec/specs/` holds 269 scenarios. Traceability needs explicit markers.
- **Aspire 13.6.5 includes an MCP server** (`aspire agent mcp`) and CLI commands to describe resources, read logs and query OpenTelemetry data.
- **Licences can be read without new dependencies.** `pnpm licenses list --json` lists the web workspace's licences; each restored NuGet package's `.nuspec` declares its licence expression.
- **Current web licences:** MIT, Apache-2.0, ISC, BSD-2/3-Clause, 0BSD, MIT-0, BlueOak-1.0.0, CC0-1.0, MPL-2.0, Python-2.0 and CC-BY-4.0. They form the starting allowed list.

## Goals / Non-Goals

**Goals:** rules enforced where they are cheapest (at the edit) and where they cannot be bypassed (in CI); no new specified scenario without a test; the agent observes the running application; review without the author's context; measured cost per slice; one setup for every environment; declared permissions.

**Non-Goals:** marking all existing scenarios now; mutation testing; ADR 0018's batch skills; production code changes.

## Decisions

- **D-1 One rules script, three callers.**
  - `scripts/rules` (Node, no dependency beyond cspell) checks every file with no arguments and the named files with arguments.
  - The callers are a Claude Code `PostToolUse` hook (matcher `Edit|Write`, the edited path from `tool_input.file_path`; findings exit 2 so the agent sees them in the same turn), `.githooks/pre-commit` (staged files) and CI (every file).
  - CI stays the backstop, because hooks can be bypassed (`--no-verify`, a machine without them, edits on GitHub). The Claude hook shares the guard's process start where possible, to pay one Node start per tool call.
- **D-2 Rules per layer.**
  - **Forbidden terms and spelling:** run in every layer.
  - **Licences:** only when `Directory.Packages.props` or `pnpm-lock.yaml` changes, and always in CI.
  - **ADR 0017 inventory:** only in CI, because it is an architecture test that needs a build.
- **D-3 Forbidden terms as data.**
  - `docs/rules/forbidden-terms.txt` holds each term, the paths it applies to and its message.
  - Exceptions are explicit: the `tid` claim and external names such as Entra's `TenantId` are listed with a reason.
  - The game-name list covers well-known game titles and Wizards of the Coast product names. It applies to `src/*/Domain/` for games and to the whole repository for Wizards of the Coast content.
- **D-4 Spelling with cspell.**
  - cspell with its en-GB dictionary (MIT; the exact versions are checked before adding them).
  - A project word list, `docs/rules/words.txt`.
  - It checks code identifiers split into words, comments and Markdown.
  - *Alternative:* codespell, rejected for its GPL-2.0 licence and weaker British variant handling.
- **D-5 Licences against an allowed list.**
  - `docs/rules/licences.txt` starts from the licences in use, with a note for each non-permissive one (MPL-2.0, CC-BY-4.0, Python-2.0) on why it is acceptable for a development or bundled dependency.
  - A package with a licence outside the list, or with none, fails with its name and version, and the decision is the maintainer's (CLAUDE.md, ADR 0009).
- **D-6 ADR 0017 inventory test.**
  - A test in `Herald.Architecture.Tests` finds domain types with an actor and time pair (`<X>By` and `<X>At`) or a name ending in `Change`.
  - Each must be named in the inventory table of `docs/adr/0017-notifications-consume-fact-events.md`, or listed in the test's exemptions with a reason (for example, a configuration audit that is not a notifiable fact).
- **D-7 Scenario markers.**
  - In .NET, `[Covers("<capability>", "<scenario title>")]` from `tests/Herald.Testing`, repeatable on a test.
  - In Playwright, `test.info().annotations` of type `covers` with `"<capability>: <title>"`.
  - In Angular unit tests, the same annotation as a helper call where a scenario is covered at that level.
  - Titles are matched exactly after trimming, so a renamed scenario breaks its markers visibly.
- **D-8 Baseline that only shrinks.**
  - `docs/rules/uncovered-scenarios.txt` lists today's uncovered scenarios.
  - `scripts/spec-coverage` fails if any of these happens: a scenario is uncovered and not in the baseline; a baseline entry is now covered but still listed (the entry must be removed); a marker names an unknown scenario.
  - Archiving a change (the `herald-docs` skill) requires its new scenarios to be covered.
- **D-9 Bootstrap.**
  - `scripts/bootstrap` holds the steps of the current cloud setup script (the .NET SDK from the distribution's packages when absent, Node from `.nvmrc`, pnpm from `packageManager`, Aspire's bundle, the OpenSpec CLI matching the skills, CodeGraph and its index, restores and installs).
  - It also runs `git config core.hooksPath .githooks`.
  - It never uses `sudo` on its own: system installs run only when it runs as root (cloud, CI).
  - CI keeps `setup-dotnet` and `setup-node` for caching and calls `bootstrap` for the rest.
- **D-10 Permissions.** `.claude/settings.json` gains:
  - **allow:** `dotnet build/test/format/run`, `pnpm` in `web/` and `e2e/`, `scripts/*`, `openspec`, `codegraph`, and read-only and commit git commands;
  - **deny:** `git push --force*`, `git push -f*`, `git reset --hard origin*`, `tofu apply*`, `tofu destroy*`, `az * delete*`, and writing `.env*` or `*.tfvars`.

  Deny rules apply in every permission mode. The `fewer-permission-prompts` skill refines the allow list from real transcripts.
- **D-11 Clean-context reviewer.**
  - `.claude/agents/herald-reviewer.md`, with Read, Grep, Glob and CodeGraph only.
  - Inputs: the diff against `main`, the change folder, the ADRs it cites and the `CLAUDE.md` files of the folders touched.
  - Output: findings ranked by severity, with file, line, rule and a concrete failure scenario. It never edits.
  - The slice procedure runs it before opening the pull request and records its findings and their outcome there.
- **D-12 Metrics.**
  - `guard.mjs` also handles `Stop`: it appends `{session, turn, tools, failures, pushes, durationMs}` to `${TMPDIR}/herald-guard/<session>.jsonl`.
  - The agent summarises the session's lines in the pull request.
  - Token counts are left out at first, because the transcript format is not a stable contract. They are added only if a stable source appears.
- **D-13 Aspire MCP.**
  - `.mcp.json` gains `aspire` (`aspire agent mcp`), installed by `bootstrap` through `dnx aspire.cli@<version>` with the AppHost's version.
  - The agent uses it with a running AppHost to read resource state, logs and traces when debugging, and when checking a slice before asking for a test round.
- **D-14 Executable test scripts.**
  - A slice's test script lives in `e2e/scripts/<change>.spec.ts`, on the E2E environment (fake identity provider) with the seeded scenarios.
  - It takes screenshots at device scale factor 2 at each step the maintainer will check; the agent attaches them to the pull request.
  - These scripts are not journeys: they are not part of the post-merge suite unless promoted.

## Risks / Trade-offs

- **False positives in rules and spelling slow edits** → explicit word and exception lists; the hook reports only the edited file.
- **The baseline hides old gaps** → it can only shrink, and slices remove entries as they touch each spec.
- **A heuristic inventory test misses facts or flags non-facts** → exemptions with reasons; the rule in `src/CLAUDE.md` stays as the source of intent.
- **More hooks add latency to every tool call** → one Node start shared with the guard; measured with D-12.
- **The reviewer costs tokens** → measured with D-12; its use can be limited to slices above a size if the cost is not worth it.
- **Aspire's MCP server is new** → isolated in pull request 3; if it does not serve, the CLI commands (`aspire describe`, `logs`, `otel`) remain.

## Open questions for the maintainer

- **Q-1** Is the starting allowed list of licences acceptable, including MPL-2.0, CC-BY-4.0 and Python-2.0 as they are used today?
- **Q-2** Which game names and terms beyond "tenant" and Wizards of the Coast products belong on the forbidden list (for example, the games of the sibling projects)?
- **Q-3** Should the clean-context reviewer run on every slice, or only on slices above a size or touching contracts and migrations?
