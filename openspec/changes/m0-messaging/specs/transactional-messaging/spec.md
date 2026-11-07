## ADDED Requirements

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
