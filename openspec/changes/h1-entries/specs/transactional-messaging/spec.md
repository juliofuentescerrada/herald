## ADDED Requirements

### Requirement: Integration events between modules of the host travel through durable local queues
An integration event published by one module of the host and handled by another SHALL be routed to a durable local queue of the host, through the outbox and inbox of the shared store, not through an external broker. Its contract SHALL live in `Herald.Contracts` and carry a version. A consumer SHALL be idempotent beyond the deduplication window: an event that does not advance what the consumer already holds SHALL change nothing. The routing SHALL be the same in the host, its tests and the end-to-end suite.

#### Scenario: An event reaches the other module without a broker
- **WHEN** the host runs without a message broker and a module publishes an integration event that another module handles
- **THEN** the other module handles it after the publisher's transaction commits

#### Scenario: An older event arrives after a newer one
- **WHEN** a consumer receives an event older than the state it already holds for the same subject
- **THEN** the consumer's state is unchanged
