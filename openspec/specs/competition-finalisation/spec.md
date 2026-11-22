# competition-finalisation Specification

## Purpose
Finalising a running competition behind the review barrier (every match resolved, the reviewed results revision current), the writes a finalised competition refuses, reasoned reopening with the final revisions kept, and the events that announce both.
## Requirements
### Requirement: Finalisation needs current reviewed standings
An owner SHALL finalise a running competition only when every match is resolved and the results revision they reviewed equals the current results revision. Otherwise it SHALL be rejected without a change, returning the current revision.

#### Scenario: Standings behind the facts
- **WHEN** the results are at revision 12, the standings applied revision 11 and the owner sends a finalisation reviewed at 11
- **THEN** it is rejected as stale with the current revision 12, and the competition stays running

#### Scenario: A correction after the review
- **WHEN** the owner reviewed revision 12 and a correction moves the results to 13 before they finalise
- **THEN** the finalisation is rejected as stale and the owner is asked to review again

#### Scenario: Current reviewed standings
- **WHEN** the owner finalises with reviewed revision 12 and the results are at 12 with every match resolved
- **THEN** the competition is finalised with final revision 1 at results revision 12

#### Scenario: An unresolved match
- **WHEN** an owner finalises while one match is in play
- **THEN** it is rejected and the match is named

### Requirement: A finalised competition accepts no competitive write
Results, lineups, match starts, departures and corrections SHALL be rejected on a finalised competition, saying that it must be reopened first. Registration SHALL stay closed.

#### Scenario: A correction after finalisation
- **WHEN** an owner corrects a result of a finalised competition
- **THEN** the write is rejected with "reopen the competition first"

### Requirement: An owner reopens a finalised competition with a reason
An owner SHALL reopen a finalised competition with a reason of at most 500 characters, private to the organisation; without one it SHALL be rejected. The competition SHALL return to running and SHALL keep the previous final revision. Registration SHALL stay closed and frozen rosters SHALL stay frozen. Finalising again SHALL need a new review and SHALL add the next final revision.

#### Scenario: Reopen and finalise again
- **WHEN** an owner reopens a competition finalised at results revision 12 with the reason "Result appeal upheld", corrects a result and finalises at revision 13
- **THEN** final revision 1 at 12 is kept and final revision 2 at 13 is current

#### Scenario: No reason
- **WHEN** an owner reopens without a reason
- **THEN** the write is rejected and the competition stays finalised

### Requirement: Finalisation is announced to the other modules
Competition SHALL publish finalisation and reopening, with the results revision and the final revision number, in the same transaction as the change. Tournaments SHALL show the competition as finalised or running accordingly.

#### Scenario: The tournament list after finalisation
- **WHEN** a competition is finalised
- **THEN** the tournament's lifecycle labels show "Finalised"

