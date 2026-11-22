## ADDED Requirements

### Requirement: Competition knows the eligible field
Competition SHALL keep, per tournament, the eligible entrants Registration last reported (entry, name, admission order), the registration state, the number of admitted entries pending a mandatory check-in and the eligible revision, keeping the newest revision and ignoring older ones. An eligible entrant SHALL be an admitted entry that, under a mandatory check-in policy, has confirmed its check-in. The eligible revision SHALL change only when the set of eligible entrants does; a roster change or a waiting entry SHALL NOT change it.

#### Scenario: A check-in under a mandatory policy changes the field
- **WHEN** an owner confirms the check-in of a pending admitted entry under a mandatory policy
- **THEN** Competition's eligible field includes that entry under a new eligible revision

#### Scenario: A roster change leaves the field as it was
- **WHEN** an owner adds a player to an admitted team's roster
- **THEN** the eligible revision is unchanged

#### Scenario: An older report changes nothing
- **WHEN** Competition receives an eligible field with a lower revision than the one it keeps
- **THEN** the kept field is unchanged

### Requirement: An owner generates a draft schedule
An owner SHALL generate a single round-robin draft for a published tournament whose registration is closed, with no admitted entry pending a mandatory check-in and at least two eligible entrants, choosing the seeding: admission order or a draw. Otherwise generating SHALL be rejected naming each blocker. The draft SHALL pair every two eligible entrants exactly once by the circle method; with an odd number of entrants, each round SHALL have one resting entrant and each entrant SHALL rest exactly once. A draw SHALL record its seed, and the same seed and field SHALL give the same draft. A team SHALL be one entrant. Generating SHALL send nothing and SHALL create no match result.

#### Scenario: Four individual entrants
- **WHEN** an owner generates a draft for four eligible players seeded by admission order
- **THEN** the draft has three rounds and six matches, each pair of players meeting once, and no rest

#### Scenario: Five entrants rest once each
- **WHEN** an owner generates a draft for five eligible players
- **THEN** the draft has five rounds and ten matches, and each player rests in exactly one round

#### Scenario: Four teams
- **WHEN** an owner generates a draft for four eligible teams
- **THEN** the draft has six matches, one per pair of teams, and no match between players

#### Scenario: A draw is reproducible
- **WHEN** an owner generates a draft seeded by a draw
- **THEN** the draft records its seed, and generating from that seed and the same field gives the same rounds

#### Scenario: Registration is still open
- **WHEN** an owner generates a draft while registration is open
- **THEN** the write is rejected naming registration and no draft exists

#### Scenario: Entries are pending
- **WHEN** an owner generates a draft under a mandatory policy while two admitted entries are pending
- **THEN** the write is rejected naming the two pending entries

#### Scenario: Fewer than two eligible entrants
- **WHEN** an owner generates a draft with one eligible entrant
- **THEN** the write is rejected stating that at least two eligible entrants are needed

### Requirement: A draft follows the field or becomes stale
A draft SHALL record the eligible revision it was generated from. When the eligible field changes, the draft SHALL be reported as stale, naming the entrants added or removed, and publishing it SHALL be rejected until it is regenerated. Regenerating SHALL replace the draft, with a new seed for a draw, and SHALL keep no history of the replaced draft.

#### Scenario: An absence makes the draft stale
- **WHEN** an entry of the draft is marked absent
- **THEN** the draft is reported stale naming that entry, and publishing it is rejected

#### Scenario: Regenerating replaces the draft
- **WHEN** an owner regenerates a stale draft
- **THEN** the new draft follows the current field and the replaced draft is not kept

### Requirement: An owner publishes the draft as a revision
An owner SHALL publish a current draft while no revision is published and the competition has not started. Publishing SHALL create a schedule revision with its number, rounds, the eligible revision, who and when, and SHALL lock the field. Publishing a draft already published SHALL return that revision without creating another. Only the owner SHALL see drafts and published revisions in this batch.

#### Scenario: The owner publishes
- **WHEN** an owner publishes a current draft of four entrants
- **THEN** schedule revision 1 is published with six matches, who and when

#### Scenario: Publishing twice
- **WHEN** the same publication is repeated
- **THEN** the response is revision 1 and no other revision or match exists

### Requirement: An owner withdraws a published schedule with a reason
Before the competition starts, an owner SHALL withdraw the published revision stating a reason. Withdrawing SHALL keep the revision in the schedule's history with the reason, who and when, return its seeding and rounds to the draft, and unlock the field. A withdrawal without a reason SHALL be rejected.

#### Scenario: Withdraw and republish
- **WHEN** an owner withdraws revision 1 with the reason "Late absence", marks an entry absent, regenerates and publishes
- **THEN** revision 2 is published and the history shows revision 1 withdrawn with its reason

#### Scenario: A reason is required
- **WHEN** an owner withdraws without a reason
- **THEN** the write is rejected and revision 1 is still published

### Requirement: A field change that crossed the publication is reported
When Competition receives an eligible field newer than the one a published revision was built from, the schedule SHALL report that the field changed since publication, naming the entrants added or removed, and SHALL NOT change the published revision.

#### Scenario: A cancellation crossed the publication
- **WHEN** an entry cancelled just before the lock reached Registration leaves the field
- **THEN** the published schedule reports the change naming that entry and keeps its pairings

### Requirement: Schedule writes state the revision they were based on
Generating, regenerating, publishing and withdrawing SHALL state the schedule revision they were based on; a stale revision SHALL be rejected with the current schedule and no change. A tournament of another organisation SHALL answer as not found.

#### Scenario: Another tab published first
- **WHEN** an owner withdraws based on a schedule revision another tab has already changed
- **THEN** the write is rejected with the current schedule

### Requirement: The admin application shows and manages the schedule
The admin application SHALL offer a Schedule page per tournament, beside Entries, with the schedule's state beside the title; the blockers to generating, each with its correction path; the seeding choice with nothing preselected; rounds in order with their matches and resting entrant; stale and crossed-field notices; publish and withdraw as summary actions, withdrawal asking for its reason; and the publication history after the rounds. A failed write SHALL keep the page and say what to do; a conflict SHALL offer to reload.

#### Scenario: The owner reads a published schedule
- **WHEN** an owner opens the Schedule page of a tournament with revision 2 published
- **THEN** the page shows "Published · revision 2", its rounds and the history with revision 1 withdrawn and its reason
