## ADDED Requirements

### Requirement: An owner records a played result
An owner SHALL record a played result for a match of a running competition: one entrant wins, or the match is drawn. The result SHALL be effective at once with the cause "played", that play occurred, and who and when. It SHALL carry no score.

#### Scenario: A win
- **WHEN** an owner records that Robin Vale won an individual match in play
- **THEN** the match is resolved with Robin Vale as winner, cause played, and who and when

#### Scenario: A draw
- **WHEN** an owner records a draw in a match of the generic profile
- **THEN** the match is resolved as a draw with cause played

### Requirement: An individual result starts and resolves in one step
For an individual match that has not started, recording a played result SHALL start and resolve it in one operation.

#### Scenario: A scheduled individual match
- **WHEN** an owner records a win on a scheduled individual match
- **THEN** the match is resolved and its start is recorded with the same who and when

### Requirement: A played team result needs the match in play
For a team match, recording a played result SHALL require the match to be in play. The players of the two locked lineups SHALL each be credited with an appearance; roster members outside them SHALL NOT.

#### Scenario: A team match not started
- **WHEN** an owner records a played result for a scheduled team match
- **THEN** the write is rejected stating that the match must start first

#### Scenario: Reserves
- **WHEN** an owner records a played result for a team match whose sides have seven-player rosters and five-player locked lineups
- **THEN** the ten locked players have an appearance and the four reserves have none

### Requirement: A match has one effective result
A resolved match SHALL reject another result, stating that corrections come later. Repeating the same operation SHALL return the original result without changing it. A stale revision SHALL be rejected with the current match, and nothing partial SHALL be stored.

#### Scenario: A double submission
- **WHEN** the same result operation reaches Herald twice
- **THEN** the match has one result and both responses return it

#### Scenario: A second result
- **WHEN** an owner records a different result on a resolved match
- **THEN** the write is rejected and the first result stands

### Requirement: The admin application records and shows results
The Match page SHALL show a Result panel with the outcome as a choice that starts with nothing selected and "Record result", disabled until an outcome is chosen. Once resolved, the panel SHALL show the outcome in words with its cause, who and when. The Schedule page SHALL show each resolved match's outcome.

#### Scenario: No preselected winner
- **WHEN** an owner opens the Result panel of a match without a result
- **THEN** no outcome is selected and "Record result" is disabled
