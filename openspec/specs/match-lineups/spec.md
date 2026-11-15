# match-lineups Specification

## Purpose
When a competition starts, each pairing of its started schedule becomes a match; an owner records a team match's lineups from the frozen rosters and starts the match, which validates and locks them.
## Requirements
### Requirement: A started competition has matches
When the competition starts, each pairing of the schedule revision it started on SHALL become a match with its own identifier, its round, its two entrants and the state scheduled. A rest SHALL NOT become a match.

#### Scenario: Four players
- **WHEN** a competition with four eligible players starts on a revision with six pairings
- **THEN** it has six scheduled matches over three rounds

#### Scenario: Five players
- **WHEN** a competition with five eligible players starts
- **THEN** it has ten scheduled matches and each player still rests once

### Requirement: An owner records a team match's lineups
For a scheduled team match, an owner SHALL record each side's lineup as exactly the profile's active players per side, distinct, all members of that side's frozen roster. Each recorded lineup SHALL become a new revision with who and when, keeping the earlier ones. A lineup that breaks a rule SHALL be rejected naming it, and nothing SHALL be stored.

#### Scenario: Five of seven
- **WHEN** an owner records five players of a seven-player frozen roster for a profile with five active players
- **THEN** the lineup is recorded and the other two players are reserves for that match

#### Scenario: Four starters
- **WHEN** an owner records four players for a profile with five active players
- **THEN** the lineup is rejected stating that five players are required

#### Scenario: A player outside the frozen roster
- **WHEN** an owner records a lineup including a player who is not on that team's frozen roster
- **THEN** the lineup is rejected naming the player

#### Scenario: A revision before start
- **WHEN** an owner records a second lineup for a side before the match starts
- **THEN** it becomes the current lineup and the first is kept in the history

### Requirement: An owner starts a match
An owner SHALL start a scheduled match of a running competition, whatever its round. Start SHALL record who and when and make the match in play. For a team match, start SHALL require both sides' current lineups to be valid and no player in both, and SHALL lock them; a missing or invalid lineup SHALL block start naming the side and the problem, and no player SHALL be substituted. Repeating a start SHALL return the started match; a stale revision SHALL be rejected with the current match.

#### Scenario: A valid team start
- **WHEN** an owner starts a team match whose two lineups have five eligible players each
- **THEN** the match is in play and both lineups are locked with the start

#### Scenario: A side without a lineup
- **WHEN** an owner starts a team match where one side has no lineup
- **THEN** the start is rejected naming that side and the match is still scheduled

#### Scenario: A later round first
- **WHEN** an owner starts a round 3 match while round 1 has scheduled matches
- **THEN** the match is in play

#### Scenario: A lineup after start
- **WHEN** an owner records a lineup for a match in play
- **THEN** the write is rejected and the locked lineup is unchanged

### Requirement: A lock alone is not participation
A locked lineup SHALL record the intended starters only. Starting a match SHALL credit no appearance to any player.

#### Scenario: Started, not played
- **WHEN** a team match has started and nothing else is recorded
- **THEN** no player of either lineup has an appearance

### Requirement: Competition knows the frozen rosters and the active count
Competition SHALL keep each team entry's frozen roster as Registration reports it and the profile's active players per side as Tournaments reports it at start. While a team's frozen roster is unknown, its matches SHALL report that they are waiting for it and SHALL reject lineups.

#### Scenario: Rosters not yet reported
- **WHEN** an owner opens a team match before Competition learned the frozen rosters
- **THEN** the page states it is waiting for the frozen rosters and lineups cannot be saved

### Requirement: The admin application shows matches and their lineups
The Schedule page of a running competition SHALL show each match's state and link to its Match page. The Match page SHALL show the round and both entrants and, for a team match, a Lineups panel per side with the frozen roster to select from, the selected count against the required count, "Save lineup" and the lineup history last. "Start match" SHALL be the page's primary action, disabled with the first blocker as its description; for a team match it SHALL ask for confirmation stating that it locks both lineups.

#### Scenario: Starting from the Match page
- **WHEN** an owner confirms "Start match" on a team match with two valid lineups
- **THEN** the page shows "In play" beside the title and both lineups as locked with who and when

