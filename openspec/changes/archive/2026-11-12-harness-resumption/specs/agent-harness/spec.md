## MODIFIED Requirements

### Requirement: The harness measures each session
The loop guard SHALL append, at the end of each turn, the turn's tool calls, failures, pushes and duration to a per-session file outside version control. A commit made by an agent session SHALL carry, as a `Harness-Metrics` trailer, the counters not yet recorded in an earlier trailer. The agent SHALL summarise a slice's metrics in its pull request from the trailers of the slice's branch and the turns not yet committed.

#### Scenario: A slice pull request
- **WHEN** the agent opens a slice's pull request
- **THEN** its description states the tool calls, failures, pushes and time the slice took

#### Scenario: A slice that spanned several containers
- **WHEN** the branch carries commits with metrics trailers from sessions whose containers no longer exist
- **THEN** the branch's metrics summary includes their counters with the current session's

## ADDED Requirements

### Requirement: Each completed task is a pushed checkpoint
When the agent completes a task of a change's `tasks.md`, it SHALL commit the task's work with the task checked and push it to the slice's branch. Pushes made before the session opens or updates a pull request SHALL NOT count towards the guard's push rounds.

#### Scenario: Pushing checkpoints before the pull request
- **WHEN** a session pushes more checkpoints than the push rounds allow, and it has not opened or updated a pull request
- **THEN** the guard allows each push

#### Scenario: Pushing after the pull request opens
- **WHEN** a session has opened a pull request and reaches the push rounds since the maintainer's last message
- **THEN** the guard refuses the next push

### Requirement: An interrupted slice resumes from its last checkpoint
`scripts/slice-state.mjs` SHALL print the branch, each active change with its approval and next unchecked tasks, the last checkpoint and the slice procedure steps still ahead. A `SessionStart` hook SHALL run it when the context is compacted and when a session resumes. A session that resumes a slice SHALL continue from the first unchecked task.

#### Scenario: The context is compacted during a slice
- **WHEN** a session's context is compacted while a change is in progress on its branch
- **THEN** the agent receives the change, its next unchecked tasks and the remaining procedure steps

#### Scenario: Reading the state of a branch with checkpoints
- **WHEN** `scripts/slice-state.mjs` runs on a branch where an approved change has some tasks checked
- **THEN** it names that change, its first unchecked task and the last checkpoint commit

### Requirement: Production code needs an approved change
The loop guard SHALL refuse edits by the agent's file tools to `src/`, `web/projects/` or `tools/` when no active change in `openspec/changes/` records its approval for implementation in its proposal.

#### Scenario: Editing production code before approval
- **WHEN** the agent edits a file under `src/` and no active change is approved for implementation
- **THEN** the guard refuses the edit and says that an approved change is needed

#### Scenario: Editing production code with an approved change
- **WHEN** the agent edits a file under `src/` and an active change records "Approved for implementation"
- **THEN** the guard allows the edit
