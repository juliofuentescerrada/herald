## ADDED Requirements

### Requirement: Standings publish their table
Standings SHALL publish each tournament's table — positions, entrants, counts, points, departure flags, each entrant's explanation, status and final revision — as a snapshot after every change, through the outbox. The snapshot SHALL carry the results revision it reflects and a table revision of its own, which a finalisation or a reopening also moves on.

#### Scenario: After a result
- **WHEN** Standings applies results revision 9
- **THEN** it publishes the table reflecting results revision 9, with a higher table revision than any it published before
