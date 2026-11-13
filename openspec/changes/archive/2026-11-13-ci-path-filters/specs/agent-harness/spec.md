## MODIFIED Requirements

### Requirement: Each completed task is a pushed checkpoint
When the agent completes a task of a change's `tasks.md`, it SHALL commit the task's work with the task checked and push it to the slice's branch. Pushes made before the session opens or updates a pull request SHALL NOT count towards the guard's push rounds. Nor SHALL pushes made after that pull request is merged, or from another branch than the one it was seen on.

#### Scenario: Pushing checkpoints before the pull request
- **WHEN** a session pushes more checkpoints than the push rounds allow, and it has not opened or updated a pull request
- **THEN** the guard allows each push

#### Scenario: Pushing after the pull request opens
- **WHEN** a session has opened a pull request and reaches the push rounds since the maintainer's last message
- **THEN** the guard refuses the next push

#### Scenario: A late event about the merged pull request
- **WHEN** a GitHub event about the merged pull request wakes the session after it started a new change
- **THEN** the guard still allows the new change's checkpoint pushes

#### Scenario: A new change after the pull request merged
- **WHEN** the commit on which the session's pull request was seen is in `origin/main`, and the session pushes checkpoints of a new change
- **THEN** the guard allows each push
