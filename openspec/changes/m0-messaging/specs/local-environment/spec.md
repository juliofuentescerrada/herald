## MODIFIED Requirements

### Requirement: One command starts the system locally
Running the AppHost SHALL start a PostgreSQL container, the Azure Service Bus emulator with the topics and subscriptions the modules use, and the host, with the host receiving both connections through Aspire and starting only after the database and the emulator are ready. The AppHost SHALL be the only source of the Service Bus topology: the host SHALL NOT create topics, subscriptions or queues.

#### Scenario: Starting the AppHost
- **WHEN** a developer with Docker runs `dotnet run --project src/Herald.AppHost`
- **THEN** the Aspire dashboard shows PostgreSQL, the Service Bus emulator and the host running, and the host's health check is healthy

#### Scenario: The host creates no broker topology
- **WHEN** the host starts against the emulator
- **THEN** it sends and receives through the topics and subscriptions declared in the AppHost and creates none of its own

### Requirement: The host reports its health and its database's
The host SHALL expose a liveness endpoint (`/alive`) that does not depend on the database, and a readiness endpoint (`/health`) that is healthy only when PostgreSQL is reachable. The host MAY refuse to start while the database does not answer, because Wolverine registers its node there at start-up; once running, it SHALL stay alive while the database is unavailable.

#### Scenario: Health with the database available
- **WHEN** the host runs against a reachable PostgreSQL and `/health` is requested
- **THEN** the response is 200 with status Healthy

#### Scenario: Health when the database stops answering
- **WHEN** the host has started against a reachable PostgreSQL, the database then stops answering, and `/health` is requested
- **THEN** the response is 503, while `/alive` still returns 200
