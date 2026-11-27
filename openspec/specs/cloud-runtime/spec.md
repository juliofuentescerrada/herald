# cloud-runtime Specification

## Purpose
How Herald's host and public server run in a deployed slot: messaging without a broker by configuration, PostgreSQL reached with the slot identity's Entra token, health probes, telemetry sampled for Application Insights and the public server forwarding `/api` to the internal API (ADRs 0012, 0019; change `m4-cloud-runtime`).

## Requirements

### Requirement: The host runs without a broker by configuration
The host SHALL register no message transport when `Herald:Messaging:Broker` is `None`, and integration events between its modules SHALL still travel through durable local queues and the PostgreSQL outbox. The default SHALL remain Azure Service Bus.

#### Scenario: A host configured without a broker delivers an integration event
- **WHEN** the host starts with `Herald:Messaging:Broker` set to `None` and a module publishes an integration event
- **THEN** the consuming module handles it, and no Service Bus connection is attempted

### Requirement: The host reaches PostgreSQL as a managed identity
With `Herald:Database:Authentication` set to `Entra`, the host SHALL authenticate to PostgreSQL with an Entra access token for the configured identity instead of a password, and SHALL refresh the token before it expires.

#### Scenario: Entra authentication configures a token instead of a password
- **WHEN** the host is configured with `Entra` authentication and an identity, and a connection string without a password
- **THEN** its data source obtains its password from a token provider for the PostgreSQL scope, refreshed before the token's expiry

### Requirement: A deployed host answers its probes
When the host detects Azure hosting it SHALL map `/alive` and `/health` as it does in Development; the OpenAPI documents SHALL stay unmapped outside Development.

#### Scenario: Health endpoints in a deployment
- **WHEN** the host runs in Production with `CONTAINER_APP_NAME` set and a reachable database
- **THEN** `/alive` and `/health` return 200 and `/openapi/admin.json` returns 404

### Requirement: A deployed host exports sampled telemetry
With an Application Insights connection string configured, the host SHALL export logs, metrics and traces to it, sampling traces at the configured ratio and not sampling logs or metrics.

#### Scenario: Traces are sampled at the configured ratio
- **WHEN** the host is configured with an Application Insights connection string and a trace sample ratio of 0.25
- **THEN** its tracer uses a parent-based ratio sampler of 0.25 and its logs and metrics have no sampler

### Requirement: The public server forwards the browser's API requests
The public server SHALL forward requests under `/api/` on its own origin to the configured API address, passing the method, body, status and the browser's headers unchanged, so the browser never needs the API's own address.

#### Scenario: A browser request to the public origin's API path
- **WHEN** a browser sends `GET /api/tournaments/…` with an `Authorization` header to the public server
- **THEN** the API receives the same path, query and header, and the browser receives the API's status and body
