## ADDED Requirements

### Requirement: A tournament's cancellation cancels its active entries
When a tournament is cancelled, every waiting or admitted entry SHALL be cancelled with the cause "tournament cancelled", keeping its identity and history, and nothing SHALL be promoted. Later entry, admission, check-in and roster writes SHALL be rejected.

#### Scenario: Entries of a cancelled tournament
- **WHEN** a tournament with three admitted and one waiting entry is cancelled
- **THEN** all four entries are cancelled with the cause "tournament cancelled" and none is admitted
