## ADDED Requirements

### Requirement: The tool can reset Herald's schemas before seeding
When its configuration asks for a reset, the tool SHALL drop Herald's own schemas in its target database, its modules' and Wolverine's, before migrating and seeding, without dropping the database and without server privileges. It SHALL never reset unless asked, and SHALL refuse in production as it refuses to seed.

#### Scenario: Resetting a seeded database
- **WHEN** the tool runs with a reset on a database it has already seeded and that holds an extra organisation
- **THEN** afterwards the database holds exactly the seeded scenarios, and the extra organisation is gone

#### Scenario: No reset unless asked
- **WHEN** the tool runs without a reset on a database it has already seeded
- **THEN** no schema is dropped and every scenario is skipped as already present
