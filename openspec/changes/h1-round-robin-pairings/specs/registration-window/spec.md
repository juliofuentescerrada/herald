## ADDED Requirements

### Requirement: Reopening waits for a withdrawn schedule
Reopening registration SHALL be rejected while the tournament's schedule is published, stating that the schedule must be withdrawn first. The configuration page SHALL show reopening disabled with that reason.

#### Scenario: Reopening a published schedule's tournament
- **WHEN** an owner reopens the registration of a tournament whose schedule is published
- **THEN** the action is rejected naming the schedule and registration is still closed
