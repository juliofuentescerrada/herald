## ADDED Requirements

### Requirement: Rosters freeze at start
When the competition starts, each admitted team's current roster revision SHALL become its frozen roster. Adding or removing a member afterwards SHALL be rejected stating that the roster is frozen. The roster dialog SHALL show the frozen revision and when it froze.

#### Scenario: Adding after start
- **WHEN** an owner adds a player to an admitted team's roster after the competition started
- **THEN** the write is rejected and the frozen roster is unchanged
