## ADDED Requirements

### Requirement: An owner creates guests in the organisation
An organisation's owner SHALL be able to create a guest player or a guest team in that organisation. A guest SHALL have a stable identifier supplied by the client, its kind (player or team) and a name that is required after trimming and at most 80 characters; the name is the alias shown for the guest. Creation SHALL record the acting person and time. A repeat with the same identifier and content SHALL return the original guest; the same identifier with different content SHALL be rejected. A guest SHALL belong to one organisation and SHALL NOT be visible to or usable by another. A guest SHALL carry no contact details and SHALL confer no sign-in or other right.

#### Scenario: A guest player is created
- **WHEN** an owner creates a guest player named "Robin Vale"
- **THEN** the guest exists in the organisation with that name and kind, and the acting person and time are recorded

#### Scenario: The name is missing or too long
- **WHEN** an owner creates a guest with a blank name or a name of 81 characters
- **THEN** the creation is rejected naming the name and no guest is created

#### Scenario: Another organisation's guests
- **WHEN** an owner searches guests or enters a guest by its identifier through their own organisation's address, and the guest belongs to a different organisation
- **THEN** the guest is not found and nothing of it is returned

### Requirement: Possible duplicate guests are flagged, never merged
Creating a guest whose name matches the name of an existing guest of the same kind in the organisation, ignoring case, accents and repeated or surrounding spaces, SHALL be rejected as a possible duplicate that lists the matching guests, unless the request confirms that a new guest is intended. Guests SHALL never be merged or linked automatically, and names of another organisation's guests SHALL never be compared or disclosed.

#### Scenario: A possible duplicate
- **WHEN** an owner creates a guest player "robin  vale" and the organisation has a guest player "Robin Vale"
- **THEN** the creation is rejected as a possible duplicate listing "Robin Vale", and no guest is created

#### Scenario: A new guest with the same name is confirmed
- **WHEN** the owner repeats the creation confirming a new guest is intended
- **THEN** a second guest player "robin  vale" exists, separate from the first

#### Scenario: Same name, different kind
- **WHEN** an owner creates a guest team "Robin Vale" and the organisation only has a guest player of that name
- **THEN** the team is created without a warning

### Requirement: An owner enters a guest while registration is open
An owner SHALL be able to enter a guest of the organisation in a tournament of the organisation whose registration is open. The guest's kind SHALL match the tournament's entry kind: a player for an individual tournament, a team for a team tournament. A guest SHALL have at most one active (waiting or admitted) entry per tournament; entering it again while it is active SHALL be rejected naming the existing entry. A guest whose entry was cancelled MAY be entered again as a new entry, which keeps no earlier priority. The client SHALL supply the entry's identifier, and a repeat with the same identifier and content SHALL return the original entry instead of creating another. Entering SHALL record the acting person and time and SHALL be rejected while registration is not open or closed.

#### Scenario: A player is entered
- **WHEN** an owner enters a guest player in an individual tournament whose registration is open
- **THEN** the entry exists with its admission state and the acting person and time

#### Scenario: Registration is closed
- **WHEN** an owner enters a guest in a tournament whose registration is closed
- **THEN** the entry is rejected and the field is unchanged

#### Scenario: The kind does not match
- **WHEN** an owner enters a guest player in a team tournament
- **THEN** the entry is rejected and the field is unchanged

#### Scenario: The guest is already entered
- **WHEN** an owner enters a guest that has a waiting or admitted entry in the tournament
- **THEN** the entry is rejected naming the existing entry

#### Scenario: The response to an entry is lost
- **WHEN** the client repeats an entry with the same identifier and content
- **THEN** it receives the original entry and the field has one entry for the guest

### Requirement: Admission follows the tournament's policy and capacity
Each admitted entry SHALL take one slot of the tournament's capacity, whatever the number of people a team has; waiting and cancelled entries SHALL take none. With automatic admission, a new entry SHALL be admitted while the admitted entries are fewer than the capacity, and SHALL otherwise wait with the reason "capacity full". With manual admission, a new entry SHALL wait with the reason "admission pending". Two entries SHALL NOT both take the last slot. Entries waiting with "capacity full" SHALL be ordered by the time they started waiting, with a stable order for equal times.

#### Scenario: The field fills up
- **WHEN** a tournament with automatic admission and capacity 2 has two admitted entries and an owner enters a third guest
- **THEN** the third entry waits with the reason "capacity full" and two entries are admitted

#### Scenario: Manual admission
- **WHEN** an owner enters a guest in a tournament with manual admission and free slots
- **THEN** the entry waits with the reason "admission pending"

#### Scenario: Two entries race for the last slot
- **WHEN** two entries are made at the same time in a tournament with automatic admission and one free slot
- **THEN** exactly one is admitted and the other waits with "capacity full"

#### Scenario: A team takes one slot
- **WHEN** a team tournament with capacity 4 has four admitted teams
- **THEN** the admitted count is 4 of 4, whatever the size of the teams

### Requirement: An owner admits a waiting entry
An owner SHALL be able to admit a waiting entry while a slot is free, with registration open or closed. Admitting when no slot is free SHALL be rejected. Admitting an entry waiting with "capacity full" while an earlier entry waits with "capacity full" SHALL require a reason, recorded with the admission and never shown publicly. Admitting SHALL record the acting person and time.

#### Scenario: An owner admits a pending entry
- **WHEN** an owner admits an entry waiting with "admission pending" and a slot is free
- **THEN** the entry is admitted and the acting person and time are recorded

