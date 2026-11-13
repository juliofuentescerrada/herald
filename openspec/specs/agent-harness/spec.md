# agent-harness Specification

## Purpose
Herald's harness is everything around the model that guides, limits and checks the agent's work, so that an unattended slice is as trustworthy as an attended one. It has six parts:

- **Context:** the folder `CLAUDE.md` files, the `herald-*` skills, CodeGraph, and the slice's state given back after a compaction or a resume.
- **Persisted state:** the change's `tasks.md`, the checkpoint pushed for each task, and the metrics carried by the commits.
- **Tools by phase:** the phase guard, which keeps production code closed until a change is approved, and the read-only reviewer.
- **Isolation:** the cloud container and the commands the permissions deny.
- **Verification:** the repository rules (`repository-rules`), scenario traceability (`spec-traceability`), the tests and CI.
- **Human approval:** the change's approval, the decision register and the maintainer's merge.

This specification covers the harness's environment, review, measurement, observation and resumption. The two specifications named above cover its checks.
## Requirements
### Requirement: One bootstrap prepares every environment
`scripts/bootstrap` SHALL install the toolchain and dependencies the repository declares and enable the repository's git hooks, idempotently. The cloud environment's setup script SHALL call it, and a maintainer's new machine SHALL be ready after running it.

#### Scenario: Running the bootstrap twice
- **WHEN** `scripts/bootstrap` runs on a machine where it already ran
- **THEN** it completes without reinstalling what is current, and the git hooks remain enabled

### Requirement: Permissions are declared in the repository
`.claude/settings.json` SHALL allow the project's routine commands. In every permission mode it SHALL deny:
- force pushes and hard resets to a remote;
- infrastructure apply and destroy, and deleting Azure resources;
- writing environment or variable files;
- listing or reading .NET user secrets.

#### Scenario: An unattended session tries a force push
- **WHEN** a session in any permission mode runs `git push --force`
- **THEN** the command is refused by the settings before it runs

#### Scenario: A session tries to read the user secrets
- **WHEN** a session in any permission mode runs `dotnet user-secrets list` or reads a file in the user-secrets folder
- **THEN** the settings refuse it before it runs

### Requirement: A reviewer with a clean context reviews each slice
A `herald-reviewer` subagent with read-only tools SHALL review a slice's diff against its OpenSpec change, the ADRs it cites and the rules of the folders touched, and SHALL report findings with file, line, rule and failure scenario without editing. The slice procedure in `CLAUDE.md` SHALL require that review before each slice's pull request and its findings, with how each was resolved, in the pull request description.

#### Scenario: The slice procedure requires a read-only review
- **WHEN** the reviewer's definition and the slice procedure are read
- **THEN** the reviewer has only reading tools, and the procedure requires its review and its findings in the pull request before each slice's pull request opens

### Requirement: The harness measures each session
The loop guard SHALL append, at the end of each turn, the turn's tool calls, failures, pushes and duration to a per-session file outside version control. A commit made by an agent session SHALL carry, as a `Harness-Metrics` trailer, the counters not yet recorded in an earlier trailer. The agent SHALL summarise a slice's metrics in its pull request from the trailers of the slice's branch and the turns not yet committed.

#### Scenario: A slice pull request
- **WHEN** the agent opens a slice's pull request
- **THEN** its description states the tool calls, failures, pushes and time the slice took

#### Scenario: A slice that spanned several containers
- **WHEN** the branch carries commits with metrics trailers from sessions whose containers no longer exist
- **THEN** the branch's metrics summary includes their counters with the current session's

### Requirement: The agent observes and exercises the running application
The agent SHALL have Aspire's MCP server to read resources, logs and traces of a running AppHost, and each slice SHALL include an executable test script that runs against the local application with seeded data and produces the screenshots attached to its pull request.

#### Scenario: Checking a slice before the maintainer's test round
- **WHEN** a slice is implemented
- **THEN** its test script has run against the local application, and the pull request carries its screenshots

### Requirement: Each completed task is a pushed checkpoint
When the agent completes a task of a change's `tasks.md`, it SHALL commit the task's work with the task checked and push it to the slice's branch. Pushes made before the session opens or updates a pull request SHALL NOT count towards the guard's push rounds. Nor SHALL pushes made after that pull request is merged, or from another branch than the one it was seen on.

#### Scenario: Pushing checkpoints before the pull request
- **WHEN** a session pushes more checkpoints than the push rounds allow, and it has not opened or updated a pull request
- **THEN** the guard allows each push

#### Scenario: Pushing after the pull request opens
- **WHEN** a session has opened a pull request and reaches the push rounds since the maintainer's last message
- **THEN** the guard refuses the next push

#### Scenario: A late event about the merged pull request
- **WHEN** a GitHub event about the merged pull request wakes the session after it started a new change
- **THEN** the guard still allows the new change's checkpoint pushes

#### Scenario: A new change after the pull request merged
- **WHEN** the commit on which the session's pull request was seen is in `origin/main`, and the session pushes checkpoints of a new change
- **THEN** the guard allows each push

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

### Requirement: The coding plugin is declared, pinned and subordinate
`.claude/settings.json` SHALL declare the ponytail marketplace pinned to an exact tag and enable `ponytail@ponytail`, so every session that opens the repository loads the same version. `CLAUDE.md` SHALL state that the plugin never removes what a change's specifications, tests, ADRs or the rules of any `CLAUDE.md` require, and the clean-context reviewer SHALL be told that the plugin's instruction does not apply to its review. The settings SHALL hold no plugin configuration, webhook or token. `scripts/bootstrap` SHALL install the plugin at the pinned version, reading it from the settings, without ever stopping the bootstrap.

#### Scenario: The plugin's declaration
- **WHEN** the repository's Claude Code settings are read
- **THEN** the ponytail marketplace's source names an exact version tag and the plugin is enabled

#### Scenario: Herald's rules take precedence
- **WHEN** `CLAUDE.md` is read
- **THEN** it states that the plugin's minimalism never removes what specifications, tests, ADRs or any `CLAUDE.md` require, and the reviewer's definition says the plugin's instruction does not apply to reviewing

#### Scenario: Preparing a fresh environment
- **WHEN** `scripts/bootstrap` runs where the Claude Code CLI is installed
- **THEN** it adds the pinned marketplace and installs `ponytail@ponytail` at local scope, taking the repository and tag from `.claude/settings.json`

