# round-operations Specification

## Purpose
Operating a running competition: each round's state derived from its matches, the operations summary and what needs attention, an entrant's withdrawal or disqualification with its matches resolved in the same write, and a frozen-roster player's withdrawal or sanction.
## Requirements
### Requirement: Rounds report their state
A round SHALL be not started until one of its matches starts or is resolved, running from then, and completed when every match in it is resolved, whatever the causes. Rests SHALL need no resolution. A later round MAY run or complete before an earlier one.

#### Scenario: A round resolved administratively
- **WHEN** every match of round 2 is resolved as an absence or a no contest
- **THEN** round 2 is completed

#### Scenario: One match left
- **WHEN** round 1 has one match in play and the others resolved
- **THEN** round 1 is running

### Requirement: The owner sees what needs attention
For a running competition the owner SHALL read the number of matches scheduled, in play and resolved, each round's state, and each team match whose current lineup includes an unavailable player, naming the side and the player.

#### Scenario: A sanctioned starter
- **WHEN** a player in a scheduled match's current lineup is sanctioned
- **THEN** the operations summary lists that match with the team and the player

### Requirement: The owner withdraws or disqualifies an entrant
An owner SHALL withdraw or disqualify an active entrant of a running competition with a reason of at most 500 characters, private to the organisation; without one it SHALL be rejected. The entrant's played results SHALL stay. In the same operation, each of its scheduled matches against an active entrant SHALL be resolved as its single absence, each against a departed entrant as a double absence, and its match in play as its concession after play. A departure SHALL NOT be undone.

#### Scenario: A withdrawal with matches left
- **WHEN** an owner withdraws Sam Reed, who has played round 1 and has two scheduled matches
- **THEN** the round 1 result stays and both scheduled matches are resolved as Sam Reed's absence, each opponent winning

#### Scenario: A disqualification
- **WHEN** an owner disqualifies a team with the reason "Fielded an ineligible player"
- **THEN** its previous results stay, its scheduled matches are resolved as its absence and the reason is kept privately

#### Scenario: Withdrawal in play
- **WHEN** an owner withdraws an entrant whose match is in play
- **THEN** that match is resolved as the entrant's concession after play, keeping the locked lineups' appearances

#### Scenario: No reason
- **WHEN** an owner withdraws an entrant without a reason
- **THEN** the write is rejected and the entrant is still active

### Requirement: Two departures give a double absence in either order
When both entrants of an unplayed match depart, the match SHALL end as a double absence with 0 each, whichever departed first. A single absence set by the first departure SHALL be revised once to a double absence, keeping its predecessor. A played result SHALL never be revised.

#### Scenario: A then B
- **WHEN** Sam Reed withdraws, which resolves Sam Reed against Jamie Brook as Sam Reed's absence, and Jamie Brook then withdraws
- **THEN** that match is a double absence with 0 each and its earlier resolution is kept as its predecessor

#### Scenario: B then A
- **WHEN** Jamie Brook withdraws first and Sam Reed second
- **THEN** the match ends as the same double absence with 0 each

#### Scenario: A played match
- **WHEN** both entrants of a match played in round 1 later withdraw
- **THEN** the round 1 result is unchanged

### Requirement: No active entrant
When the last active entrant departs, every remaining match SHALL be resolved by the departure rules and the competition SHALL stay running for finalisation.

#### Scenario: All four withdraw
- **WHEN** the four entrants of a running league withdraw one after another
- **THEN** every match is resolved, played results stay and the competition is still running

### Requirement: The owner withdraws or sanctions a player
On a team's frozen roster, an owner SHALL record a player's withdrawal from the tournament, which is final, or a sanction with a required reason, which lasts until the owner lifts it. The player SHALL stay on the frozen roster with their appearances, and SHALL be unavailable for lineups while withdrawn or sanctioned. No player SHALL be added to replace them, and the team SHALL NOT be withdrawn automatically.

#### Scenario: A sanction lifted
- **WHEN** an owner sanctions a player and later lifts the sanction
- **THEN** the player is unavailable in between and available again after, with both actions kept

#### Scenario: Too few eligible players
- **WHEN** a five-a-side team has seven frozen players and three are withdrawn
- **THEN** its matches cannot start and wait for the owner's explicit outcome, and the team is still active

### Requirement: The admin application operates the competition
The Schedule page of a running competition SHALL open with the operations summary, then the rounds, then an Entrants panel with each entrant's status and, for active entrants, "Withdraw" and "Disqualify", which ask for confirmation with a required reason and state how many matches will be resolved. A team's frozen roster SHALL show each player's availability with "Withdraw player", "Sanction" and "Lift sanction".

#### Scenario: Confirming a withdrawal
- **WHEN** an owner chooses "Withdraw" for an entrant with two scheduled matches
- **THEN** the confirmation states that two matches will be resolved as absences and requires a reason

