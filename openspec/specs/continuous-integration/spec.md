# continuous-integration Specification

## Purpose
Every pull request and every push to `main` checks formatting, builds and runs the tests, with least privilege.
## Requirements
### Requirement: Every change is checked by CI
A GitHub Actions workflow SHALL run on every pull request and on every push to `main`, and SHALL fail if the code is not formatted according to `.editorconfig`, if the solution does not build in Release with warnings as errors, or if any test fails.

#### Scenario: Unformatted code
- **WHEN** a pull request contains C# code that `dotnet format --verify-no-changes` would change
- **THEN** the workflow fails

#### Scenario: A failing test
- **WHEN** a pull request makes an architecture test or the API test fail
- **THEN** the workflow fails

#### Scenario: A clean change
- **WHEN** a pull request is formatted, builds and passes all tests, including those against PostgreSQL in a container
- **THEN** the workflow succeeds

### Requirement: CI has least privilege and cancels stale runs
The workflow SHALL run with read-only access to the repository contents, and a new push to the same ref SHALL cancel the run in progress.

#### Scenario: Two quick pushes to a pull request
- **WHEN** a second push arrives while the first run is in progress
- **THEN** the first run is cancelled and only the second completes

### Requirement: Merges to main run the end-to-end journeys
A workflow of its own SHALL run the end-to-end suite on every push to `main`, that is after each merge, and not on pull requests. It SHALL fail when any journey or accessibility check fails, and a failed run SHALL keep the suite's report and traces as artifacts.

#### Scenario: A journey breaks
- **WHEN** a merge to `main` changes the admin application so that a newcomer can no longer create an organisation
- **THEN** the end-to-end workflow fails and its report shows the failed journey with a trace

#### Scenario: The suite passes
- **WHEN** a merge to `main` keeps every journey working
- **THEN** the end-to-end workflow succeeds and adds no artifacts

#### Scenario: A pull request is opened
- **WHEN** a pull request is opened or updated
- **THEN** the end-to-end suite does not run; the pull request's checks are the existing CI jobs

