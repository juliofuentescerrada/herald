# public-tournament-page Specification

## Purpose
A published public or unlisted tournament's page, readable without signing in: its details, published rounds, standings with their explanations and public changes, with aliases only; the same "not available" answer for everything else; and the owner's visibility changes, private at once and public after a preview.
## Requirements
### Requirement: A published public or unlisted tournament has a public page
From publication, a public or unlisted tournament SHALL be readable without signing in at its link: organisation, game or variant, venue, dates with the time zone, participation structure and lifecycle facts as separate labels; from the schedule's publication its published rounds and matches with opponents, rests and resolution causes; from start its standings with provisional or final status, results revision and time, each entrant's explanation, shared positions and departure flags; and the public change log entries.

#### Scenario: Before start
- **WHEN** a visitor opens the link of a published public tournament with registration open
- **THEN** the page shows its details and "Registration open", "Preparing", and no rounds or standings

#### Scenario: Running
- **WHEN** a visitor opens a running unlisted league with three of six matches resolved
- **THEN** the page shows its rounds with causes and provisional standings with the results revision and time

#### Scenario: Cancelled
- **WHEN** a visitor opens a tournament cancelled after start
- **THEN** the page says it was cancelled and when, shows the voided matches and declares no champion

### Requirement: The public page shows aliases only
The public page SHALL show entrant aliases and public results only and SHALL NOT include contacts, private reasons, rosters, lineups, drafts, a withdrawn publication's content or internal identifiers other than the tournament's.

#### Scenario: A withdrawal with a reason
- **WHEN** an entrant withdrew with the reason "Family emergency"
- **THEN** the public page flags the entrant as withdrawn and the reason appears nowhere in the response

#### Scenario: A team tournament
- **WHEN** a visitor opens a running team tournament
- **THEN** the page names the teams and no roster or lineup player

### Requirement: Unavailable tournaments reveal nothing
A draft, a private tournament, a deleted tournament and an unknown link SHALL all give the same "not available" response with status 404 and no content of the tournament.

#### Scenario: A private tournament
- **WHEN** a visitor opens the link of a private tournament
- **THEN** the response is the same as for an unknown link

### Requirement: Visibility changes take effect at once
An owner SHALL change visibility in any state after publication. After a change to private commits, anonymous reads SHALL be refused; public responses SHALL NOT be stored by shared caches. A change from private to public or unlisted SHALL be confirmed after a preview of the content that becomes public, including the entrant aliases.

#### Scenario: Public to private
- **WHEN** an owner makes a public tournament private and a visitor then reloads its page
- **THEN** the visitor gets "not available"

#### Scenario: Private to public
- **WHEN** an owner chooses to make a private tournament public
- **THEN** they see the title, dates and entrant aliases that will be public before confirming

