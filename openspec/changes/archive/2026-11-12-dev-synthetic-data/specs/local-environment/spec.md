## ADDED Requirements

### Requirement: A local run starts populated
When the persona identifiers are configured, running the AppHost SHALL run the seeding tool once after the host is ready, so that a local run starts with the synthetic scenarios. Without them, the AppHost SHALL start as before and show the seeding as skipped with its reason.

#### Scenario: Starting the AppHost with personas configured
- **WHEN** a developer with the persona identifiers in user secrets runs `dotnet run --project src/Herald.AppHost` on an empty database
- **THEN** the seeding resource runs to completion after the host is healthy, and signing in as the main persona shows the seeded organisation

#### Scenario: Starting the AppHost again on a kept volume
- **WHEN** the developer runs the AppHost again with the same database volume
- **THEN** the seeding resource completes without changing any data

#### Scenario: Starting the AppHost without personas
- **WHEN** no persona identifiers are configured
- **THEN** the system starts as before and the dashboard shows the seeding resource as skipped because no persona is configured
