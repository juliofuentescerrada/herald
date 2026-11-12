## ADDED Requirements

### Requirement: Synthetic data is made through the application's endpoints
The seeding tool SHALL write every piece of synthetic data through Herald's admin endpoints, running the host in its own process against the target database, so that the aggregates' invariants, durable history and integration events apply as they do for a person. The tool's authentication SHALL exist only inside its process.

#### Scenario: A seeded team tournament reaches Registration
- **WHEN** the tool seeds a published team tournament with open registration and entries
- **THEN** Registration holds the tournament's entry terms received through the integration event, and the entries and roster changes carry the persona as actor with their revisions

#### Scenario: The tool finishes only when the outbox is empty
- **WHEN** the tool has run every scenario
- **THEN** it exits successfully only after no integration event remains pending, and fails with a timeout message otherwise

### Requirement: Scenarios are named, deterministic and invented
Each scenario SHALL have a name, a persona and a fixed sequence of steps. Names SHALL come from fixed invented lists, game-agnostic, never real people and no Wizards of the Coast content. Dates SHALL be relative to the time of seeding.

#### Scenario: The same scenario seeded twice on fresh databases
- **WHEN** a scenario is seeded on two empty databases
- **THEN** both contain the same organisations, tournaments, guests, entries and rosters with the same names, and dates that differ only by the time between the two runs

#### Scenario: An open registration stays open
- **WHEN** the open-registration scenario is seeded
- **THEN** the tournament's registration is open and its announced closing date is in the future

### Requirement: Personas are configured identities
Each scenario SHALL belong to a persona whose directory identifier, object identifier and display name come from configuration, so that a person signing in with that identity finds the persona's organisation.

#### Scenario: Signing in as the seeded persona
- **WHEN** the main persona is configured with a person's directory and object identifiers and the tool has run
- **THEN** that person, signing in, finds the seeded organisation as its owner

#### Scenario: Isolation between personas
- **WHEN** the tool has seeded the second organisation for another persona
- **THEN** the main persona cannot read or change that organisation's tournaments

### Requirement: Seeding is safe to repeat and never runs in production
The tool SHALL skip a scenario whose organisation already exists for its persona, and SHALL refuse to run, before connecting, when the environment is production.

#### Scenario: Seeding a database that is already seeded
- **WHEN** the tool runs on a database it has already seeded
- **THEN** it skips every scenario, reports them as already present, and changes nothing

#### Scenario: Production refused
- **WHEN** the tool is started with the production environment
- **THEN** it exits with an error naming the environment and opens no connection

### Requirement: CI runs the seeding
CI SHALL seed a throwaway database with every scenario, so that a change that breaks a scenario fails the build.

#### Scenario: An endpoint change breaks a scenario
- **WHEN** a change makes an endpoint reject a step of a scenario
- **THEN** the CI run fails and names the scenario and the rejected step
