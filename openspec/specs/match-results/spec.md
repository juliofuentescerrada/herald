# match-results Specification

## Purpose
An owner records the one effective played result of a match: a winner or a draw, with no score; an individual match starts and resolves in one step, a team match must be in play and credits its locked starters with an appearance.
## Requirements
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

### Requirement: An owner records a concession
An owner SHALL record that one entrant of a match conceded, stating whether play took place. The opponent SHALL win and score 3, the conceding entrant 0. A concession before play SHALL credit no appearance; after play, the locked lineups' appearances SHALL be kept.

#### Scenario: Before play
- **WHEN** an owner records that Sam Reed conceded a scheduled match before play
- **THEN** the match is resolved, Sam Reed's opponent wins, no play is recorded and no appearance is credited

#### Scenario: After play in a team match
- **WHEN** an owner records that a team conceded a match in play after play took place
- **THEN** the opponent wins and the players of both locked lineups keep their appearance

### Requirement: An owner records an absence
An owner SHALL record that one entrant, or both, were absent from a match that has not started. A single absence SHALL make the ready opponent win; a double absence SHALL give no winner and 0 to each. An absence SHALL record no play and credit no appearance, and SHALL NOT withdraw either entrant.

#### Scenario: A single absence
- **WHEN** an owner records that Jamie Brook was absent from a scheduled match
- **THEN** the opponent wins, no play is recorded and Jamie Brook can still play later matches

#### Scenario: A double absence
- **WHEN** an owner records that both entrants were absent
- **THEN** the match is resolved with no winner, 0 points each and no appearances

#### Scenario: An absence after start
- **WHEN** an owner records an absence on a match in play
- **THEN** the write is rejected stating that a started match takes a concession or a no contest

### Requirement: An owner records a no contest
An owner SHALL record a no contest with a reason of at most 500 characters, private to the organisation, stating whether play took place. It SHALL give no winner and 0 to each, and SHALL keep any play recorded. Without a reason it SHALL be rejected. No replay encounter SHALL be created.

#### Scenario: A no contest after play
- **WHEN** an owner records a no contest with the reason "Venue closed" on a team match in play where play took place
- **THEN** the match is resolved with no winner, 0 each, the reason kept and the lineups' appearances kept

#### Scenario: No reason
- **WHEN** an owner records a no contest without a reason
- **THEN** the write is rejected stating that a reason is required

### Requirement: An administrative outcome cannot record play without a start
For a team match that has not started, a concession or no contest stating that play took place SHALL be rejected, stating that the match must start first. No outcome SHALL fabricate a score.

#### Scenario: Play claimed on an unstarted team match
- **WHEN** an owner records a concession after play on a scheduled team match
- **THEN** the write is rejected and the match is still scheduled

### Requirement: The admin application records exceptional outcomes
The Result panel SHALL ask what happened first, with played, concession, absence and no contest and nothing selected, and SHALL then show only the chosen cause's fields. "Record result" SHALL stay disabled until they are complete. A resolved match SHALL show its cause in words, the reason of a no contest, and "No play recorded" where it applies, on the Match page and the Schedule page.

#### Scenario: A concession on the schedule
- **WHEN** an owner reads the schedule after recording that Sam Reed conceded before play
- **THEN** the match row reads "Sam Reed conceded before play" and shows no score

