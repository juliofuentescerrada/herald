## ADDED Requirements

### Requirement: The tracking labels and milestones are created by script
`scripts/github-setup` SHALL create or update, with the maintainer's `gh`:
- the labels `batch`, `slice`, `batch-proposals`, `needs-decision`, `in-progress`, `ready-to-test`, `feedback` and `agent:start`, each with a description;
- the milestones of the remaining H1, M4 and H2.

It SHALL be idempotent. With `--dry-run` it SHALL print every action without calling GitHub.

#### Scenario: A dry run
- **WHEN** the maintainer runs `scripts/github-setup --dry-run`
- **THEN** it prints one line per label and milestone it would create or update, and makes no call to GitHub

### Requirement: A slice declares its dependencies
The slice issue template SHALL ask for the slices it depends on, and the batch issue template SHALL list its slices in order with their dependencies. The next-slice procedure SHALL start a slice only when its dependencies are merged and fewer than two slices are in progress.

#### Scenario: Two independent slices
- **WHEN** a batch lists two slices without dependencies on each other and none is in progress
- **THEN** both may be started, and a third waits until one of them is merged

#### Scenario: The templates ask for dependencies
- **WHEN** the slice and batch issue templates are read
- **THEN** the slice template has a "Depends on" field and the batch template lists the slices' order and dependencies

### Requirement: A slice pull request carries its evidence
The pull request template SHALL have sections for:
- the slice's test script and its screenshots;
- the clean-context reviewer's findings and their outcomes;
- the harness metrics;
- the archive of the change in the same pull request.

#### Scenario: Opening a slice pull request
- **WHEN** the pull request template is read
- **THEN** it asks for the test script, the reviewer's findings, the harness metrics and the archive
