## 1. Approval

- [x] 1.1 Maintainer review of the proposal, specs and design; record the approval in `proposal.md` (Q-1 to Q-3 answered on 12 November 2026)

## 2. Checkpoints and metrics

- [x] 2.1 `guard.mjs`: push rounds counted only after the session opens or updates a pull request (D-2); tests with synthetic hook inputs
- [x] 2.2 `guard.mjs`: a `recorded` mark of counters already written to a trailer (D-3)
- [x] 2.3 `.githooks/prepare-commit-msg` adding the `Harness-Metrics` trailer for agent commits, never failing a commit; enabled by `scripts/bootstrap` with the existing hooks
- [x] 2.4 `scripts/harness-metrics.mjs --branch [--markdown]` summing the trailers of `main..HEAD` and unrecorded turns; tests
- [x] 2.5 Mark the change's metrics and checkpoint scenarios with `// covers:`

## 3. State and resumption

- [x] 3.1 `scripts/slice-state.mjs` (D-4) with tests on a temporary repository with an approved change and checked tasks
- [x] 3.2 `SessionStart` hook with the `compact` and `resume` matchers in `.claude/settings.json`
- [x] 3.3 Resume a slice by hand: interrupt this change's own implementation between two tasks, start a fresh session on the branch, and record in `design.md` whether it continued from the first unchecked task

## 4. Phase guard

- [x] 4.1 `guard.mjs` refuses file-tool edits under `src/`, `web/projects/` and `tools/` without an approved active change (D-6; not `tests/` or `e2e/`, Q-1); tests for both scenarios

## 5. Documents and review

- [x] 5.1 `CLAUDE.md`: checkpoint per task, `--branch` metrics in the slice pull request, `scripts/slice-state.mjs`; the phase rule names its check
- [x] 5.2 ADR 0018: resuming an in-progress slice with `agent:start`, the next-slice run's note on the batch issue, push rounds counted from the pull request
- [x] 5.3 `herald-reviewer` review of the diff; findings and outcomes in the pull request
- [ ] 5.4 On archive: the Purpose of `agent-harness`, `repository-rules` and `spec-traceability` (D-7); the roadmap's current-state row (`herald-docs` skill); every new scenario covered
