## ADDED Requirements

### Requirement: A tournament's cancellation ends its schedule
When a tournament is cancelled before start, its current publication SHALL be withdrawn with the reason "tournament cancelled" and kept in history, and a draft SHALL be discarded. When it is cancelled after start, every unresolved match SHALL be voided by the cancellation with no points.

#### Scenario: A published schedule before start
- **WHEN** a tournament with a published schedule is cancelled before start
- **THEN** the publication is withdrawn and listed in history with the reason "tournament cancelled"
