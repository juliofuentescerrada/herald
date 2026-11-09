## ADDED Requirements

### Requirement: Pull requests run the end-to-end journeys
The workflow SHALL run the end-to-end suite on every pull request and every push to `main`, in a job of its own, and SHALL fail when any journey or accessibility check fails. A failed run SHALL keep the suite's report and traces as artifacts.

#### Scenario: A journey breaks
- **WHEN** a pull request changes the admin application so that a newcomer can no longer create an organisation
- **THEN** the end-to-end job fails and its report shows the failed journey with a trace

#### Scenario: The suite passes
- **WHEN** a pull request keeps every journey working
- **THEN** the end-to-end job succeeds and adds no artifacts
