# tournament-setup Specification

## Purpose
An organisation's owner creates a draft tournament, configures it, reviews it and publishes it, and lists and edits the organisation's tournaments; publication opens nothing.

## Requirements
### Requirement: An owner creates a draft tournament
An organisation's owner SHALL be able to create a tournament in that organisation. A new tournament SHALL be a draft with registration not open and competition in preparation. Creation SHALL require only a title, which is required after trimming and at most 120 characters; every other configuration value MAY be absent in a draft. Creation SHALL record the acting person and time. The client SHALL supply the new tournament's identifier, and a repeat with the same identifier and content SHALL return the original tournament instead of creating another.

#### Scenario: A draft is created with a title only
- **WHEN** an owner creates a tournament giving only the title "Saturday Open"
- **THEN** a draft tournament with that title exists in the organisation, with registration not open, competition in preparation and revision 1

#### Scenario: The title is missing or too long
- **WHEN** the title is blank after trimming or longer than 120 characters
- **THEN** creation is rejected with a field error naming the rule and no tournament exists

#### Scenario: The response to a creation is lost
- **WHEN** the client repeats a creation with the same identifier and content
- **THEN** it receives the tournament created the first time and no second tournament exists

#### Scenario: An identifier is reused with different content
- **WHEN** a creation uses an existing tournament's identifier with different content, or from another organisation
- **THEN** it is rejected as a conflict without revealing the existing tournament

### Requirement: Configuration values are validated on every save
A tournament's configuration SHALL consist of: title; game/variant (free text, at most 80 characters); entry kind (individual or team); for a team tournament, minimum roster size, maximum roster size and active players per side; capacity in entries; planned start, registration opening and registration closure as local date-times; reference time zone; location (on-site with a venue of at most 120 characters, or online); admission (automatic or manual); check-in (optional or mandatory); and visibility (public, unlisted or private). The system SHALL NOT supply a default for any of them.

Every save, of a draft or a published tournament, SHALL reject values that break these rules, naming each field and rule, and SHALL change nothing when it rejects:

- capacity is between 2 and 256;
- roster sizes and active players are between 1 and 50, and active players ≤ minimum roster size ≤ maximum roster size;
- registration opening is before registration closure;
- registration closure is not after the planned start (equal is allowed);
- the reference time zone is a known IANA zone, and no date-time falls in an hour that zone skips;
- an individual tournament carries no team structure;
- an online tournament carries no venue.

A rule that compares two values SHALL apply only when both are present.

#### Scenario: A partial draft is saved
- **WHEN** an owner saves a draft with a title, entry kind and capacity but no dates
- **THEN** the save succeeds and the absent values stay absent

#### Scenario: Capacity is below two
- **WHEN** an owner saves a team tournament with capacity 1
- **THEN** the save is rejected with an error on capacity and the stored configuration is unchanged

#### Scenario: The roster cannot field a side
- **WHEN** an owner saves a team tournament with 5 active players per side and a maximum roster size of 4
- **THEN** the save is rejected with an error on the roster structure

#### Scenario: Registration closes after the planned start
- **WHEN** registration closure is later than the planned start
- **THEN** the save is rejected with an error on registration closure

#### Scenario: Registration closes at the planned start
- **WHEN** registration closure equals the planned start
- **THEN** the save succeeds

#### Scenario: A tournament changes from team to individual
- **WHEN** an owner saves a tournament as individual that previously had a team structure
- **THEN** the stored tournament has no roster sizes or active players, and its capacity counts individual entries

#### Scenario: An unknown time zone is sent
- **WHEN** a save names a reference time zone that is not a known IANA zone
- **THEN** the save is rejected with an error on the time zone

### Requirement: Publication requires a complete configuration
An owner SHALL be able to publish a draft tournament. Publication SHALL require: title, game/variant, entry kind, capacity, planned start, reference time zone, location, admission, check-in and visibility, plus the team structure for a team tournament. Registration opening and closure SHALL NOT be required for publication. An incomplete draft SHALL be rejected with every missing value named, and SHALL stay a draft. The tournament's read model SHALL list the values still missing for publication, so the application explains the blocker before the owner tries.

