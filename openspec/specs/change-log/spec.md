# change-log Specification

## Purpose
Each tournament's change log from publication onwards: what changed for competitors, who, when, the revision and the owner's reason; the public part visitors may read; and the admin page that lists it with a filter by kind. Herald records the changes and delivers them to nobody.
## Requirements
### Requirement: Each tournament keeps a change log
From publication, a tournament SHALL record in its change log, with who, when and the revision: entries admitted and cancelled; schedules published and withdrawn; the publication; material changes (game or variant, system and rules, participation structure, venue, dates with old and new values and the reference time zone, visibility); cancellation; finalisation, reopening and each revised final revision. A reason given in Tournaments SHALL be shown with its entry; a reason given elsewhere SHALL be reached through a link to where it is kept.

#### Scenario: A postponed start
- **WHEN** an owner changes the planned start from 22 to 29 November 2026, 10:00
- **THEN** the change log shows the old and new times with Europe/Madrid, the owner and the time

#### Scenario: Entries cancelled by the cancellation
- **WHEN** a tournament with three admitted entries is cancelled with a reason
- **THEN** the change log shows the cancellation with its reason and the three entries cancelled with the cause "tournament cancelled"

#### Scenario: A repeated fact
- **WHEN** the fact that schedule revision 2 was published arrives twice
- **THEN** the change log shows it once

### Requirement: Only material changes are public
The change log entries for publication, material changes, cancellation and final revisions SHALL be marked public; the others and every reason SHALL stay private to the organisation. Herald SHALL NOT claim that a change was delivered to or read by anyone.

#### Scenario: An admission
- **WHEN** an entry is admitted
- **THEN** its change log entry is not public

### Requirement: The admin application shows the change log
The tournament navigation SHALL offer "Change log", a list newest first with a filter by kind, each row saying what changed, who and when, old and new values for a material change, and a "Public" label when visitors can see it.

#### Scenario: Filtering
- **WHEN** the owner filters the change log by "Schedule"
- **THEN** only schedule publications and withdrawals are listed

