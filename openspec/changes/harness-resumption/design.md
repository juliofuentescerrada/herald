## Context

`harness-engineering` (archived 12 November 2026) added repository rules in three layers, spec traceability, a bootstrap, declared permissions, a clean-context reviewer, per-turn metrics, Aspire's MCP server and executable test scripts. ADR 0018 (Proposed) runs slices unattended in Claude Code cloud sessions.

On the same day, Herald's harness was compared with the six components that the harness-engineering literature names: context management, persisted state, tools by phase, isolation, verification loops and human approval. Herald covers isolation, verification and human approval well. Its gaps are in persisted state, context after compaction and tools by phase.

Findings that shape the design (12 November 2026):

- **Containers are ephemeral.** A cloud session's container is reclaimed after inactivity. The conversation continues in a fresh container with a fresh clone, so only what was pushed survives.
- **The guard's state and metrics live in `${TMPDIR}/herald-guard/`.** They disappear with the container.
- **The guard allows three pushes since the maintainer's last message, and wake-ups reset nothing.** A push per task would therefore exhaust the limit in the first three tasks.
- **Approval is recorded in a stable form.** Ten of the fourteen archived proposals open their Status with "**Approved for implementation on <date>**"; the four older ones predate the gate. The phase guard can read it.
- **Claude Code runs Bash commands with `CLAUDECODE=1`.** A git hook can tell an agent's commit from the maintainer's own.
- **Claude Code's `SessionStart` hook has `startup`, `resume`, `clear` and `compact` matchers.** What the hook writes to standard output is added to the agent's context.

## Goals / Non-Goals

**Goals:**
- No completed task is lost when a container is reclaimed.
- A slice resumes from its last checkpoint.
- A slice's metrics cover every container it used.
- The agent gets the slice's state back after compaction.
- Production code cannot be edited before approval.
- The specification states what Herald's harness is.

**Non-Goals:**
- A build gate when a turn ends.
- More isolation.
- Mutation testing.
- Creating ADR 0018's scheduled tasks, which wait for its acceptance.

## Decisions

- **D-1 A checkpoint per task.** When the agent checks a task in `tasks.md`, it commits the task's work together with the checked box and pushes to the slice's branch. The commit message names the task (`<type>(<change>): <task id> <summary>`). The branch and `tasks.md` are the state; no other progress file is needed.
  - *Alternative:* a progress file on disk. Rejected: it duplicates `tasks.md` (ADR 0001) and is lost unless pushed anyway.
  - *Alternative:* a checkpoint per task group. Fewer pushes, but a group can take most of a session (Q-3).
- **D-2 Push rounds count from the pull request.**
  - The guard counts towards `HERALD_GUARD_MAX_PUSHES` only pushes made after the session has opened or updated a pull request. It knows this from a successful `mcp__github__create_pull_request`, or from a GitHub pull request event waking the session.
  - Before that, a push is a checkpoint: it is bounded by the tool budget, not by the push rounds.
  - The limit's purpose (ADR 0018: stopping CI fix loops) is unchanged.
- **D-3 Metrics as commit trailers.**
  - `.githooks/prepare-commit-msg` adds `Harness-Metrics: tools=<n> failures=<n> pushes=<n> ms=<n> sessions=<id>[,<id>]`.
  - It acts only when `CLAUDECODE=1` and a guard state has turns not yet recorded. The guard state keeps a `recorded` mark of the counters already written to a trailer.
  - The hook never fails a commit: if anything goes wrong, it adds nothing.
  - `scripts/harness-metrics.mjs --branch [--markdown]` adds up the trailers of `git log main..HEAD` and the local turns not yet recorded. The slice's pull request uses it instead of listing session ids.
  - The per-session `.jsonl` stays as the source within a container.
  - *Alternative:* a metrics file committed to the branch. Rejected: it adds a file to every slice diff, and the rules and the reviewer would read it.
  - *Alternative:* comments on the slice issue. Rejected: issues exist only from H2, and a script cannot read them here.
- **D-4 `scripts/slice-state.mjs`.** It prints at most about 40 lines: the branch; the active changes, each with its approval and its next three unchecked tasks; the last checkpoint commit; and the slice procedure steps still ahead (reviewer, metrics, test script, specification sync and archive). It writes nothing.
  - The `SessionStart` hook runs it with the matchers `compact` and `resume`. The agent can run it at any time.
  - `startup` is left out, because `CLAUDE.md` already orients a new session and, on a fresh clone with no active change, the state is empty.
- **D-5 Resuming a slice.**
  - A session that finds checkpoints on its branch continues from the first unchecked task of the change's `tasks.md` (shown by D-4).
  - Under ADR 0018, the next-slice run that finds a slice `in-progress` still refuses to start a second one. It writes on the batch issue the in-progress slice, its branch, its last checkpoint and "add `agent:start` to its sub-issue to resume".
  - An `agent:start` run on an `in-progress` sub-issue checks out its branch and resumes it.
  - At most one slice stays in progress, and a person decides the resumption.
- **D-6 The phase guard.**
  - On `PreToolUse` for `Edit`, `Write`, `MultiEdit` and `NotebookEdit` on a path under `src/`, `web/projects/` or `tools/`, the guard looks for an active change (a folder of `openspec/changes/` other than `archive/`) whose `proposal.md` contains "Approved for implementation". If there is none, it denies with: "no approved change: propose one (`/opsx:propose`) and wait for the maintainer's approval".
  - Tests (`tests/`, `e2e/`), documentation, `openspec/` and the harness itself stay editable: proposals need them, and they are not production code (Q-1).
  - `HERALD_GUARD=off` disables this guard like the others.
  - *Alternative:* the approval recorded in `tasks.md` 1.1. Rejected: the proposal's Status is where every approved change already records it.
- **D-7 The definition of the harness.**
  - On archive, the Purpose of `agent-harness` states: *"Herald's harness is everything around the model that guides, limits and checks the agent's work, so that an unattended slice is as trustworthy as an attended one. It has six parts:*
    - *context (folder rules, skills, CodeGraph, the state after compaction);*
    - *persisted state (the change's tasks, checkpoints and metrics in the branch);*
    - *tools by phase (the phase guard, the read-only reviewer);*
    - *isolation (the cloud container, the denied commands);*
    - *verification (repository rules, spec traceability, tests, CI);*
    - *human approval (the change's approval, the decision register, the merge)."*
  - `repository-rules` and `spec-traceability` state their own part.
  - Purpose is not a requirement, so it is written at archive rather than as a delta.

## Risks / Trade-offs

- **Edits through Bash (`sed`, here-documents) bypass the phase guard** → CI is the backstop that hooks need (harness-engineering D-1). Q-2 asks whether to add a CI check: a pull request that changes production paths must carry or follow an approved change.
- **A push per task could trigger CI each time** → checked: `ci.yml` runs on `pull_request` and on pushes to `main`, so checkpoints before the pull request trigger nothing.
- **The trailer can be wrong when several sessions share a container** → it names its sessions, and the guard state records per session.
- **A false refusal from the phase guard blocks legitimate work** → the message says what is missing, and `HERALD_GUARD=off` remains for the maintainer.
- **The state output costs tokens on every compaction** → capped at about 40 lines, measured with the metrics.

## Open Questions

- **Q-1** Should the phase guard also cover `tests/` and `e2e/`? A test written before approval is harmless but is still implementation. The proposal leaves them out.
- **Q-2** Should CI check the phase too (a pull request that changes `src/`, `web/projects/` or `tools/` without an approved change in the repository or in the diff), to close the Bash route?
- **Q-3** A checkpoint per task (D-1) or per task group?
