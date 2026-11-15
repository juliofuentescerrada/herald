## ADDED Requirements

### Requirement: A started competition keeps its schedule
After the competition starts, withdrawing the published schedule and generating a draft SHALL be rejected stating that the competition has started. If the start was decided on a revision that a crossed withdrawal had already withdrawn, the schedule SHALL report it and SHALL allow publishing the current draft once.

#### Scenario: Withdrawing after start
- **WHEN** an owner withdraws the schedule of a running competition
- **THEN** the write is rejected and the revision is still published
