## ADDED Requirements

### Requirement: Unavailable players cannot play
A player withdrawn from the tournament or under a sanction SHALL NOT be recorded in a lineup. Starting a scheduled match whose current lineup includes such a player SHALL be rejected naming the player; the owner SHALL revise the lineup from the other eligible frozen-roster members. A locked lineup SHALL NOT change.

#### Scenario: A sanctioned starter
- **WHEN** an owner starts a match whose current lineup includes a sanctioned player
- **THEN** the start is rejected naming the player, and a revised lineup without them can start

#### Scenario: A sanction after the lock
- **WHEN** a player of a locked lineup is sanctioned while the match is in play
- **THEN** the locked lineup is unchanged
