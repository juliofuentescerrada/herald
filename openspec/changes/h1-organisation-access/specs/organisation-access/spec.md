## ADDED Requirements

### Requirement: A signed-in person creates an organisation and owns it
A signed-in assigned person SHALL be able to create an organisation by giving its name. The name SHALL be required after trimming and at most 80 characters; names need not be unique. The creator SHALL become the organisation's single owner. Creation SHALL record the creating person and time. The client SHALL supply the new organisation's identifier, and a repeat with the same identifier and name SHALL return the original organisation instead of creating another.

#### Scenario: A newcomer creates an organisation
- **WHEN** a signed-in person with no organisation creates "Northside Gaming"
- **THEN** the organisation exists with that person as its only owner and the admin application enters its context

#### Scenario: The name is missing or too long
- **WHEN** the name is blank after trimming or longer than 80 characters
- **THEN** creation is rejected with a field error naming the rule and the typed name is kept

#### Scenario: The response to a creation is lost
- **WHEN** the client repeats a creation with the same identifier and name
- **THEN** it receives the organisation created the first time and no second organisation exists

#### Scenario: An identifier is reused with different content
- **WHEN** a creation uses an existing organisation's identifier with a different name or by a different person
- **THEN** it is rejected as a conflict without revealing the existing organisation

#### Scenario: Two organisations share a name
- **WHEN** two people each create an organisation called "Southside Club"
- **THEN** both exist as separate organisations

### Requirement: A person sees and switches between their organisations
The API SHALL return the signed-in person and the organisations they own, and nothing about other organisations. The admin application SHALL keep the working organisation in its address. With one organisation it SHALL show no selector; with several it SHALL offer the reviewed selector. Switching SHALL replace the context through a full load, asking first when the current tab holds unsaved input.

#### Scenario: A person owns several organisations
- **WHEN** a person who owns two organisations opens the selector
- **THEN** both are listed with the current one marked, and choosing the other loads its workspace without the first one's data

#### Scenario: A person has unsaved input when switching
- **WHEN** the person chooses another organisation with unsaved input in the current tab
- **THEN** the application asks before discarding it, and keeps the current organisation if they decline

#### Scenario: A person without organisations signs in
- **WHEN** a signed-in assigned person owns no organisation
- **THEN** the admin application shows the reviewed creation state

### Requirement: The platform operator can relink a recovered person
When provider recovery fails and the person's ownership is verified out of band, the platform operator SHALL be able to relink their Herald person to a new provider identity with a host command. The relink SHALL move the identity key only, SHALL be refused when the new identity already belongs to another person, and SHALL record the previous and new keys, operator, reason and time. It SHALL NOT merge persons or copy memberships.

#### Scenario: A verified person is relinked
- **WHEN** the operator relinks a person to a new identity that belongs to no one, giving a reason
- **THEN** the new identity resolves to the same person and organisations, the old one resolves to none, and the relink is recorded

#### Scenario: The new identity already has a person
- **WHEN** the operator relinks to an identity that already belongs to another person
- **THEN** the command fails and nothing changes
