## ADDED Requirements

### Requirement: Standings publish their table
Standings SHALL publish each tournament's table — positions, entrants, counts, points, departure flags, status and final revision — as a revisioned snapshot after every change, through the outbox.

#### Scenario: After a result
- **WHEN** Standings applies results revision 9
- **THEN** it publishes the table at revision 9
