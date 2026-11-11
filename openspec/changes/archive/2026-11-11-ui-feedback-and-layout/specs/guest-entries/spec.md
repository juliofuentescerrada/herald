## MODIFIED Requirements

### Requirement: The admin application shows and manages entries
Each published tournament SHALL have an entries page, reachable from the tournament page and from its row in the list. The page SHALL show the tournament's title, its registration label, the admitted count against the capacity in its unit ("3 of 8 individual entries", "3 of 4 teams") and what waits for the owner ("2 pending your decision" with manual admission, "2 waiting for a slot" with automatic admission). It SHALL show the admitted entries and the waiting entries, in order, each with its reason in words ("Capacity full", "Admission pending"), at full weight, and the cancelled entries after them as a compact group, collapsed by default with its count and omitted when there are none. While registration is open the page SHALL offer to add a player or a team, according to the entry kind, in a drawer, by choosing an existing guest of the organisation or creating one; a possible duplicate SHALL list the matching guests, offer to enter one of them and offer to create a new guest anyway. When adding is not possible the page SHALL say why (registration not open, closed, or a reported mismatch). Each waiting entry SHALL offer "Admit", unavailable with its reason when no slot is free; admitting out of order SHALL ask for the reason in a dialog. Each active entry SHALL offer "Cancel entry", which SHALL ask for confirmation in a dialog and say whether a waiting entry will be admitted. A completed addition, admission or cancellation SHALL be announced as a toast. The page SHALL have reviewed empty, loading and failed states; a write in progress SHALL not be repeatable; a failed write SHALL say so where it was started, change nothing and offer a retry; a conflict SHALL say the entry changed elsewhere and offer to reload. The tournament page SHALL link to the entries page with the counts, and a draft SHALL have no entries page.

#### Scenario: An owner enters players until the field is full
- **WHEN** an owner adds three players to an open individual tournament with automatic admission and capacity 2
- **THEN** the page shows "2 of 2 individual entries", "1 waiting for a slot", two admitted players and one waiting with "Capacity full"

#### Scenario: An owner adds a possible duplicate
- **WHEN** an owner adds a new player named like an existing guest player
- **THEN** the drawer lists the existing guest, offers to enter it, and offers "Create a new player anyway"

#### Scenario: Registration is not open
- **WHEN** an owner opens the entries page of a published tournament whose registration is not open
- **THEN** adding is unavailable and the page says registration must be open to add entries

#### Scenario: An owner cancels an admitted entry with someone waiting
- **WHEN** an owner chooses "Cancel entry" on an admitted entry of an open tournament with automatic admission and an entry waiting with "Capacity full"
- **THEN** the confirmation dialog names the waiting entry that will be admitted, and after confirming a toast says the entry was cancelled and the page shows the waiting one admitted

#### Scenario: The page fails to load
- **WHEN** the entries request fails
- **THEN** the page explains the failure and offers a retry, without showing stale or partial entries

#### Scenario: Pending decisions under manual admission
- **WHEN** an owner opens the entries of a tournament with manual admission and two entries waiting with "Admission pending"
- **THEN** the summary says "2 pending your decision"

#### Scenario: A failed addition keeps the drawer open
- **WHEN** the request that adds a new player fails
- **THEN** the drawer stays open with the typed name, says nothing was added and offers a retry
