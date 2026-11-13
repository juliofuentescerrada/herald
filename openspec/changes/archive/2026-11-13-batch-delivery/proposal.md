## Status

**Approved for implementation on 13 November 2026** (gate 1.1). Proposed the same day: the maintainer decided to start ADR 0018's flow with H1's remaining slices, tested locally until M4, with at most two slices in progress, and to track the remaining work in GitHub Issues. The maintainer answered Q-1 to Q-3 (`design.md`) and approved the change.

## Why

ADR 0018 (Proposed) delivers H2 onwards in batches implemented unattended, tested on a preview per pull request and tracked in GitHub Issues. It says that H1's remaining slices keep the one-change-at-a-time process. Nothing blocks the flow earlier: the harness now resumes slices, measures them, guards the phase and keeps private data out, and CI costs little for documentation. What depends on M4 is the preview, not the flow.

Starting with H1:
- gives ADR 0018 the trial batch its follow-ups ask for, on work that is due anyway;
- moves status from the documents to issues now, instead of keeping two systems until H2.

The ADR also allows only one slice in progress. With one preview slot, the bottleneck is testing, not implementing, so independent slices can be implemented side by side.

## What Changes

- **ADR 0018 revised** while Proposed, and accepted when this change is approved (Q-1):
  - **Scope:** the flow starts with H1's remaining slices.
  - **Test round until M4:** the maintainer runs the slice locally through Aspire with seeded data, guided by the pull request's test script and its screenshots from the E2E environment. With M4, the round moves to the slice's preview, as the ADR already describes.
  - **Parallel implementation, serial testing:**
    - at most two slices are `in-progress`;
    - the batch issue declares each slice's dependencies, and the next-slice run starts only slices whose dependencies are merged;
    - test rounds and merges go one at a time;
    - before asking for a test round, the agent merges `main` into the slice and regenerates generated code.
  - **Tracking:** GitHub milestones for the remaining H1, M4 and H2, with labels and a project board, from now on. The roadmap keeps exit criteria; status lives in issues.
- **`scripts/github-setup`** creates the labels and milestones idempotently with `gh`, and has a dry-run mode. The maintainer runs it once; the project board stays a manual step, described in `docs/operations/`.
- **Templates:**
  - the slice issue gains "Depends on";
  - the batch issue gains its slices' order and dependencies;
  - the pull request template gains:
    - the test script and its screenshots;
    - the reviewer's findings;
    - the harness metrics;
    - the archive in the same pull request.
- **Skills and OpenSpec configuration:**
  - `herald-screens`: in batched work the agent generates navigable prototypes in `prototypes/frontend/`, reviewed in the batch's proposals pull request, instead of asking for mockups per change;
  - `herald-docs`: archive in the slice's own pull request; status in issues;
  - `openspec/config.yaml`: the matching rule.
- **README and roadmap:** they point to the board for status. The H1 batch map is not part of this change: it follows as its own documentation pull request, so the maintainer reviews it on its own.

Out of scope:
- creating the next-slice scheduled task: the first H1 batch is started by hand, and the task follows it (Q-3);
- M4 itself;
- any product rule.

Screens: none; mockups are not applicable. Notifiable facts: none (ADR 0017). Decision register: no product rule is involved.

## Capabilities

### New Capabilities

- `delivery-tracking`: the GitHub setup script, the issue and pull request templates, and the batch rules the skills state.

### Modified Capabilities

None.

## Impact

- New: `scripts/github-setup`, its test, and `docs/operations/delivery-tracking.md` (board setup and the labels' meaning).
- Changed:
  - ADR 0018;
  - `.github/ISSUE_TEMPLATE/{batch,slice}.yml` and `.github/pull_request_template.md`;
  - the `herald-screens` and `herald-docs` skills and `openspec/config.yaml`;
  - `CLAUDE.md` (the procedure's batch steps), `README.md` and `docs/roadmap.md`.
- No dependency; `gh` is the maintainer's. No change to the host, modules, contracts or web applications.
