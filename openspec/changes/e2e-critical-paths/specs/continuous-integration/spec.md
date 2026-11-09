## ADDED Requirements

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
