## ADDED Requirements

### Requirement: Production runs pre-generated handler code
Outside Development and tests, the host SHALL run Wolverine's pre-generated handler code from its own assembly and SHALL NOT compile handler code at run time; in Development and tests the code SHALL be generated at run time. Stale generated code is caught by CI (next requirement), not at start-up.

#### Scenario: Production
- **WHEN** the host starts in Production and handles a message
- **THEN** it uses the committed generated type and no code is compiled

#### Scenario: Development
- **WHEN** the host starts in Development after a handler changed
- **THEN** it starts without regenerating code first

### Requirement: Committed generated code is current
The generated code SHALL be committed, and CI SHALL fail when regenerating it produces a difference.

#### Scenario: A handler changed without regenerating
- **WHEN** a pull request changes a handler or endpoint but not the committed generated code
- **THEN** the workflow fails
