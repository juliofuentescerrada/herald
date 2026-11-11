# transactional-messaging Specification

## Purpose
A module's state change and its messages commit together; messages are kept in one shared store, handled once within the deduplication window, and kept as dead letters when they keep failing.

## Requirements

### Requirement: Messages are kept in one shared store
Every module's outgoing (outbox), incoming (inbox) and failed (dead letter) messages SHALL be stored in one message store in the `wolverine` schema of the database that holds the modules' state; module schemas SHALL hold no message tables.

#### Scenario: A message between modules passes through the shared store
- **WHEN** a handler in one module publishes a message that a handler in another module receives
- **THEN** the envelope is recorded in the `wolverine` schema, none in either module's schema, and after delivery no envelope remains pending

#### Scenario: Nothing is delivered again after a restart
- **WHEN** a message between modules has been handled and the host restarts
- **THEN** the receiving handler does not run again

### Requirement: State and outgoing messages commit together
A handler's state change and the messages it publishes SHALL be committed in one transaction, and messages SHALL be sent only after that commit.

#### Scenario: The handler succeeds
- **WHEN** a handler saves a change and publishes a message, and completes
- **THEN** the change is stored and the message is delivered to its receiver

#### Scenario: The handler fails
- **WHEN** a handler saves a change and publishes a message, and then throws
- **THEN** neither the change nor an outgoing envelope remains, and nothing is delivered

### Requirement: A message is handled once
A message delivered more than once with the same identity within the configured deduplication window SHALL be handled once by its receiver. The window SHALL be set explicitly in Herald's messaging configuration rather than left to a library default.

#### Scenario: A redelivered message
- **WHEN** the same message is delivered twice to a module within the deduplication window
- **THEN** the receiving handler runs once

#### Scenario: A redelivery after the host restarts
- **WHEN** the same message is delivered again after the host restarts, still within the deduplication window
- **THEN** the receiving handler does not run again

### Requirement: Failing messages are kept
A message whose handler keeps failing SHALL end in the dead letters after its retries, recorded with the endpoint that received it, not be dropped.

#### Scenario: A handler that always fails
- **WHEN** a message is delivered to a handler that throws every time
- **THEN** after the retries the message is in the dead letters, with the receiving endpoint

### Requirement: Modules plug into the host in one place
Each module SHALL register its `DbContext` and the discovery of its handlers and endpoints through `Herald.ModuleHosting`, from its entry point, so that test modules and real modules are hosted the same way.

#### Scenario: A module is hosted
- **WHEN** the host starts with a module registered through its entry point
- **THEN** the module's handlers and endpoints save their messages in the shared store in the same transaction as the module's `DbContext`

### Requirement: Integration events between modules of the host travel through durable local queues
An integration event published by one module of the host and handled by another SHALL be routed to a durable local queue of the host, through the outbox and inbox of the shared store, not through an external broker. Its contract SHALL live in `Herald.Contracts` and carry a version. A consumer SHALL be idempotent beyond the deduplication window: an event that does not advance what the consumer already holds SHALL change nothing. The routing SHALL be the same in the host, its tests and the end-to-end suite.

#### Scenario: An event reaches the other module without a broker
- **WHEN** the host runs without a message broker and a module publishes an integration event that another module handles
- **THEN** the other module handles it after the publisher's transaction commits

#### Scenario: An older event arrives after a newer one
- **WHEN** a consumer receives an event older than the state it already holds for the same subject
- **THEN** the consumer's state is unchanged
