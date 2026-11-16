# result-corrections Specification

## Purpose
Correcting a resolved match while the competition runs: a required private reason, a reviewed impact on points and positions computed by Standings, the expected match revision and an operation identity; the replaced result is kept with who, when and why, and recorded play is never erased.
## Requirements
### Requirement: An owner corrects an effective resolution
While the competition is running, an owner SHALL correct a resolved match to any outcome and cause of §8.1 with a reason of at most 500 characters, private to the organisation, the match's expected revision and an operation identity. Without a reason, or with the same resolution, it SHALL be rejected. The match SHALL keep one effective resolution and SHALL keep the replaced one with who, when and the reason.

#### Scenario: A win corrected to a draw
- **WHEN** an owner corrects Robin Vale's recorded win over Sam Reed to a draw with the reason "Score sheet misread"
- **THEN** the match is a draw, the win is kept in its history with the owner, the time and the reason, and the results revision increases once

#### Scenario: No reason
- **WHEN** an owner corrects a result without a reason
- **THEN** the write is rejected and the match is unchanged

#### Scenario: A scheduled match
- **WHEN** an owner tries to correct a match that is not resolved
- **THEN** the write is rejected and the owner is pointed to recording a result

### Requirement: A correction never erases recorded play
If the match recorded play, a correction SHALL be to a played outcome, a concession after play or a no contest after play, and SHALL keep the appearances. A team played outcome SHALL need the match's start with locked lineups.

#### Scenario: A played match corrected to an absence
- **WHEN** an owner corrects a played match to an absence
- **THEN** the write is rejected because play was recorded

#### Scenario: A team absence corrected to a played win
- **WHEN** an owner corrects an absence on a team match that never started to a played win
- **THEN** the write is rejected because the match has no locked lineups

### Requirement: Corrections are safe to repeat and refuse stale revisions
A correction repeated with the same operation identity and content SHALL return the original outcome without a second change; with different content it SHALL conflict. A correction based on an earlier match revision SHALL be rejected without a change.

#### Scenario: A lost response
- **WHEN** the owner's correction is sent twice with the same operation identity
- **THEN** one correction is recorded and both requests return it

#### Scenario: Changed elsewhere
- **WHEN** an owner applies a correction based on revision 3 and the match is at revision 4
- **THEN** the write is rejected as a conflict and the owner's input is kept

### Requirement: The admin application corrects results with a reviewed impact
The Match page of a resolved match SHALL offer "Correct result", the cause-first form with the current values and a required reason, and "Review impact", which shows the previous and new outcome and cause, recorded play, and each affected entrant's points and position before and after. "Apply correction" SHALL apply it; the page SHALL then label the result "Corrected" and list the replaced resolutions in a Result history.

#### Scenario: Reviewing before applying
- **WHEN** the owner reviews the impact of correcting a win to a draw
- **THEN** the panel shows the winner's points from 3 to 1 and the other entrant's from 0 to 1, with the positions that change, and nothing is applied until "Apply correction"

