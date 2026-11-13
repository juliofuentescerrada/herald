## ADDED Requirements

### Requirement: The owner reviews absences before pairing
Under a mandatory check-in policy, an admitted entry pending check-in SHALL block drafting and SHALL be named as a blocker. The owner SHALL resolve it by confirming its check-in or marking it absent. Marking absent SHALL be allowed only for an admitted entry pending under a mandatory policy before competition starts; it SHALL cancel the entry with the cause "absent at start", be final, keep the entry and its check-in history as evidence, free its slot and admit nothing automatically. Under an optional policy there SHALL be no absence review and every admitted entry SHALL be eligible.

#### Scenario: The owner marks a pending entry absent
- **WHEN** an owner marks the pending admitted entry of "Sam Reed" absent under a mandatory policy
- **THEN** Sam Reed's entry is cancelled with the cause "absent at start", with who and when, and leaves the eligible field

#### Scenario: A freed slot promotes nothing after closure
- **WHEN** an owner marks an entry absent while registration is closed and an entry waits with "Capacity full"
- **THEN** the waiting entry is still waiting

#### Scenario: A confirmed entry is not marked absent
- **WHEN** an owner marks an admitted entry whose check-in is confirmed absent
- **THEN** the write is rejected and the entry is unchanged

#### Scenario: Optional check-in has no review
- **WHEN** registration closes under an optional policy with two admitted entries never checked in
- **THEN** both are eligible and nothing blocks drafting on their account

### Requirement: Check-in is locked while a schedule is published
While the tournament's schedule is published, checking in and undoing a check-in SHALL be rejected stating that the schedule must be withdrawn first.

#### Scenario: Undo after publication
- **WHEN** an owner undoes a confirmed check-in while a schedule is published
- **THEN** the write is rejected and the check-in is still confirmed
