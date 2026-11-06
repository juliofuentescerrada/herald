# local-environment Specification

## Purpose
One command starts the host and its database locally, and the host reports its health and its database's.

## Requirements

### Requirement: One command starts the system locally
Running the AppHost SHALL start a PostgreSQL container and the host, with the host receiving the database connection through Aspire and starting only after the database is ready.

#### Scenario: Starting the AppHost
- **WHEN** a developer with Docker runs `dotnet run --project src/Herald.AppHost`
- **THEN** the Aspire dashboard shows PostgreSQL and the host running, and the host's health check is healthy

### Requirement: The host composes every module
The host SHALL register each module through the module's own registration entry point, so that a module is added to the host in one place.

#### Scenario: The host starts with all modules registered
- **WHEN** the host starts
- **THEN** the registration entry point of each module has been called

### Requirement: The host reports its health and its database's
The host SHALL expose a liveness endpoint (`/alive`) that does not depend on the database, and a readiness endpoint (`/health`) that is healthy only when PostgreSQL is reachable.

#### Scenario: Health with the database available
- **WHEN** the host runs against a reachable PostgreSQL and `/health` is requested
- **THEN** the response is 200 with status Healthy

#### Scenario: Health with the database unavailable
- **WHEN** the host runs with a connection string to a database that does not answer and `/health` is requested
- **THEN** the response is 503, while `/alive` still returns 200

