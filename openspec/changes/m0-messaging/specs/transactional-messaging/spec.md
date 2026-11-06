## ADDED Requirements

### Requirement: Each module keeps its messages in its own schema
Each module SHALL store its outgoing (outbox), incoming (inbox) and failed (dead letter) messages in its own PostgreSQL schema, next to its state; the host's `wolverine` schema SHALL hold no module's messages.

#### Scenario: A message between modules is stored by both modules
- **WHEN** a handler in one module publishes a message that a handler in another module receives
- **THEN** the sent envelope is recorded in the sender's schema and the received envelope in the receiver's schema, and neither in the `wolverine` schema

### Requirement: State and outgoing messages commit together
A handler's state change and the messages it publishes SHALL be committed in one transaction in its module's schema, and messages SHALL be sent only after that commit.

#### Scenario: The handler succeeds
- **WHEN** a handler saves a change and publishes a message, and completes
- **THEN** the change is stored and the message is delivered to its receiver

#### Scenario: The handler fails
- **WHEN** a handler saves a change and publishes a message, and then throws
- **THEN** neither the change nor an outgoing envelope remains, and nothing is delivered

### Requirement: A message is handled once
A message delivered more than once with the same identity SHALL be handled once by its receiver.

#### Scenario: A redelivered message
- **WHEN** the same message is delivered twice to a module
- **THEN** the receiving handler runs once

### Requirement: Failing messages are kept
A message whose handler keeps failing SHALL end in the receiving module's dead letters after its retries, not be dropped.

#### Scenario: A handler that always fails
- **WHEN** a message is delivered to a handler that throws every time
- **THEN** after the retries the message is in the receiving module's dead letters

### Requirement: Modules plug into the host in one place
Each module SHALL register its message store, its `DbContext` and the routing of its handlers and endpoints through `Herald.ModuleHosting`, from its entry point, so that test modules and real modules are hosted the same way.

#### Scenario: A module is hosted
- **WHEN** the host starts with a module registered through its entry point
- **THEN** the module's handlers and endpoints use the message store in the module's schema
