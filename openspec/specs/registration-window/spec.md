# registration-window Specification

## Purpose
An organisation's owner opens, closes and reopens the registration of a published tournament by hand; the announced dates are an announcement, not a trigger.

## Requirements
### Requirement: An owner opens the registration of a published tournament
An organisation's owner SHALL be able to open the registration of a tournament of that organisation that is published and whose registration is not open. Opening SHALL require the registration opening and registration closure dates to be present, and SHALL be rejected naming each missing one. Opening SHALL be an explicit action: the announced dates SHALL NOT open registration by themselves, and the current time SHALL NOT prevent the action. Opening SHALL make registration open, record the acting person and time, and change nothing else: publication, competition and configuration stay as they were and no entry is created. A draft's registration SHALL NOT be opened.

#### Scenario: Registration is opened
- **WHEN** an owner opens the registration of a published tournament that has both registration dates
- **THEN** its registration is open, it is still published with competition in preparation, its configuration is unchanged, and the acting person and time are recorded

#### Scenario: The registration dates are missing
- **WHEN** an owner opens the registration of a published tournament with no registration closure
- **THEN** the action is rejected naming the registration closure and registration is still not open

#### Scenario: The tournament is a draft
- **WHEN** an owner opens the registration of a draft
- **THEN** the action is rejected and the draft's registration is still not open

#### Scenario: The announced opening has not arrived
- **WHEN** an owner opens registration before the announced opening date
- **THEN** registration is open

#### Scenario: The opening date passes
- **WHEN** the announced opening date passes and nobody has opened registration
- **THEN** registration is still not open

### Requirement: An owner closes and reopens registration
An owner SHALL be able to close an open registration and reopen a closed one. Closing SHALL make registration closed, record the acting person and time, and change nothing else. Reopening SHALL have the same preconditions and effects as opening. The announced closure date SHALL NOT close registration by itself. Closing a registration that was never opened SHALL be rejected.

#### Scenario: Registration is closed
- **WHEN** an owner closes an open registration
- **THEN** registration is closed, the tournament is still published with competition in preparation, and the acting person and time are recorded

#### Scenario: Registration is reopened
- **WHEN** an owner reopens a closed registration that has both registration dates
- **THEN** registration is open

#### Scenario: A closed registration lost a date
- **WHEN** an owner reopens a closed registration after its registration opening was removed
- **THEN** the action is rejected naming the registration opening and registration is still closed

#### Scenario: Registration was never opened
- **WHEN** an owner closes the registration of a tournament whose registration is not open
- **THEN** the action is rejected and registration is still not open

#### Scenario: The closure date passes
- **WHEN** the announced closure date passes while registration is open
- **THEN** registration is still open

### Requirement: Registration changes state the revision they were based on
Opening and closing SHALL state the revision they were based on and SHALL increase the tournament's revision by one when they take effect. A change based on an older revision SHALL be rejected as a conflict that reports the current revision and changes nothing, except that a change whose result is already in effect SHALL return the current tournament as a repeat without a second effect. A tournament of another organisation SHALL receive the same generic not-found response as one that does not exist.

#### Scenario: The response to an opening is lost
- **WHEN** the client repeats the opening of a registration that is already open
- **THEN** it receives the tournament with registration open, and the revision and the recorded person and time are unchanged

#### Scenario: The tournament changed before the action
- **WHEN** an owner opens registration from a page showing revision 3 after the configuration reached revision 4
- **THEN** the action is rejected as a conflict reporting revision 4 and registration is still not open

#### Scenario: Another organisation's owner changes the window
- **WHEN** a person who owns a different organisation opens or closes the registration through their own organisation's address
- **THEN** the response is the generic not-found problem and the tournament is unchanged

### Requirement: The admin application shows and changes the registration window
The published tournament page SHALL show a registration area with the registration state in words, the announced opening and closure written as "14 November 2026, 10:00" with the reference time zone, when registration is open or closed the time it was last opened or closed, and exactly one action for the state: "Open registration" when not open, "Close registration" when open, "Reopen registration" when closed. The area SHALL state that the dates are an announcement and that registration changes only with this action. When opening or reopening is not possible the action SHALL be unavailable with its reason in words: the missing dates, each moving focus to its field, or unsaved configuration changes. A draft SHALL NOT show the area. While the change is in progress the action SHALL not be repeatable; a failed change SHALL say so, leave the state as it was and offer a retry; a conflict SHALL say the tournament changed elsewhere, change nothing and offer to reload the latest version. The tournament page and the list SHALL show the registration label "Registration not open", "Registration open" or "Registration closed", separate from the publication and competition labels.

#### Scenario: An owner opens registration from the tournament page
- **WHEN** an owner chooses "Open registration" on a published tournament with both registration dates
- **THEN** the page says registration is open, shows the label "Registration open" and offers "Close registration"

#### Scenario: The dates are missing
- **WHEN** an owner opens a published tournament with no registration dates
- **THEN** "Open registration" is unavailable, the area names the registration opening and closure as missing, and each item moves focus to its field

#### Scenario: The configuration has unsaved changes
- **WHEN** an owner has changed the form without saving
- **THEN** the registration action is unavailable and the area says to save the changes first

#### Scenario: An owner closes and reopens registration
- **WHEN** an owner chooses "Close registration" and then "Reopen registration"
- **THEN** the page shows "Registration closed" with "Reopen registration", and then "Registration open" with "Close registration"

#### Scenario: The change fails
- **WHEN** the request to open registration fails
- **THEN** the area says registration was not opened, the label is still "Registration not open" and the owner can retry

#### Scenario: The tournament changed elsewhere
- **WHEN** the request to open registration is rejected as a conflict
- **THEN** the page says the tournament changed elsewhere, registration is not opened, typed input is kept and "Reload latest" is offered

#### Scenario: The list shows the registration state
- **WHEN** the list contains a published tournament whose registration is open
- **THEN** its row shows the labels "Published", "Registration open" and "Preparing"

#### Scenario: A draft has no registration area
- **WHEN** an owner opens a draft
- **THEN** the page shows no registration action
