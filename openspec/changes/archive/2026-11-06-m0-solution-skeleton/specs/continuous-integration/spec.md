## ADDED Requirements

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
