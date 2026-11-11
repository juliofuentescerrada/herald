## MODIFIED Requirements

### Requirement: An owner lists and reads the organisation's tournaments
The API SHALL return the working organisation's tournaments, newest first, each with its title, game/variant, entry kind, capacity, planned start with its time zone, location, the three lifecycle facts (publication, registration, competition) and the number of admitted and waiting entries as last reported by Registration. The registration fact SHALL be the tournament's current registration state: not open, open or closed. It SHALL return one tournament with its full configuration, revision, lifecycle facts, the values missing for publication, the values missing to open registration, and the time of the last registration change when there is one. Tournaments SHALL be organisation-owned: a member of another organisation SHALL receive the same generic not-found response as for a tournament that does not exist, on reads and writes. No public API operation SHALL expose a tournament in this change, whatever its visibility.

#### Scenario: An organisation has no tournaments
- **WHEN** an owner lists the tournaments of a new organisation
- **THEN** the list is empty

#### Scenario: Two organisations each have tournaments
- **WHEN** an owner of one organisation lists its tournaments
- **THEN** the list contains only that organisation's tournaments

#### Scenario: Another organisation's owner reads a tournament by its identifier
- **WHEN** a person who owns a different organisation requests a tournament through their own organisation's address
- **THEN** the response is the generic not-found problem, with nothing of the tournament

#### Scenario: Another organisation's owner writes a tournament by its identifier
- **WHEN** that person saves or publishes the tournament through their own organisation's address
- **THEN** the response is the generic not-found problem and the tournament is unchanged

#### Scenario: A public tournament is published
- **WHEN** a tournament with public visibility is published
- **THEN** the public API document has no operation that returns it

#### Scenario: A published tournament reports what opening registration lacks
- **WHEN** an owner reads a published tournament with no registration opening
- **THEN** the response lists the registration opening among the values missing to open registration

#### Scenario: A tournament with open registration is listed
- **WHEN** an owner lists tournaments after opening the registration of one
- **THEN** that tournament's registration fact is open and the others' are unchanged

#### Scenario: A tournament with entries is listed
- **WHEN** an owner lists tournaments after three entries were admitted and one is waiting in one of them
- **THEN** that tournament reports 3 admitted and 1 waiting entries

### Requirement: The admin application lists tournaments
The admin application SHALL offer **Tournaments** as a workspace destination. Its page SHALL list the organisation's tournaments, each with its title, game/variant, entry kind, location, planned start in the reference time zone, capacity in its unit ("16 teams" or "16 individual entries") and the three lifecycle facts as separate labels, never merged into one status. A published tournament SHALL also show its admitted entries against its capacity ("3 of 16 teams admitted") and, when there are any, its waiting entries. A draft SHALL offer "Continue draft"; a published tournament SHALL offer "Edit configuration" and "Entries". The page SHALL have reviewed empty, loading and failed states, the last with a retry.

#### Scenario: The organisation has no tournaments
- **WHEN** an owner opens Tournaments in a new organisation
- **THEN** the page says there are no tournaments yet and offers "Create tournament" as its one primary action

#### Scenario: A published team tournament is listed
- **WHEN** the list contains a published team tournament with capacity 16
- **THEN** its row shows "16 teams" and the labels "Published", "Registration not open" and "Preparing"

#### Scenario: The list fails to load
- **WHEN** the list request fails
- **THEN** the page explains the failure and offers a retry, without showing stale or partial rows

## ADDED Requirements

### Requirement: Entries constrain the tournament's configuration
A save SHALL be rejected, naming the field, when it would set the capacity below the tournament's admitted entries, or change the entry kind or the admission while the tournament has active (waiting or admitted) entries, as last reported by Registration. The configuration form SHALL show the entry kind and admission as unavailable while active entries exist, saying why, and SHALL say the lowest capacity allowed while entries are admitted.

#### Scenario: Capacity below the admitted entries
- **WHEN** an owner saves capacity 4 for a tournament with 5 admitted entries
- **THEN** the save is rejected naming the capacity and the stored configuration is unchanged

#### Scenario: Entry kind with active entries
- **WHEN** an owner saves a tournament with one waiting entry changing its entry kind from individual to team
- **THEN** the save is rejected naming the entry kind and the stored configuration is unchanged

#### Scenario: Entry kind after every entry was cancelled
- **WHEN** every entry of a tournament has been cancelled and an owner changes its entry kind
- **THEN** the save succeeds

#### Scenario: The form explains the locked fields
- **WHEN** an owner opens the configuration of a tournament with admitted entries
- **THEN** entry kind and admission are unavailable with the reason that entries exist, and the capacity field says the lowest value allowed
