## Status

**Pending the maintainer's review** (gate 1.1). Proposed on 13 November 2026, after the repository reached its GitHub Actions usage limit. The maintainer asked for this change before any change that would trigger the workflows again.

## Why

Each push to a pull request runs four jobs that cost about 12 billed minutes, even when the push changes only Markdown. Each merge to `main` runs them again, plus the end-to-end suite. Most of the recent pull requests changed only documentation, specifications or the harness: #29, #30 and the proposals before them. The private repository's monthly allowance ran out, and the delivery flow of ADR 0018 would multiply pushes.

## What Changes

- **One classification of changed files**, `scripts/ci-changes.mjs`, maintained in one place and used by both workflows. A change is *code* unless every changed file is in one of these groups:
  - **documentation:** `docs/**` (except ADR 0017, whose inventory an architecture test reads), `openspec/**`, `prototypes/**`, `README.md`, `LICENSE`, every `CLAUDE.md`, `.claude/skills/**`, `.claude/agents/**`, `.claude/commands/**`, `.github/ISSUE_TEMPLATE/**`, `.github/pull_request_template.md`;
  - **harness:** `scripts/**`, `.claude/hooks/**`, `.claude/settings.json`, `.githooks/**`, `.mcp.json`, `cspell.config.yaml`. The `rules` job already runs their tests.
- **CI runs by what changed:**
  - `rules` runs on every non-draft pull request and every push to `main`;
  - `dotnet`, `web` and `test-scripts` run only for code;
  - the end-to-end workflow on `main` runs only for code;
  - skipped jobs report as skipped, which satisfies a required check, so no workflow-level path filter is used.
- **Draft pull requests run nothing.** CI runs when a pull request is opened ready, marked ready for review, or updated while ready. The agent can keep a pull request in draft while it works and mark it ready before asking for a test round. The edit and commit hooks still check the rules locally.
- **The classification has its own tests,** run by the `rules` job.

Out of scope:
- making the repository public, assessed separately on 13 November 2026;
- a self-hosted runner;
- caching changes.

Screens: none; mockups are not applicable. Notifiable facts: none (ADR 0017). Decision register: no product rule is involved.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `continuous-integration`:
  - the code jobs and the end-to-end suite run only when a change touches code;
  - draft pull requests are not checked;
  - the classification is specified with its exceptions.

## Impact

- New: `scripts/ci-changes.mjs` and `scripts/ci-changes.test.mjs`.
- Changed:
  - `.github/workflows/ci.yml`: a `changes` job, the draft condition, and the `ready_for_review` trigger;
  - `.github/workflows/e2e.yml`: a `changes` job;
  - `CLAUDE.md`: drafts while working.
- No dependency, no change to the host, modules, contracts or web applications.
