## Status

**Pending the maintainer's review** (gate 1.1). Proposed on 12 November 2026, after comparing Herald's harness with the six components that the harness-engineering literature names: context management, persisted state, tools by phase, isolation, verification loops and human approval. The open questions are in `design.md`.

## Why

`harness-engineering` made the harness check Herald's rules and measure the agent's work. The harness is still weak where an unattended slice needs it most: continuing after an interruption.

- **Work is lost when a container is reclaimed.** Commits stay local until the pull request opens, so a reclaimed container loses the slice. Nothing records which tasks are done. ADR 0018's next-slice run also refuses to start while a slice is `in-progress`, so a dead slice blocks the batch with no route back.
- **The metrics are lost with the container.** The guard writes them to the system temporary directory, so a slice that spans several containers reports only its last one.
- **Compaction drops the slice's state.** After the context is summarised, nothing tells the agent again which change it is on, which task comes next or which steps of the slice procedure remain (review, metrics, test script).
- **The most important rule is still prose.** "No production code without an approved change" depends on the agent remembering it. It is the only gate that separates proposing from implementing.
- **`agent-harness` has no stated purpose.** Its Purpose still reads "TBD", so the specification never says what Herald means by its harness.

## What Changes

- **Checkpoints.** The slice procedure commits and pushes each completed task of `tasks.md` to the slice's branch. Checkpoint pushes made before the slice's pull request opens do not count towards the guard's push rounds. Those rounds exist to stop CI fix loops, and a loop can only start once the pull request exists.
- **Metrics travel with the commits.** A `prepare-commit-msg` git hook adds a `Harness-Metrics:` trailer to commits made by an agent session. The trailer holds the tool calls, failures, pushes and time since the previous trailer. `scripts/harness-metrics.mjs --branch` adds up the trailers of `main..HEAD` and the turns not yet committed, so the pull request reports every container the slice used.
- **The state comes back after compaction and on resume.** A `SessionStart` hook (matchers `compact` and `resume`) runs `scripts/slice-state.mjs`. It gives the agent:
  - the branch;
  - the active changes and whether each one is approved;
  - the next unchecked tasks;
  - the last checkpoint;
  - the steps of the slice procedure still ahead.
- **Resuming a slice.** A session that starts on a branch with checkpoints continues from the first unchecked task. It does not redo checked tasks. ADR 0018's next-slice run still refuses a second slice while one is `in-progress`, but now writes on the batch issue the in-progress slice's last checkpoint and how to resume it (`agent:start` on its sub-issue). An `agent:start` run on an `in-progress` slice resumes it instead of refusing. ADR 0018 is still Proposed, so its text changes here.
- **The phase is enforced.** The guard refuses `Edit` and `Write` on production paths (`src/`, `web/projects/`, `tools/`) when no active change in `openspec/changes/` records "Approved for implementation" in its `proposal.md`.
- **The harness's purpose.** The archive fills the Purpose of `agent-harness`, `repository-rules` and `spec-traceability` with Herald's own definition: the harness is everything around the model that guides, limits and checks the agent's work. The definition is organised by the six components and names Herald's mechanism for each one.

Out of scope: a gate that runs a build when the agent ends a turn (left for the metrics to justify); more isolation (the cloud container and the `deny` permissions already provide it); mutation testing.

Screens: none; mockups are not applicable. Notifiable facts: none (ADR 0017). Decision register: no product rule is involved.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `agent-harness`:
  - adds checkpoints and resuming a slice;
  - adds re-injecting the state after compaction;
  - adds the phase guard;
  - changes where the metrics are kept: commit trailers in addition to the per-session file.

## Impact

- New: `scripts/slice-state.mjs`, `.githooks/prepare-commit-msg`, and their tests.
- Changed:
  - `.claude/hooks/guard.mjs` (phase guard, push rounds counted from the pull request, checkpoint deltas);
  - `scripts/harness-metrics.mjs` (`--branch`, `--trailer`);
  - `.claude/settings.json` (`SessionStart` hook);
  - `CLAUDE.md` (slice procedure);
  - ADR 0018 (resuming a slice, metrics);
  - `openspec/specs/{agent-harness,repository-rules,spec-traceability}/spec.md` (Purpose, on archive).
- No dependency, no change to the host, modules, contracts or web applications.
