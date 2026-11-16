## ADDED Requirements

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
