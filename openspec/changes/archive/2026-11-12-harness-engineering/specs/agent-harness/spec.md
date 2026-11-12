## ADDED Requirements

### Requirement: One bootstrap prepares every environment
`scripts/bootstrap` SHALL install the toolchain and dependencies the repository declares and enable the repository's git hooks, idempotently. The cloud environment's setup script SHALL call it, and a maintainer's new machine SHALL be ready after running it.

#### Scenario: Running the bootstrap twice
- **WHEN** `scripts/bootstrap` runs on a machine where it already ran
- **THEN** it completes without reinstalling what is current, and the git hooks remain enabled

### Requirement: Permissions are declared in the repository
`.claude/settings.json` SHALL allow the project's routine commands and SHALL deny force pushes, hard resets to a remote, infrastructure apply and destroy, deleting Azure resources, and writing environment or variable files, in every permission mode.

#### Scenario: An unattended session tries a force push
- **WHEN** a session in any permission mode runs `git push --force`
- **THEN** the command is refused by the settings before it runs

### Requirement: A reviewer with a clean context reviews each slice
A `herald-reviewer` subagent with read-only tools SHALL review a slice's diff against its OpenSpec change, the ADRs it cites and the rules of the folders touched, and SHALL report findings with file, line, rule and failure scenario without editing. The slice procedure in `CLAUDE.md` SHALL require that review before each slice's pull request and its findings, with how each was resolved, in the pull request description.

#### Scenario: The slice procedure requires a read-only review
- **WHEN** the reviewer's definition and the slice procedure are read
- **THEN** the reviewer has only reading tools, and the procedure requires its review and its findings in the pull request before each slice's pull request opens

### Requirement: The harness measures each session
The loop guard SHALL append, at the end of each turn, the turn's tool calls, failures, pushes and duration to a per-session file outside version control, and the agent SHALL summarise a slice's sessions in its pull request.

#### Scenario: A slice pull request
- **WHEN** the agent opens a slice's pull request
- **THEN** its description states the tool calls, failures, pushes and time the slice took

### Requirement: The agent observes and exercises the running application
The agent SHALL have Aspire's MCP server to read resources, logs and traces of a running AppHost, and each slice SHALL include an executable test script that runs against the local application with seeded data and produces the screenshots attached to its pull request.

#### Scenario: Checking a slice before the maintainer's test round
- **WHEN** a slice is implemented
- **THEN** its test script has run against the local application, and the pull request carries its screenshots
