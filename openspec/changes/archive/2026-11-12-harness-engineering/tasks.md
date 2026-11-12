## 1. Approval

- [x] 1.1 Maintainer review of the proposal, specs and design, with answers to Q-1 to Q-3; record the approval in `proposal.md`

## 2. Pull request 1: rules, traceability, bootstrap and permissions

- [x] 2.1 Check the licences of the exact cspell and en-GB dictionary versions; add them to the web workspace's development dependencies
- [x] 2.2 `docs/rules/` (forbidden terms with paths, messages and exceptions; project words; allowed licences with notes) and `scripts/rules [files…]`
- [x] 2.3 Claude Code `PostToolUse` hook on edits, sharing the guard's Node start; `.githooks/pre-commit`; CI step; `scripts/check` step
- [x] 2.4 First full run: fix real findings, record justified exceptions
- [x] 2.5 ADR 0017 inventory test in `Herald.Architecture.Tests`, with exemptions and reasons
- [x] 2.6 Marker forms: xunit `covers` trait, Playwright `covers` annotation, `// covers:` in the scripts' tests
- [x] 2.7 `scripts/spec-coverage`, the starting baseline, the CI and `scripts/check` steps; mark this change's own scenarios
- [x] 2.8 `scripts/bootstrap` from the cloud setup script, with the git hooks; the cloud environment's setup script calls it since 12 November 2026, after pull request 1 merged (run here from the checkouts' folder; its first fresh container is still to confirm); `README.md` and `CLAUDE.md` point to it
- [x] 2.9 Permissions in `.claude/settings.json`, refined with the `fewer-permission-prompts` skill
- [x] 2.10 `CLAUDE.md` names each enforced rule's check instead of restating it; `herald-docs` requires covered scenarios on archive

## 3. Pull request 2: review and measurement

- [x] 3.1 `.claude/agents/herald-reviewer.md` with read-only tools and its output format
- [x] 3.2 Run it on pull request 2 itself; record findings and outcomes
- [x] 3.3 `Stop` handling in `guard.mjs` writing per-turn metrics; tests with synthetic hook inputs
- [x] 3.4 Pull request summary of a session's metrics; ADR 0018's follow-ups point to them

## 4. Pull request 3: the agent tests the running application

- [x] 4.1 `aspire agent mcp` in `.mcp.json` through `scripts/aspire-mcp`, with the AppHost's Aspire version: connected from Claude Code (`list_apphosts`, `doctor`), and read a running AppHost in the maintainer's Aspire run of 12 November 2026 (5.2)
- [x] 4.2 `e2e/scripts/` structure, a runner on the E2E environment with seeded data, screenshots at scale factor 2
- [x] 4.3 A first test script for an existing flow (`seeded-entries`), its screenshots linked from pull request 3 as CI's `test-script-screens` artefact

## 5. Close

- [x] 5.1 `openspec validate harness-engineering`; status documents per the `herald-docs` skill; archive after pull request 3 and 5.2
- [x] 5.2 The maintainer's Aspire run: Aspire's MCP server reads the running AppHost's resources and logs (closes 4.1)
