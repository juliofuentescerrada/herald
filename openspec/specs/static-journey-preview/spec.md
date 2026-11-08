# static-journey-preview Specification

## Purpose
A disposable static prototype lets reviewers follow the main H1 journeys and states locally with sample data, separate from production functionality.
## Requirements
### Requirement: Main H1 journeys can be reviewed locally
The static prototype SHALL provide navigable examples of organisation context, individual/direct-team configuration, admission/readiness, team roster/lineup, operations/results, correction, finalisation and public following. Each example SHALL identify its review-only status and link to the functional/visual baseline. Example data SHALL remain local and SHALL NOT be presented as production persistence or authentication.

#### Scenario: Review an individual operator journey
- **WHEN** a reviewer follows the individual H1 journey from setup to public standings
- **THEN** the sequence distinguishes publication, registration and competition and introduces no team roster/lineup obligation

#### Scenario: Review team readiness
- **WHEN** a reviewer follows the direct-team journey
- **THEN** the views distinguish an eligible tournament roster, starters and unused reserves and explain why an understrength lineup blocks match start

### Requirement: Outcomes require deliberate input
A new result form SHALL begin without a selected winner and SHALL prevent confirmation before the reviewer chooses an outcome. An existing effective result MAY prefill its current outcome for correction. The preview SHALL distinguish current/effective standings from a stale finalisation review and present a recovery action instead of fabricated success.

#### Scenario: Start a new result
- **WHEN** a reviewer opens a new-result dialog
- **THEN** no winner is selected and confirmation is disabled until an explicit choice

#### Scenario: Review stale finalisation
- **WHEN** competitive facts are newer than the displayed/applied standings or the reviewed revision
- **THEN** the example blocks finalisation and offers refresh and another review

### Requirement: Visual states respect scope and privacy
The prototype SHALL distinguish confirmed constraints from proposed policies and H1 from later participant collaboration. Public examples SHALL expose aliases and public competitive information, without operational contacts or private roster/lineup evidence. Denied-access examples SHALL expose no private tournament payload.

#### Scenario: Open a private tournament as a spectator
- **WHEN** a reviewer selects the private-access denial example
- **THEN** the view explains the access state without displaying the tournament's private details

### Requirement: Visual quality is evidenced
The prototype SHALL use the visual guide's square geometry, tokens and constrained scales. Representative desktop/mobile views, keyboard/focus behaviour and grayscale/blur hierarchy SHALL be checked; the recorded Refactoring UI diagnostic SHALL identify its inspected scope and remaining limits.

#### Scenario: Review a narrow viewport
- **WHEN** a principal journey is shown at the documented mobile width
- **THEN** the navigation, primary content and next action remain usable without page-level horizontal overflow

