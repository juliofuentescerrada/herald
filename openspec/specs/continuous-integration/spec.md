# continuous-integration Specification

## Purpose
Every ready pull request and every push to `main` is checked with least privilege: the repository rules always, and formatting, the build, the tests and, after a merge, the end-to-end journeys whenever the change touches code (`scripts/ci-changes.mjs`).
## Requirements
### Requirement: Every change is checked by CI
A GitHub Actions workflow SHALL run on every pull request that is not a draft and on every push to `main`. Its repository rules job SHALL run for every such change. When the change touches code, as the classification of changed files decides, it SHALL also fail if the code is not formatted according to `.editorconfig`, if the solution does not build in Release with warnings as errors, or if any test fails.

#### Scenario: Unformatted code
- **WHEN** a pull request contains C# code that `dotnet format --verify-no-changes` would change
- **THEN** the workflow fails

#### Scenario: A failing test
- **WHEN** a pull request makes an architecture test or the API test fail
- **THEN** the workflow fails

#### Scenario: A clean change
- **WHEN** a pull request is formatted, builds and passes all tests, including those against PostgreSQL in a container
- **THEN** the workflow succeeds

#### Scenario: A documentation-only pull request
- **WHEN** a ready pull request changes only files that the classification groups as documentation or harness
- **THEN** the repository rules job runs, and the build, test and test-script jobs report as skipped

#### Scenario: A draft pull request
- **WHEN** a draft pull request is opened or updated
- **THEN** no CI job runs until it is marked ready for review

### Requirement: CI has least privilege and cancels stale runs
The workflow SHALL run with read-only access to the repository contents. A new push to the same pull request SHALL cancel the run in progress. Runs on `main` SHALL each complete, because the next merge's classification covers only its own changes.

#### Scenario: Two quick pushes to a pull request
- **WHEN** a second push arrives while the first run is in progress
- **THEN** the first run is cancelled and only the second completes

#### Scenario: Two merges in quick succession
- **WHEN** a merge that touches code is followed by a documentation-only merge while its runs are in progress
- **THEN** the first merge's runs complete, including the end-to-end suite

### Requirement: Merges to main run the end-to-end journeys
A workflow of its own SHALL run the end-to-end suite on every push to `main` that touches code, as the classification of changed files decides, that is after each such merge, and not on pull requests. It SHALL fail when any journey or accessibility check fails, and a failed run SHALL keep the suite's report and traces as artifacts.

#### Scenario: A journey breaks
- **WHEN** a merge to `main` changes the admin application so that a newcomer can no longer create an organisation
- **THEN** the end-to-end workflow fails and its report shows the failed journey with a trace

#### Scenario: The suite passes
- **WHEN** a merge to `main` keeps every journey working
- **THEN** the end-to-end workflow succeeds and adds no artifacts

#### Scenario: A pull request is opened
- **WHEN** a pull request is opened or updated
- **THEN** the end-to-end suite does not run; the pull request's checks are the existing CI jobs

#### Scenario: A documentation-only merge
- **WHEN** a merge to `main` changes only documentation or harness files
- **THEN** the end-to-end suite reports as skipped

### Requirement: Changed files are classified in one place
`scripts/ci-changes.mjs` SHALL classify a change as code unless every changed file, under its old and its new path, belongs to the documentation group or the harness group, and both workflows SHALL use it. ADR 0017 SHALL count as code, because an architecture test reads its inventory, and so SHALL the classification itself. When the base cannot be read, or the classification fails, the change SHALL count as code.

#### Scenario: Only documentation and harness files change
- **WHEN** a change touches only `docs/`, `openspec/`, `prototypes/`, a `CLAUDE.md`, the agent's skills, `scripts/` or the git hooks
- **THEN** the classification is not code

#### Scenario: A source file changes
- **WHEN** a change touches any file outside both groups, such as one under `src/` or `web/`
- **THEN** the classification is code

#### Scenario: ADR 0017 changes
- **WHEN** a change touches only ADR 0017
- **THEN** the classification is code

#### Scenario: The base is unknown
- **WHEN** the base commit is all zeros or cannot be fetched
- **THEN** the classification is code

#### Scenario: A file moves out of the code
- **WHEN** a change moves a file from `src/` to `docs/`
- **THEN** the classification is code

#### Scenario: The classification fails
- **WHEN** the classification job fails or gives no result
- **THEN** the build, test and test-script jobs run

