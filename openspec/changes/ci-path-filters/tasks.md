## 1. Approval

- [x] 1.1 Maintainer review of the proposal, specs and design, with the answer to Q-1; record the approval in `proposal.md`

## 2. Classification

- [x] 2.1 `scripts/ci-changes.mjs` with the documentation and harness groups, the ADR 0017 exception and the unknown-base fallback
- [x] 2.2 `scripts/ci-changes.test.mjs` marking the classification scenarios

## 3. Workflows

- [x] 3.1 `ci.yml`: `ready_for_review`, the draft condition, the `changes` job and `needs`/`if` on `dotnet`, `web` and `test-scripts`
- [x] 3.2 `e2e.yml`: the `changes` job and the condition on the suite
- [x] 3.3 A test that reads both workflows and checks that the code jobs depend on `changes` and that every `ci.yml` job skips drafts; mark the draft, documentation-only and documentation-only-merge scenarios

- [x] 3.4 `guard.mjs` (D-5): the pull request tied to its branch and commit, forgotten once merged or on another branch; tests on a temporary repository, the existing push-round tests moved onto one

## 4. Documents and review

- [x] 4.1 `CLAUDE.md`: pull requests start as drafts and are marked ready for review or a test round
- [ ] 4.2 `herald-reviewer` review of the diff; findings and outcomes in the pull request
- [ ] 4.3 Archive in the same pull request: the specification sync, the roadmap's current-state row (`herald-docs` skill), every new scenario covered
- [ ] 4.4 Run `scripts/ci-changes.mjs` locally on the merges of #29 (documentation only) and #28 (code); record the results in `design.md`
