## ADDED Requirements

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
