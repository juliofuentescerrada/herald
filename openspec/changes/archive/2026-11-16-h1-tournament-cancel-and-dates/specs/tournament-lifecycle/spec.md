## ADDED Requirements

### Requirement: An owner cancels a tournament with a reason
An owner SHALL cancel a published tournament that is preparing or running with a reason of at most 500 characters, private to the organisation; without one it SHALL be rejected. A finalised competition SHALL NOT be cancelled. Cancellation SHALL close registration, SHALL be final and SHALL be announced to the other modules in the same transaction.

#### Scenario: Before start
- **WHEN** an owner cancels a tournament with registration open and the reason "Venue unavailable"
- **THEN** it is cancelled, registration is closed and the reason is kept privately

#### Scenario: No reason
- **WHEN** an owner cancels without a reason
- **THEN** the write is rejected and the tournament is unchanged

#### Scenario: Finalised
- **WHEN** an owner cancels a finalised competition
- **THEN** the write is rejected

### Requirement: A cancelled tournament accepts no write
After cancellation every write to the tournament, its entries, rosters, schedule, matches and standings SHALL be rejected, including requests that arrive late.

#### Scenario: A late result
- **WHEN** a result is sent for a match of a cancelled competition after the cancellation reached Competition
- **THEN** it is rejected because the tournament is cancelled

### Requirement: Cancellation after start declares nothing
Cancelling a running competition SHALL keep effective results, recorded play and lineups, SHALL resolve every unresolved match as voided by the tournament's cancellation with no points, and the standings SHALL declare no champion and no final ranking.

#### Scenario: Two matches left
- **WHEN** an owner cancels a league with four resolved and two scheduled matches
- **THEN** the four results stay, the two matches are voided with no points and the standings show "Cancelled" with no champion

### Requirement: Only terminal tournaments are archived
An owner SHALL archive a finalised or cancelled tournament and unarchive it; archiving SHALL hide it from the default list without deleting anything or changing its visibility. Other tournaments SHALL NOT be archived. Reopening an archived finalised competition SHALL require unarchiving first.

#### Scenario: Archiving a running tournament
- **WHEN** an owner archives a running tournament
- **THEN** the write is rejected

#### Scenario: Show archived
- **WHEN** an owner archives a finalised tournament and then lists with "Show archived"
- **THEN** it is absent from the default list and listed with "Show archived", still finalised

### Requirement: An owner deletes a draft
An owner SHALL delete a draft tournament after a confirmation; nothing of it SHALL remain. A published tournament SHALL NOT be deleted.

#### Scenario: Deleting a published tournament
- **WHEN** an owner deletes a published tournament
- **THEN** the write is rejected and the owner is pointed to cancelling or archiving

### Requirement: Dates change before start through a preview
Once published and before the competition starts, an owner SHALL change only the selected dates among registration opening, registration closure and planned start, seeing old and new values with the reference time zone; the result SHALL keep opening before closure and closure not after the planned start. Old and new values SHALL be kept with who and when. A frozen roster and check-ins SHALL stay. After start dates SHALL be rejected.

#### Scenario: Postponing the start
- **WHEN** an owner changes only the planned start from 22 to 29 November 2026, 10:00 Europe/Madrid
- **THEN** only the planned start changes and the change is kept with the old and new values

#### Scenario: Invalid order
- **WHEN** an owner moves the registration closure after the planned start
- **THEN** the write is rejected naming both dates, and nothing changes

#### Scenario: After start
- **WHEN** an owner changes a date of a running competition
- **THEN** the write is rejected because the dates are fixed after start
