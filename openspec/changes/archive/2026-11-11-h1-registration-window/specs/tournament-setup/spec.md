## MODIFIED Requirements

### Requirement: A published tournament stays editable and complete
An owner SHALL be able to change the configuration of a published tournament, including its entry kind while no entries exist. A save of a published tournament SHALL be rejected, naming the values, when it would leave any value required for publication absent. While its registration is open, a save SHALL also be rejected, naming the values, when it would leave the registration opening or the registration closure absent.

#### Scenario: A published tournament's capacity changes
- **WHEN** an owner saves a published tournament with capacity 16 instead of 8
- **THEN** the save succeeds and the tournament is still published

#### Scenario: A save would make a published tournament incomplete
- **WHEN** an owner saves a published tournament with no planned start
- **THEN** the save is rejected naming the planned start and the stored configuration is unchanged

#### Scenario: A save would remove a registration date while registration is open
- **WHEN** an owner saves a tournament whose registration is open with no registration closure
- **THEN** the save is rejected naming the registration closure and the stored configuration is unchanged

#### Scenario: A registration date is removed while registration is closed
- **WHEN** an owner saves a tournament whose registration is closed or not open with no registration opening
- **THEN** the save succeeds

### Requirement: An owner lists and reads the organisation's tournaments
The API SHALL return the working organisation's tournaments, newest first, each with its title, game/variant, entry kind, capacity, planned start with its time zone, location and the three lifecycle facts (publication, registration, competition). The registration fact SHALL be the tournament's current registration state: not open, open or closed. It SHALL return one tournament with its full configuration, revision, lifecycle facts, the values missing for publication, the values missing to open registration, and the time of the last registration change when there is one. Tournaments SHALL be organisation-owned: a member of another organisation SHALL receive the same generic not-found response as for a tournament that does not exist, on reads and writes. No public API operation SHALL expose a tournament in this change, whatever its visibility.

#### Scenario: An organisation has no tournaments
- **WHEN** an owner lists the tournaments of a new organisation
- **THEN** the list is empty

#### Scenario: Two organisations each have tournaments
- **WHEN** an owner of one organisation lists its tournaments
- **THEN** the list contains only that organisation's tournaments

#### Scenario: Another organisation's owner reads a tournament by its identifier
- **WHEN** a person who owns a different organisation requests a tournament through their own organisation's address
- **THEN** the response is the generic not-found problem, with nothing of the tournament

#### Scenario: Another organisation's owner writes a tournament by its identifier
- **WHEN** that person saves or publishes the tournament through their own organisation's address
- **THEN** the response is the generic not-found problem and the tournament is unchanged

#### Scenario: A public tournament is published
- **WHEN** a tournament with public visibility is published
- **THEN** the public API document has no operation that returns it

#### Scenario: A published tournament reports what opening registration lacks
- **WHEN** an owner reads a published tournament with no registration opening
- **THEN** the response lists the registration opening among the values missing to open registration

#### Scenario: A tournament with open registration is listed
- **WHEN** an owner lists tournaments after opening the registration of one
- **THEN** that tournament's registration fact is open and the others' are unchanged
