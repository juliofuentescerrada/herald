## ADDED Requirements

### Requirement: Tournament navigation reflects available work
The administration interface SHALL provide route links for Configuration, Entries and Schedule on existing published tournament sections, and direct Schedule access on published list records. Match detail SHALL retain Schedule context. Drafts SHALL retain configuration and publication-review navigation without exposing unavailable operations.

#### Scenario: Owner moves from a running list record to its schedule
- **WHEN** the owner chooses View schedule on a published running tournament
- **THEN** the corresponding schedule opens directly with the tournament identity, separate lifecycle labels and current section apparent

### Requirement: Lifecycle and field affordances reflect authoritative state
The interface SHALL retain separate publication, registration and competition facts with consistent semantic treatment. Running SHALL use information emphasis; Preparing, publication and registration SHALL remain neutral in the shared lifecycle mapping. Start-fixed configuration SHALL be presented read-only with its reason while descriptive editable fields remain editable.

#### Scenario: Owner inspects a running tournament
- **WHEN** the owner visits its list record, configuration, entries, schedule or match
- **THEN** Running has consistent textual and semantic emphasis, immutable settings do not invite edits, and copy does not assert that no matches have started

### Requirement: A schedule record groups its meaning and destination
Each started-competition match record SHALL group pairing identity, current match state, effective outcome when present and an explicitly labelled match destination. Entrant names SHALL NOT appear to navigate to entrant profiles when they navigate to the match.

#### Scenario: Owner scans resolved and unresolved matches
- **WHEN** the schedule contains a resolved win, a draw and an unresolved match
- **THEN** each outcome is visibly associated with its pairing, every match state remains explicit, and View match identifies the destination

### Requirement: Result work follows match phase
New-result entry SHALL use native single-choice semantics, no preselected outcome and explicit submission. Selected choices SHALL have visible non-colour-only feedback and accessible labelled targets. Started team matches SHALL prioritise result work before read-only lineup evidence; scheduled team matches SHALL retain lineup preparation before start. Resolved matches SHALL show a read-only effective result.

#### Scenario: Owner records a team result after start
- **WHEN** valid saved lineups are locked by match start
- **THEN** result entry becomes the next operational group, starts unselected, and only a successful explicit submission replaces it with the effective result also reflected in the schedule

### Requirement: Unsaved lineup work has deliberate exit
Navigating away with locally modified lineup selections SHALL offer a choice to stay or discard without submitting. Outcome selection alone SHALL NOT require an additional exit confirmation. Existing revision protection SHALL remain authoritative.

#### Scenario: Owner leaves an edited lineup
- **WHEN** an unsaved lineup differs from its saved state and the owner follows a route away
- **THEN** the owner can stay with the selection intact or explicitly discard it, and no lineup write occurs from navigation

### Requirement: Recovery remains local and preserves valid input
Guest searches SHALL offer retry with the unchanged query after failure. Load recovery SHALL retry all failed dependencies required by the page. Errors SHALL stay with their cause, preserve valid unsaved input where applicable and distinguish failure from no data. Existing access replacement and no-toast roster-update behaviour SHALL remain intact.

#### Scenario: A guest search fails for a valid name
- **WHEN** the search request fails and the owner retries without editing the name
- **THEN** the same query is executed again from the open surface and its result replaces the failed state without creating a guest

### Requirement: Operational content reflows within the shared foundations
Affected screens SHALL preserve full-width stacked admin composition and the existing below-700-px breakpoint while allowing content and action groups to wrap safely. Read-only history SHALL follow current work, remain collapsed by default and be omitted when empty, with visible counts where available.

#### Scenario: Owner uses the desktop breakpoint with the workspace rail
- **WHEN** the populated tournament list or admitted/waiting entries is viewed at 700 CSS px
- **THEN** all content and actions remain reachable without page-level horizontal overflow; the same holds at 320, 390, 699 and 1440 CSS px with the reviewed content

#### Scenario: Owner returns pairings to a draft
- **WHEN** schedule withdrawal succeeds
- **THEN** draft actions and pairings remain visible before collapsed publication history, whose count and retained revision evidence remain available