#### Scenario: No slot is free
- **WHEN** an owner admits a waiting entry and the admitted entries equal the capacity
- **THEN** the admission is rejected and the entry still waits

#### Scenario: An owner skips the queue
- **WHEN** an owner admits the second entry waiting with "capacity full" without a reason
- **THEN** the admission is rejected asking for a reason; with a reason it is admitted and the reason is recorded

### Requirement: An owner cancels an entry and the freed slot follows the policy
An owner SHALL be able to cancel a waiting or admitted entry before competition starts. Cancelling SHALL record the acting person and time and SHALL be final for that entry. Cancelling an admitted entry SHALL free its slot. With automatic admission and registration open, a free slot SHALL admit the first entry waiting with "capacity full"; with registration closed, or with manual admission, nothing SHALL be admitted automatically. Raising the capacity or reopening registration SHALL fill free slots the same way.

#### Scenario: A cancellation promotes exactly one entry
- **WHEN** a tournament with automatic admission, open registration, capacity 16, 16 admitted entries and two entries waiting with "capacity full" has one admitted entry cancelled
- **THEN** the first waiting entry is admitted, the second still waits and 16 entries are admitted

#### Scenario: A cancellation after closure
- **WHEN** an admitted entry is cancelled while registration is closed
- **THEN** its slot is free and no waiting entry is admitted

#### Scenario: Capacity is raised
- **WHEN** an owner raises the capacity from 2 to 3 in a tournament with automatic admission, open registration and two entries waiting with "capacity full"
- **THEN** the first waiting entry is admitted and the second still waits

#### Scenario: A cancelled entry is cancelled again
- **WHEN** the client repeats the cancellation of a cancelled entry
- **THEN** it receives the cancelled entry and nothing else changes

### Requirement: Entry writes state the revision they were based on
Each entry SHALL have a revision that starts at 1 and increases with each change. Admitting and cancelling SHALL state the entry's revision they were based on. A write based on an older revision SHALL be rejected as a conflict that reports the current entry and changes nothing, except that a write whose result is already in effect SHALL return the current entry as a repeat. A tournament or entry of another organisation SHALL receive the same generic not-found response as one that does not exist.

#### Scenario: The entry changed before the action
- **WHEN** an owner admits an entry from a page showing revision 1 after the entry was cancelled in another tab
- **THEN** the admission is rejected as a conflict and the entry is still cancelled

#### Scenario: Another organisation's owner changes an entry
- **WHEN** a person who owns a different organisation admits or cancels an entry through their own organisation's address
- **THEN** the response is the generic not-found problem and the entry is unchanged

### Requirement: Facts changed elsewhere are shown, not silently repaired
When the tournament's capacity becomes lower than its admitted entries, or its entry kind differs from that of its active entries, because two changes crossed, the field SHALL report the mismatch, no entry SHALL be removed or converted automatically, and entering and admitting SHALL be rejected until the owner resolves it by cancelling entries or changing the tournament.

#### Scenario: Admitted entries exceed the capacity
- **WHEN** a tournament's field has 7 admitted entries and the capacity it knows is 6
- **THEN** the field reports one entry over capacity, all 7 stay admitted, and admitting is rejected until an admitted entry is cancelled

### Requirement: The admin application shows and manages entries
Each published tournament SHALL have an entries page, reachable from the tournament page and from its row in the list. The page SHALL show the tournament's title, its registration label, the admitted count against the capacity in its unit ("3 of 8 individual entries", "3 of 4 teams"), and the entries in three groups: admitted; waiting, in order, each with its reason in words ("Capacity full", "Admission pending"); cancelled. While registration is open the page SHALL offer to add a player or a team, according to the entry kind, by choosing an existing guest of the organisation or creating one; a possible duplicate SHALL list the matching guests, offer to enter one of them and offer to create a new guest anyway. When adding is not possible the page SHALL say why (registration not open, closed, or a reported mismatch). Each waiting entry SHALL offer "Admit", unavailable with its reason when no slot is free; admitting out of order SHALL ask for the reason. Each active entry SHALL offer "Cancel entry", which SHALL ask for confirmation and say whether a waiting entry will be admitted. The page SHALL have reviewed empty, loading and failed states; a write in progress SHALL not be repeatable; a failed write SHALL say so, change nothing and offer a retry; a conflict SHALL say the entry changed elsewhere and offer to reload. The tournament page SHALL link to the entries page with the counts, and a draft SHALL have no entries page.

#### Scenario: An owner enters players until the field is full
- **WHEN** an owner adds three players to an open individual tournament with automatic admission and capacity 2
- **THEN** the page shows "2 of 2 individual entries", two admitted players and one waiting with "Capacity full"

#### Scenario: An owner adds a possible duplicate
- **WHEN** an owner adds a new player named like an existing guest player
- **THEN** the page lists the existing guest, offers to enter it, and offers "Create a new player anyway"

#### Scenario: Registration is not open
- **WHEN** an owner opens the entries page of a published tournament whose registration is not open
- **THEN** adding is unavailable and the page says registration must be open to add entries

#### Scenario: An owner cancels an admitted entry with someone waiting
- **WHEN** an owner chooses "Cancel entry" on an admitted entry of an open tournament with automatic admission and an entry waiting with "Capacity full"
- **THEN** the confirmation names the waiting entry that will be admitted, and after confirming the page shows it admitted

#### Scenario: The page fails to load
- **WHEN** the entries request fails
- **THEN** the page explains the failure and offers a retry, without showing stale or partial entries
