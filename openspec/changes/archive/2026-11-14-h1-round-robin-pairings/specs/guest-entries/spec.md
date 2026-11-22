## ADDED Requirements

### Requirement: A published schedule locks the field
While the tournament's schedule is published, admitting and cancelling entries, absence included, SHALL be rejected stating that the schedule must be withdrawn first. Roster changes SHALL stay allowed until competition starts.

#### Scenario: Cancelling after publication
- **WHEN** an owner cancels an admitted entry while a schedule is published
- **THEN** the write is rejected naming the published schedule and the entry is still admitted

#### Scenario: After withdrawal
- **WHEN** an owner cancels the same entry after the schedule is withdrawn
- **THEN** the entry is cancelled

### Requirement: A cancellation records its cause
Every cancellation SHALL record its cause: "owner" for a cancellation by the owner, "absent at start" for an entry marked absent. The entries page SHALL show the cause of each cancelled entry.

#### Scenario: Two causes
- **WHEN** an owner cancels one entry and marks another absent
- **THEN** the Cancelled group shows each with its own cause, who and when
