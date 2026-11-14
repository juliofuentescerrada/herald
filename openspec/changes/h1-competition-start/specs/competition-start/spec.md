## ADDED Requirements

### Requirement: The owner reads the start readiness
For a published tournament whose competition has not started, the owner SHALL read each start condition with whether it holds and how to fix it: registration closed; no admitted entry pending a mandatory check-in; at least two eligible entrants; a published schedule built from the current eligible field; for a team tournament, every admitted team's roster within the profile's minimum and maximum. A same-name flag on a roster SHALL be shown as a warning and SHALL NOT block.

#### Scenario: A tournament not yet ready
- **WHEN** an owner reads the readiness of a tournament with registration open, two pending entries and no published schedule
- **THEN** the three conditions are reported unmet, each with how to fix it

#### Scenario: A roster below the minimum
- **WHEN** an owner reads the readiness of a team tournament where one admitted team has two players and the minimum is three
- **THEN** the roster condition is unmet naming that team and the bound

#### Scenario: A same-name warning
- **WHEN** two admitted teams have members with the same name and every other condition holds
- **THEN** the tournament is ready and the warning is shown

### Requirement: The owner starts a ready competition
An owner SHALL start the competition of a tournament whose start conditions all hold. Start SHALL make the competition running, record who and when, and record the eligible revision and schedule revision it started on. It SHALL start no match. Starting with an unmet condition SHALL be rejected naming each one. Repeating a start SHALL return the started tournament; a stale revision SHALL be rejected with the current tournament.

#### Scenario: Start with four eligible players
- **WHEN** an owner starts a ready tournament with four eligible players and schedule revision 1 published
- **THEN** the competition is running on revision 1, with who and when, and no match has started

#### Scenario: Fewer than two eligible entrants
- **WHEN** an owner starts a tournament whose registration closed with one admitted entry
- **THEN** the start is rejected stating that at least two eligible entrants are needed, and competition is still preparing

#### Scenario: A stale schedule
- **WHEN** an owner starts a tournament whose eligible field changed after its schedule was published
- **THEN** the start is rejected naming the schedule

### Requirement: Start fixes the field
After start, admitting, cancelling and checking in or undoing a check-in SHALL be rejected stating that the competition has started.

#### Scenario: Cancelling after start
- **WHEN** an owner cancels an admitted entry of a running competition
- **THEN** the write is rejected and the entry is still admitted

### Requirement: A change that crossed the start is reported
When Registration or Competition accepted a write that the start's readiness did not see, the tournament SHALL report it on the Competition panel and where it happened, and SHALL NOT repair it.

#### Scenario: A roster edit crossed the start
- **WHEN** a roster member was removed just before Registration learned of the start, leaving the roster below its minimum
- **THEN** the Competition panel and the roster report the frozen roster outside its bounds

### Requirement: The admin application shows readiness and starts the competition
The tournament's configuration page SHALL show a Competition panel after the Registration panel with the readiness conditions, each with its state and a link to fix it, and "Start competition", disabled with the first unmet condition as its description. Start SHALL ask for confirmation stating what it fixes. Once running, the lifecycle label SHALL read "Running" and the entries page, roster dialog and Schedule page SHALL be read-only with the reason.

#### Scenario: The owner starts from the panel
- **WHEN** an owner confirms "Start competition" on a ready tournament
- **THEN** the page shows "Running" beside the title and the panel shows who started it and when
