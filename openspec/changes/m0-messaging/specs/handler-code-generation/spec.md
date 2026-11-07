## ADDED Requirements

### Requirement: Production runs pre-generated handler code
Outside Development and tests, the host SHALL load Wolverine's pre-generated handler code from its own assembly and SHALL refuse to start if any expected generated type is missing; in Development and tests the code SHALL be generated at start-up.

#### Scenario: Pre-generated code is missing
- **WHEN** the host starts in Production and a handler has no pre-generated type
- **THEN** the host fails to start and names what is missing

#### Scenario: Development
- **WHEN** the host starts in Development after a handler changed
- **THEN** it starts without regenerating code first

### Requirement: Committed generated code is current
The generated code SHALL be committed, and CI SHALL fail when regenerating it produces a difference.

#### Scenario: A handler changed without regenerating
- **WHEN** a pull request changes a handler or endpoint but not the committed generated code
- **THEN** the workflow fails