Publication SHALL make the tournament published, record the acting person and time, and change nothing else: registration stays not open, competition stays in preparation, and no entry, pairing or match is created. The system SHALL offer no way to return a published tournament to draft. Publishing an already published tournament SHALL return its published state without a second effect.

#### Scenario: A complete draft is published
- **WHEN** an owner publishes a draft that has every required value
- **THEN** the tournament is published, registration is not open, competition is in preparation, and the publishing person and time are recorded

#### Scenario: An incomplete draft is published
- **WHEN** an owner publishes a draft with no reference time zone and no capacity
- **THEN** publication is rejected naming the time zone and the capacity, and the tournament is still a draft

#### Scenario: Registration dates are absent
- **WHEN** an owner publishes a draft that is complete except for registration opening and closure
- **THEN** the tournament is published

#### Scenario: A team tournament lacks its structure
- **WHEN** an owner publishes a team draft without active players per side
- **THEN** publication is rejected naming that value

#### Scenario: The response to a publication is lost
- **WHEN** the client repeats the publication of a tournament that is already published
- **THEN** it receives the published tournament and the recorded publication person and time are unchanged

#### Scenario: A draft reports what it lacks
- **WHEN** an owner reads a draft with no planned start
- **THEN** the response lists the planned start among the values missing for publication

### Requirement: A published tournament stays editable and complete
An owner SHALL be able to change the configuration of a published tournament, including its entry kind while no entries exist. A save of a published tournament SHALL be rejected, naming the values, when it would leave any value required for publication absent. While its registration is open, a save SHALL also be rejected, naming the values, when it would leave the registration opening or the registration closure absent.

#### Scenario: A published tournament's capacity changes
- **WHEN** an owner saves a published tournament with capacity 16 instead of 8
- **THEN** the save succeeds and the tournament is still published

#### Scenario: A save would make a published tournament incomplete
- **WHEN** an owner saves a published tournament with no planned start
- **THEN** the save is rejected naming the planned start and the stored configuration is unchanged

#### Scenario: A save would remove a registration date while registration is open
- **WHEN** an owner saves a tournament whose registration is open with no registration closure
- **THEN** the save is rejected naming the registration closure and the stored configuration is unchanged

#### Scenario: A registration date is removed while registration is closed
- **WHEN** an owner saves a tournament whose registration is closed or not open with no registration opening
- **THEN** the save succeeds

### Requirement: Writes state the revision they were based on
Every tournament SHALL have a revision that starts at 1 and increases by one with each effective change. Every save and publication SHALL state the revision it was based on. A write based on an older revision SHALL be rejected as a conflict that reports the current revision and changes nothing, except that a save whose content equals the stored configuration SHALL return the current tournament as a repeat. A save that changes nothing SHALL NOT increase the revision.

#### Scenario: Two tabs edit the same draft
- **WHEN** an owner saves a change in one tab and then saves a different change in another tab that was based on the earlier revision
- **THEN** the second save is rejected as a conflict and the first tab's change is intact

#### Scenario: The response to a save is lost
- **WHEN** the client repeats a save with the same content and the earlier revision
- **THEN** it receives the current tournament and the revision does not increase again

#### Scenario: A stale review is published
- **WHEN** an owner publishes from a review of revision 3 after the configuration reached revision 4
- **THEN** publication is rejected as a conflict and the tournament is still a draft

### Requirement: An owner lists and reads the organisation's tournaments
The API SHALL return the working organisation's tournaments, newest first, each with its title, game/variant, entry kind, capacity, planned start with its time zone, location and the three lifecycle facts (publication, registration, competition). The registration fact SHALL be the tournament's current registration state: not open, open or closed. It SHALL return one tournament with its full configuration, revision, lifecycle facts, the values missing for publication, the values missing to open registration, and the time of the last registration change when there is one. Tournaments SHALL be organisation-owned: a member of another organisation SHALL receive the same generic not-found response as for a tournament that does not exist, on reads and writes. No public API operation SHALL expose a tournament in this change, whatever its visibility.

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

