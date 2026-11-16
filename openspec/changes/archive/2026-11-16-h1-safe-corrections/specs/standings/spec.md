## ADDED Requirements

### Requirement: Standings preview a correction
Standings SHALL answer, for a proposed resolution of one match, each affected entrant's points and position before and after over the results it applied, with that results revision, and SHALL answer "updating" when the match revision it holds is not the one the proposal was based on. A preview SHALL change nothing.

#### Scenario: A preview on current results
- **WHEN** an owner previews correcting a win to a draw on the results Standings applied
- **THEN** the answer gives both entrants' points and positions before and after, and the standings are unchanged

#### Scenario: Standings behind
- **WHEN** the proposal is based on a match revision Standings has not applied yet
- **THEN** the answer is "updating" with the revision Standings holds
