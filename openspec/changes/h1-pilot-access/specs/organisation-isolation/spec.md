## ADDED Requirements

### Requirement: Applications resolve their organisation through a grant
For a caller with the pilot application role, the organisation context SHALL come from its active grant for that organisation instead of a membership, and SHALL carry the grant as the actor. Organisation creation and the person's own details SHALL be refused to applications.

#### Scenario: An application creates an organisation
- **WHEN** a pilot application sends an organisation creation
- **THEN** it is refused
