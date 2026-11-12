## ADDED Requirements

### Requirement: An owner checks in an admitted entry
The organisation's owner SHALL check in an admitted entry, of an individual or a team tournament, while the tournament's competition has not started (always, in this slice), whatever the registration state. An entry's check-in SHALL be pending until confirmed. A waiting or cancelled entry SHALL not be checked in. Checking in an entry already confirmed SHALL return the current entry as a repeat. A team entry's check-in SHALL be the entry's own and SHALL NOT change or depend on its roster.

#### Scenario: An owner checks in an admitted player
- **WHEN** an owner checks in the admitted entry of "Ana Ruiz"
- **THEN** Ana Ruiz's check-in is confirmed, with who and when

#### Scenario: Check-in works whatever the registration state
- **WHEN** an owner checks in an admitted entry after registration has closed
- **THEN** the check-in is confirmed

#### Scenario: A waiting entry cannot check in
- **WHEN** an owner checks in an entry waiting with "Capacity full"
- **THEN** the write is rejected and the entry has no check-in

#### Scenario: A cancelled entry cannot check in
- **WHEN** an owner checks in a cancelled entry
- **THEN** the write is rejected and the entry is unchanged

#### Scenario: A team checks in without a complete roster
- **WHEN** an owner checks in an admitted team whose roster is incomplete
- **THEN** the team's check-in is confirmed and its roster is still reported as incomplete

#### Scenario: A promoted entry starts pending
- **WHEN** a waiting entry is admitted by promotion
- **THEN** its check-in is pending

### Requirement: An owner undoes a check-in
The owner SHALL undo the confirmed check-in of an admitted entry while the competition has not started, returning it to pending. Undoing a pending check-in SHALL return the current entry as a repeat. Undo SHALL need no reason and no confirmation beyond the action itself.

#### Scenario: An owner undoes a check-in made by mistake
- **WHEN** an owner undoes the confirmed check-in of "Leo Martín"
- **THEN** Leo Martín's check-in is pending again

### Requirement: Check-in keeps its history
Each entry's check-in SHALL have a revision that grows with every confirmation and undo, and every confirmation and undo SHALL be recorded with who and when, kept with the change. Check-in writes SHALL state the check-in revision they were based on; a write based on an older revision SHALL be rejected as a conflict returning the current entry, and SHALL change nothing. Admission and cancellation SHALL NOT conflict with a check-in write, nor the reverse. A cancelled entry SHALL keep its check-in and its history.

#### Scenario: Every change is recorded
- **WHEN** an owner checks in an entry, undoes it and checks it in again
- **THEN** the entry's check-in revision is 3 and its history holds the three changes in order, each with who and when

#### Scenario: A stale check-in write is a conflict
- **WHEN** an owner undoes a check-in from a page that read revision 1 after another tab had already undone and checked it in again
- **THEN** the write is rejected as a conflict with the current entry and the check-in stays confirmed

#### Scenario: Cancelling keeps the evidence
- **WHEN** an owner cancels an admitted entry whose check-in is confirmed
- **THEN** the cancelled entry still shows its confirmed check-in and history, and it no longer counts as checked in

### Requirement: The field reports how many admitted entries have checked in
The field SHALL report the number of admitted entries whose check-in is confirmed. Cancelled entries SHALL NOT count. Registration SHALL include this count in the field counts it shares with Tournaments; a field counts message without it SHALL be read as no confirmed check-ins.

#### Scenario: The count follows check-ins and cancellations
- **WHEN** three admitted entries check in and one of them is cancelled
- **THEN** the field reports 2 checked in

#### Scenario: An older field counts message is accepted
- **WHEN** Tournaments receives a field counts message written before the checked-in count existed
- **THEN** it keeps the message's counts with no confirmed check-ins

### Requirement: The admin application shows and manages check-in
The entries page SHALL show, for each admitted entry, its check-in status as a label beside the name ("Checked in" or "Check-in pending"), its last check-in change as row meta with the time in the tournament's time zone, and on the right a "Check in" action when pending or an "Undo check-in" action when confirmed. The action SHALL apply at once, with no dialog, and SHALL report its outcome as a toast; a failure SHALL leave the row as it was and say so. A cancelled entry SHALL show its last check-in status read-only. Waiting entries SHALL show no check-in. The admitted summary SHALL add the tournament's check-in policy and the count, as "Check-in mandatory · 9 of 12 checked in" or "Check-in optional · 9 of 12 checked in". For a team, the check-in label SHALL be separate from its roster readiness. The page SHALL meet the accessibility checks of the existing entries page at desktop and phone width.

#### Scenario: An owner checks in from the entries page
- **WHEN** an owner selects "Check in" on the row of a pending admitted player
- **THEN** the row shows "Checked in" with the time, the action becomes "Undo check-in", the summary count grows by one and a toast confirms it

#### Scenario: A failed check-in leaves the row unchanged
- **WHEN** the check-in request fails
- **THEN** the row still shows "Check-in pending" with its "Check in" action and the page says the check-in was not recorded

#### Scenario: Optional check-in is shown as information
- **WHEN** an owner opens the entries page of a tournament with optional check-in
- **THEN** the summary says "Check-in optional" with the count, and the check-in actions are available as for a mandatory one

#### Scenario: A team row keeps check-in and roster apart
- **WHEN** an owner opens the entries page of a team tournament with an admitted team checked in and an incomplete roster
- **THEN** the row shows "Checked in" and the incomplete roster readiness as separate facts
