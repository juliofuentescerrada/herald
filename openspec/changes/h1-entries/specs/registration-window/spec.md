## MODIFIED Requirements

### Requirement: An owner opens the registration of a published tournament
An organisation's owner SHALL be able to open the registration of a tournament of that organisation that is published and whose registration is not open. Opening SHALL require the registration opening and registration closure dates to be present, and SHALL be rejected naming each missing one. Opening SHALL be an explicit action: the announced dates SHALL NOT open registration by themselves, and the current time SHALL NOT prevent the action. Opening SHALL make registration open, record the acting person and time, and change nothing else in the tournament: publication, competition and configuration stay as they were. Existing entries SHALL keep their state, except that with automatic admission free slots SHALL admit entries waiting with "capacity full" (guest entries). A draft's registration SHALL NOT be opened.

#### Scenario: Registration is opened
- **WHEN** an owner opens the registration of a published tournament that has both registration dates
- **THEN** its registration is open, it is still published with competition in preparation, its configuration is unchanged, and the acting person and time are recorded

#### Scenario: The registration dates are missing
- **WHEN** an owner opens the registration of a published tournament with no registration closure
- **THEN** the action is rejected naming the registration closure and registration is still not open

#### Scenario: The tournament is a draft
- **WHEN** an owner opens the registration of a draft
- **THEN** the action is rejected and the draft's registration is still not open

#### Scenario: The announced opening has not arrived
- **WHEN** an owner opens registration before the announced opening date
- **THEN** registration is open

#### Scenario: The opening date passes
- **WHEN** the announced opening date passes and nobody has opened registration
- **THEN** registration is still not open

#### Scenario: Reopening fills free slots
- **WHEN** an owner reopens the registration of a tournament with automatic admission, one free slot and two entries waiting with "capacity full"
- **THEN** the first waiting entry is admitted and the second still waits

### Requirement: An owner closes and reopens registration
An owner SHALL be able to close an open registration and reopen a closed one. Closing SHALL make registration closed, record the acting person and time, and change nothing else: entries keep their state, and no entry is admitted automatically while registration is closed. Reopening SHALL have the same preconditions and effects as opening. The announced closure date SHALL NOT close registration by itself. Closing a registration that was never opened SHALL be rejected.

#### Scenario: Registration is closed
- **WHEN** an owner closes an open registration
- **THEN** registration is closed, the tournament is still published with competition in preparation, and the acting person and time are recorded

#### Scenario: Registration is reopened
- **WHEN** an owner reopens a closed registration that has both registration dates
- **THEN** registration is open

#### Scenario: A closed registration lost a date
- **WHEN** an owner reopens a closed registration after its registration opening was removed
- **THEN** the action is rejected naming the registration opening and registration is still closed

#### Scenario: Registration was never opened
- **WHEN** an owner closes the registration of a tournament whose registration is not open
- **THEN** the action is rejected and registration is still not open

#### Scenario: The closure date passes
- **WHEN** the announced closure date passes while registration is open
- **THEN** registration is still open

#### Scenario: Closing keeps the entries
- **WHEN** an owner closes a registration with admitted and waiting entries
- **THEN** every entry keeps its state and its place in the waiting order
