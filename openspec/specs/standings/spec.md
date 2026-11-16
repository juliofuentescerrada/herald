# standings Specification

## Purpose
Each tournament's standings, provisional until the competition is finalised, computed from the effective results Competition publishes: 3/1/0 points, shared positions on equal points, rests without points, each entrant's points explained, and the results revision they reflect.
## Requirements
### Requirement: Standings know the effective results
Competition SHALL publish a running competition's entrants, matches with their state, outcome, cause and whether play took place, and rests as a revisioned snapshot. Standings SHALL keep the snapshot with the highest revision and ignore older ones.

#### Scenario: An older snapshot
- **WHEN** Standings receives results revision 4 after revision 5
- **THEN** it keeps revision 5

### Requirement: Standings rank entrants by points
For each entrant, standings SHALL count resolved matches, wins, draws, losses and points under 3/1/0 from effective results only: a win 3, a draw 1 each, an outcome with no winner 0 each and in none of wins, draws and losses. Matches not resolved SHALL count nothing. Entrants with equal points SHALL share a position, and the next position SHALL skip the shared places; within a shared position entrants SHALL be listed by name.

#### Scenario: Six matches among four players
- **WHEN** all six matches of a four-player league are resolved with Robin Vale winning all three of its matches, Sam Reed and Jamie Brook drawing with each other and each beating Taylor Finch
- **THEN** Robin Vale is 1st with 9 points, Jamie Brook and Sam Reed share 2nd with 4 points each, and Taylor Finch is 4th with 0

#### Scenario: A double absence
- **WHEN** a match is resolved as a double absence
- **THEN** both entrants count it as resolved with 0 points and neither a win, a draw nor a loss

#### Scenario: An unresolved match
- **WHEN** a match is in play
- **THEN** it counts for neither entrant

### Requirement: Rests earn nothing
An entrant's rest round SHALL give no points and SHALL NOT count as a resolved match.

#### Scenario: Five players
- **WHEN** an entrant has rested in round 2
- **THEN** its points are unchanged and its explanation lists "Rest · no points" in round 2

### Requirement: An entrant's points are explained
Standings SHALL list, for each entrant, the resolved matches behind its points with round, opponent, cause and points, and its rest.

#### Scenario: Tracing points
- **WHEN** an owner opens Sam Reed's explanation
- **THEN** it lists each resolved match with its points and they add up to Sam Reed's total

### Requirement: Standings state their status
While the competition runs, standings SHALL be labelled provisional with the number of resolved matches out of the total and the results revision they reflect.

#### Scenario: Partway through
- **WHEN** four of six matches are resolved
- **THEN** the standings read "Provisional · 4 of 6 matches resolved" with their results revision

### Requirement: The admin application shows the standings
Each tournament SHALL have a Standings page beside Configuration, Entries and Schedule. Before start it SHALL state that standings begin when the competition starts. Once started it SHALL show the table with Position, Entrant, Resolved, Won, Drawn, Lost and Points, a shared position marked as shared in text, and each entrant's explanation on demand.

#### Scenario: A shared position
- **WHEN** an owner reads standings where two entrants have 4 points
- **THEN** both rows read position 2, marked shared

### Requirement: Standings flag departures
A withdrawn or disqualified entrant SHALL keep its points and position in the standings and SHALL be flagged as withdrawn or disqualified.

#### Scenario: A withdrawn leader
- **WHEN** the entrant with most points withdraws
- **THEN** it stays first with its points and is flagged as withdrawn

### Requirement: Standings preview a correction
Standings SHALL answer, for a proposed resolution of one match, each affected entrant's points and position before and after over the results it applied, with that results revision, and SHALL answer "updating" when the match revision it holds is not the one the proposal was based on. A preview SHALL change nothing.

#### Scenario: A preview on current results
- **WHEN** an owner previews correcting a win to a draw on the results Standings applied
- **THEN** the answer gives both entrants' points and positions before and after, and the standings are unchanged

#### Scenario: Standings behind
- **WHEN** the proposal is based on a match revision Standings has not applied yet
- **THEN** the answer is "updating" with the revision Standings holds

### Requirement: Final standings keep their revisions
When the competition is finalised, the standings at its results revision SHALL become final and SHALL show the final revision; after a reopening they SHALL be provisional again and SHALL list the earlier final revisions. When every entrant has departed, final standings SHALL keep points, positions and flags and SHALL say that no champion is declared.

#### Scenario: Final standings
- **WHEN** a competition is finalised at results revision 12
- **THEN** the standings are final, revision 12, final revision 1

#### Scenario: No active entrant
- **WHEN** a competition whose entrants all withdrew is finalised
- **THEN** the final standings keep every entrant's points and flags and say that no champion is declared

### Requirement: The admin application reviews and finalises the standings
The Standings page of a fully resolved, running competition SHALL show the results revision, the standings revision and the reviewed revision with "Finalise" only when they agree; a stale review SHALL show that the standings changed with "Review again". A final competition SHALL show "Final", "Reopen" with a required reason and its final revisions.

#### Scenario: Updating standings
- **WHEN** Standings has not yet applied the latest results
- **THEN** the page says the standings are updating and offers no "Finalise"

