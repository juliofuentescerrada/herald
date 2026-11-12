# local-environment Specification

## Purpose
One command starts the host, its database and the Service Bus emulator locally, and the host reports its health and its database's.
## Requirements
### Requirement: One command starts the system locally
Running the AppHost SHALL start a PostgreSQL container, the Azure Service Bus emulator with the topics and subscriptions the modules use, and the host, with the host receiving both connections through Aspire and starting only after the database and the emulator are ready. The AppHost SHALL be the only source of the Service Bus topology: the host SHALL NOT create topics, subscriptions or queues.

#### Scenario: Starting the AppHost
- **WHEN** a developer with Docker runs `dotnet run --project src/Herald.AppHost`
- **THEN** the Aspire dashboard shows PostgreSQL, the Service Bus emulator and the host running, and the host's health check is healthy

#### Scenario: The host creates no broker topology
- **WHEN** the host starts against the emulator
- **THEN** it sends and receives through the topics and subscriptions declared in the AppHost and creates none of its own

### Requirement: The host composes every module
The host SHALL register each module through the module's own registration entry point, so that a module is added to the host in one place.

#### Scenario: The host starts with all modules registered
- **WHEN** the host starts
- **THEN** the registration entry point of each module has been called

### Requirement: The host reports its health and its database's
The host SHALL expose a liveness endpoint (`/alive`) that does not depend on the database, and a readiness endpoint (`/health`) that is healthy only when PostgreSQL is reachable. The host MAY refuse to start while the database does not answer, because Wolverine registers its node there at start-up; once running, it SHALL stay alive while the database is unavailable.

#### Scenario: Health with the database available
- **WHEN** the host runs against a reachable PostgreSQL and `/health` is requested
- **THEN** the response is 200 with status Healthy

#### Scenario: Health with the database unavailable
- **WHEN** the host has started against a reachable PostgreSQL, the database then stops answering, and `/health` is requested
- **THEN** the response is 503, while `/alive` still returns 200

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