### Requirement: The admin application lists tournaments
The admin application SHALL offer **Tournaments** as a workspace destination. Its page SHALL list the organisation's tournaments, each with its title, game/variant, entry kind, location, planned start in the reference time zone, capacity in its unit ("16 teams" or "16 individual entries") and the three lifecycle facts as separate labels, never merged into one status. A draft SHALL offer "Continue draft"; a published tournament SHALL offer "Edit configuration". The page SHALL have reviewed empty, loading and failed states, the last with a retry.

#### Scenario: The organisation has no tournaments
- **WHEN** an owner opens Tournaments in a new organisation
- **THEN** the page says there are no tournaments yet and offers "Create tournament" as its one primary action

#### Scenario: A published team tournament is listed
- **WHEN** the list contains a published team tournament with capacity 16
- **THEN** its row shows "16 teams" and the labels "Published", "Registration not open" and "Preparing"

#### Scenario: The list fails to load
- **WHEN** the list request fails
- **THEN** the page explains the failure and offers a retry, without showing stale or partial rows

### Requirement: The configuration form keeps input and explains errors
The admin application SHALL present the configuration as one form. Individual tournaments SHALL show no team structure fields; choosing team SHALL reveal them and label capacity in teams without clearing other input. Choosing online SHALL hide the venue. No value SHALL be preselected, except that the reference time zone is proposed from the browser. The competition profile SHALL be shown read-only. Each date-time field SHALL also show its value written as "14 November 2026, 10:00".

A rejected, failed or conflicting save SHALL keep everything typed. Field errors SHALL appear at their field, associated with its control and distinguishable without relying on colour, and in a summary whose items move focus to the field. A draft with values missing for publication SHALL list them the same way and SHALL explain why review and publication are unavailable. Leaving the form with unsaved input SHALL ask first.

#### Scenario: An owner switches a draft to team
- **WHEN** an owner who has typed a title changes entry kind to team
- **THEN** the roster and active-player fields appear, capacity is labelled in teams and the title is still there

#### Scenario: A save is rejected
- **WHEN** a save is rejected for two field rules
- **THEN** both errors are shown at their fields and in the summary, focus moves to the summary, and every typed value is kept

#### Scenario: A save fails
- **WHEN** the save request fails for a reason other than its content
- **THEN** the form says the save failed, keeps every typed value and offers a retry

#### Scenario: A save conflicts
- **WHEN** a save is rejected because the tournament changed elsewhere
- **THEN** the form says so, keeps every typed value, does not overwrite the stored tournament, and offers "Reload latest", which replaces the typed values only after the owner confirms

#### Scenario: A draft is not ready to publish
- **WHEN** an owner opens a draft with no reference time zone
- **THEN** the form lists the time zone as missing for publication, the item moves focus to that field, and review is unavailable with that explanation

#### Scenario: An owner leaves with unsaved input
- **WHEN** an owner navigates away from a form with unsaved changes
- **THEN** the application asks before discarding them, and declining keeps the page and the input

### Requirement: An owner reviews a tournament before publishing it
Before publication the admin application SHALL show a read-only summary of the saved configuration, with the visibility stated in words, the statement that publishing keeps registration not open and creates no entries, pairings or play, and the statement that a published tournament cannot be unpublished. Publishing SHALL be the page's primary action and SHALL publish the revision that was reviewed. While publishing, the action SHALL not be repeatable; a failed publication SHALL leave a draft and offer a retry. After publication the application SHALL show the tournament with its name, game/variant, entry kind, location and planned start, the labels "Published", "Registration not open" and "Preparing", and its configuration still editable. It SHALL NOT offer to start the tournament.

#### Scenario: An owner reviews a team tournament
- **WHEN** an owner opens the review of a complete team draft
- **THEN** the summary shows capacity in teams, the roster bounds and active players per side, and the visibility in words

#### Scenario: An owner publishes from the review
- **WHEN** an owner publishes from the review
- **THEN** the tournament page shows "Published", "Registration not open" and "Preparing", and no action to start the tournament

#### Scenario: Publication fails
- **WHEN** the publication request fails
- **THEN** the review says so, the tournament is still a draft and the owner can retry

#### Scenario: The draft changed after the review was opened
- **WHEN** an owner publishes from a review whose revision is no longer current
- **THEN** the application says the tournament changed, does not publish, and shows the current configuration for another review

