## MODIFIED Requirements

### Requirement: One command starts the system locally
Running the AppHost SHALL start a PostgreSQL container, the Azure Service Bus emulator with the topics and subscriptions the modules use, and the host, with the host receiving both connections through Aspire and starting only after the database and the emulator are ready.

#### Scenario: Starting the AppHost
- **WHEN** a developer with Docker runs `dotnet run --project src/Herald.AppHost`
- **THEN** the Aspire dashboard shows PostgreSQL, the Service Bus emulator and the host running, and the host's health check is healthy
