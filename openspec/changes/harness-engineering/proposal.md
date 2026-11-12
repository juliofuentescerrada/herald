## Status

**Approved for implementation on 12 November 2026** (gate 1.1). Scope agreed the same day: the seven harness practices in one change, delivered in three pull requests and archived after the last; the maintainer answered the design's questions (`design.md`). The first pull request carries this proposal with its implementation.

## Why

ADR 0018 moves Herald towards unattended implementation: the maintainer will read less code and test on deployed previews. The guarantees that reading the code used to give must come from the harness instead. Today most of Herald's rules are prose in `CLAUDE.md` files, which an agent can miss and which costs tokens on every turn. Nothing checks that every specified scenario has a test. The agent cannot observe the running application. A self-review shares the context of the code it reviews. Nobody measures what a slice costs. The setup is repeated in the cloud environment, CI and the maintainer's machine, and permissions are not declared in the repository.

## What Changes

**Pull request 1: rules, traceability, bootstrap and permissions**

- **Repository rules in three layers:** one script, `scripts/rules [files…]`, checks:
  - forbidden terms: "tenant", game names (Magic, Pauper) and Wizards of the Coast products in code, and the sibling projects' names in code outside what Herald shares with them;
  - British spelling, with cspell and its en-GB dictionary;
  - the licences of .NET and web packages against an allowed list.

  It runs at three points: after each edit by Claude Code (a `PostToolUse` hook on the edited file), before each commit (a git `pre-commit` hook on the staged files), and in CI (every file).
- **ADR 0017 inventory as a test:** an architecture test fails when a domain type records an actor and time (`<X>By` with `<X>At`), or is a `*Change` history record, and is neither named in ADR 0017's inventory nor listed as an exemption.
- **Spec traceability:**
  - .NET tests (`[Trait("covers", "<spec>: <scenario>")]`), Playwright journeys (a `covers` annotation) and the scripts' tests (a `// covers:` comment) declare which scenarios they cover.
  - `scripts/spec-coverage` lists scenarios without a test, and markers that point to no scenario.
  - The 269 current scenarios start in a baseline that may only shrink: a new scenario without a test, or a dangling marker, fails.
- **One bootstrap:** `scripts/bootstrap` installs the toolchain and dependencies idempotently and enables the git hooks. The cloud environment's setup script calls it, the maintainer runs it on a new machine, and CI uses it for what the setup actions do not cover.
- **Permissions in the repository:** `.claude/settings.json` allows the project's safe commands and denies destructive ones (force pushes, hard resets to a remote, `tofu apply`/`destroy`, deleting Azure resources, writing `.env*` and `*.tfvars`).

**Pull request 2: review and measurement**

- **A reviewer with a clean context:** a `herald-reviewer` subagent, with read-only tools, reviews a slice's diff against its OpenSpec change, the ADRs it cites and the folder rules, and reports findings with file and line before the pull request opens.
- **Harness metrics:** a `Stop` hook appends each turn's tool calls, failures, pushes and duration to a per-session file outside git. The agent summarises them in the pull request, so the guard's limits (ADR 0018) are calibrated with data.

**Pull request 3: the agent tests the running application**

- **Aspire's MCP server** (`aspire agent mcp`) in `.mcp.json`, so the agent reads resources, logs and traces of a running AppHost.
- **Executable test scripts:** a slice's test script is also a Playwright script run against the local application (fake identity provider, seeded data). Its screenshots are attached to the pull request.

**Documents:** `CLAUDE.md` replaces each rule now enforced with a line naming its check; ADR 0018's follow-ups point to this change; `docs/operations/` gains the bootstrap.

Out of scope: mutation testing; the batch skills of ADR 0018 (the slice pull request, the decision session, preview feedback), which wait for its acceptance; marking the 269 existing scenarios, done gradually by the slices that touch each spec.

Screens: none; mockups are not applicable. Notifiable facts: none. Decision register: no product rule is involved.

## Capabilities

### New Capabilities

- `repository-rules`: the rules script, its three layers, licences and ADR 0017's inventory test.
- `spec-traceability`: scenario markers, the coverage script and its baseline.
- `agent-harness`: bootstrap, permissions, the clean-context reviewer, harness metrics, Aspire's MCP server and executable test scripts.

### Modified Capabilities

None. CI gains steps, described in `repository-rules` and `spec-traceability`.

## Impact

- New: `scripts/rules`, `scripts/spec-coverage`, `scripts/bootstrap`, `.githooks/pre-commit`, `.claude/agents/herald-reviewer.md`, `docs/rules/` (terms, words, licences, baseline), `scripts/rules.mjs`, `scripts/spec-coverage.mjs` and their tests.
- Changed: `.claude/settings.json` (hooks, permissions), `.claude/hooks/guard.mjs` (metrics), `.mcp.json` (Aspire), `.github/workflows/ci.yml`, `scripts/check`, `tests/Herald.Architecture.Tests` (inventory test), `e2e/` (annotation, test scripts), `CLAUDE.md`, the cloud environment's setup script.
- Development dependencies to add after checking each exact version's licence: cspell 10.4.1 and `@cspell/dict-en-gb-mit` 3.1.32 (both MIT; they bring WTFPL and CC BY-SA 4.0 dictionaries, proposed for the allowed list). No production dependency.
- No change to the host, modules, contracts or web applications.
