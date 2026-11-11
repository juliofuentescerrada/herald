# team-rosters Specification

## Purpose
An organisation's owner builds the roster of each team entry from the organisation's guest players, within the tournament's minimum and maximum roster sizes; a player is on one team per tournament among active entries, readiness is derived from the bounds, and every addition and removal is kept in the roster's history.

## Requirements

### Requirement: An owner builds the roster of a team entry
The organisation's owner SHALL add guest players of the organisation to the tournament roster of an active (waiting or admitted) team entry, and remove members from it, while the tournament's competition has not started (always, in this slice). Registration's state need not be open. A member SHALL be a guest player of the same organisation; a guest team, a guest of another organisation or an unknown guest SHALL be rejected. A cancelled entry's roster SHALL not change. An individual tournament SHALL have no rosters: its entries SHALL neither offer nor accept roster writes. Adding a player already in this roster, or removing one not in it, SHALL return the current roster as a repeat.

#### Scenario: An owner adds a player to a waiting team
- **WHEN** an owner adds the guest player "Ana Ruiz" to a team entry waiting with "Admission pending"
- **THEN** the team's roster has Ana Ruiz as its one member

#### Scenario: A guest team cannot be a member
- **WHEN** an owner adds a guest team to a team's roster
- **THEN** the write is rejected and the roster is unchanged

#### Scenario: A cancelled team's roster is fixed
- **WHEN** an owner adds a player to the roster of a cancelled team entry
- **THEN** the write is rejected and the roster is unchanged

#### Scenario: Rosters work after registration closes
- **WHEN** an owner removes a member from an admitted team after registration has closed
- **THEN** the member is removed

#### Scenario: Individual entries have no roster
- **WHEN** a client adds a player to an entry of an individual tournament
- **THEN** the write is rejected and no roster exists

### Requirement: A roster respects the tournament's bounds
A team roster SHALL accept members up to the tournament's maximum roster size; adding a member to a full roster SHALL be rejected. A roster below the minimum SHALL be allowed and SHALL be reported as incomplete. Each team entry SHALL report its roster readiness: "incomplete" below the minimum, "complete" within the bounds, and "above maximum" when the bounds were lowered after members were added. Changing the tournament's bounds SHALL never add, remove or reorder members.

#### Scenario: The roster is full
- **WHEN** an owner adds a sixth player to a team with five members in a tournament whose maximum roster size is 5
- **THEN** the write is rejected as a full roster and the roster keeps five members

#### Scenario: An incomplete roster is allowed
- **WHEN** an owner adds two players to a team in a tournament whose minimum roster size is 3
- **THEN** both are members and the team's roster is reported as incomplete, 2 of at least 3

#### Scenario: The maximum is lowered
- **WHEN** the tournament's maximum roster size changes from 5 to 4 while a team has five members
- **THEN** the team keeps its five members, its roster is reported as above maximum, and adding is rejected until a member is removed

### Requirement: A player belongs to one team per tournament
A guest player SHALL be a member of at most one active team entry of a tournament; adding a member of another active team's roster SHALL be rejected with the name of that team. A cancelled entry's members SHALL not count. A player MAY be on rosters of different tournaments. When two members of different active teams of the tournament are different guests with the same normalised name, both rosters SHALL flag a possible duplicate; nothing SHALL be merged or blocked.

#### Scenario: A player already plays for another team
- **WHEN** an owner adds "Ana Ruiz" to Team B while she is a member of the active Team A in the same tournament
- **THEN** the write is rejected, saying she is on Team A's roster, and neither roster changes

#### Scenario: A cancelled team releases its players
- **WHEN** Team A is cancelled and an owner adds its member "Ana Ruiz" to Team B
- **THEN** Ana Ruiz is a member of Team B and Team A's roster still lists her as evidence

#### Scenario: Two guests share a name
- **WHEN** Team A has the guest "Ana Ruiz" and an owner adds a different guest named "ana  ruíz" to Team B
- **THEN** both are members and both rosters flag a possible duplicate

### Requirement: A roster keeps its history
Each roster SHALL have a revision that starts at 0 and increases with each addition or removal. Roster writes SHALL state the roster revision they were based on; a write based on an older revision SHALL be rejected as a conflict that reports the current roster and changes nothing, unless its result is already in effect, which SHALL return the current roster as a repeat. Every addition and removal SHALL be recorded with the player, who, when and the resulting revision, and a removed member SHALL remain in the history. A tournament, entry or guest of another organisation SHALL receive the same generic not-found response as one that does not exist.

#### Scenario: The roster changed in another tab
- **WHEN** an owner adds a player from a page showing roster revision 2 after another tab removed a member
- **THEN** the write is rejected as a conflict and the roster shows the removal

#### Scenario: A removal is kept in the history
- **WHEN** an owner adds "Ana Ruiz" to a team and removes her later
- **THEN** the roster has no member, its revision is 2, and its history records her addition and removal with who and when

#### Scenario: Another organisation's owner changes a roster
- **WHEN** a person who owns a different organisation adds a player to a team through their own organisation's address
- **THEN** the response is the generic not-found problem and the roster is unchanged

### Requirement: Registration knows the tournament's roster bounds
The entry terms Tournaments publishes SHALL include the minimum and maximum roster size of a team tournament, and none for an individual tournament, as optional members of the existing version 1 contract. Registration SHALL keep them with the other terms, under the same rule that the highest revision wins. A team tournament whose terms carry no bounds SHALL accept no roster writes until its terms with bounds arrive, and its rosters SHALL be reported as awaiting the tournament's terms.

#### Scenario: Bounds reach the field
- **WHEN** an owner saves a published team tournament with roster sizes 3 to 5
- **THEN** Registration's field of that tournament knows the bounds 3 to 5

#### Scenario: An older message without bounds
- **WHEN** Registration receives a version 1 terms message without roster sizes for a team tournament
- **THEN** it is accepted, and roster writes are rejected until terms with bounds arrive

### Requirement: The admin application shows and manages rosters
On the entries page of a team tournament, each active team entry SHALL show its roster readiness in words beside its name ("2 of 3–5 players · incomplete", "4 of 3–5 players", "6 of 3–5 players · above maximum") and offer "Roster", which SHALL open a drawer for that team. The drawer SHALL show the team's name, the bounds, the members with when each was added, and any possible-duplicate flag; it SHALL offer to add a player by choosing an existing guest player of the organisation or creating one, with the existing possible-duplicate warning, and to remove each member. A player on another active team SHALL be shown as unavailable with that team's name. Adding SHALL be unavailable with its reason when the roster is full. A cancelled entry SHALL show its roster read-only. The drawer SHALL have reviewed empty, loading and failed states; a write in progress SHALL not be repeatable; a failed write SHALL say so in the drawer, change nothing and offer a retry; a conflict SHALL say the roster changed elsewhere and offer to reload. A completed addition or removal SHALL update the readiness on the page without a toast; individual tournaments SHALL show no roster element.

#### Scenario: An owner completes a roster
- **WHEN** an owner opens "Roster" on a team with two of at least three players and adds a third
- **THEN** the drawer lists three members and the team's row reads "3 of 3–5 players"

#### Scenario: A player on another team
- **WHEN** an owner searches for a player who is on Team A's roster from Team B's drawer
- **THEN** the player is shown as unavailable, "On Team A"

#### Scenario: An individual tournament
- **WHEN** an owner opens the entries page of an individual tournament
- **THEN** no entry shows roster readiness or a "Roster" action

#### Scenario: A failed addition keeps the drawer open
- **WHEN** the request that adds a player to a roster fails
- **THEN** the drawer stays open, says nothing was added and offers a retry
