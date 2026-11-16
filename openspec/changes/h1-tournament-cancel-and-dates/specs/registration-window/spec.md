## MODIFIED Requirements

### Requirement: An owner closes and reopens registration
An owner SHALL be able to close an open registration and reopen a closed one. Closing SHALL make registration closed, record the acting person and time, and change nothing else: entries keep their state, and no entry is admitted automatically while registration is closed. Reopening SHALL have the same preconditions and effects as opening. The announced closure date SHALL NOT close registration by itself. Closing a registration that was never opened SHALL be rejected.

#### Scenario: Registration is closed
- **WHEN** an owner closes an open registration
- **THEN** registration is closed, the tournament is still published with competition in preparation, and the acting person and time are recorded

#### Scenario: Registration is reopened
- **WHEN** an owner reopens a closed registration that has both registration dates
- **THEN** registration is open

#### Scenario: Registration was never opened
- **WHEN** an owner closes the registration of a tournament whose registration is not open
- **THEN** the action is rejected and registration is still not open

#### Scenario: The closure date passes
- **WHEN** the announced closure date passes while registration is open
- **THEN** registration is still open

#### Scenario: Closing keeps the entries
- **WHEN** an owner closes a registration with admitted and waiting entries
- **THEN** every entry keeps its state and its place in the waiting order
