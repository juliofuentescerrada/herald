## ADDED Requirements

### Requirement: Repository rules are checked at the edit, the commit and in CI
One rules script SHALL check forbidden terms, British spelling and package licences. It SHALL run on the edited file after each Claude Code edit, on the staged files before each commit, and on every file in CI, which SHALL fail on any finding.

#### Scenario: The agent writes a forbidden term
- **WHEN** a Claude Code edit adds "tenant" to a file under `src/`
- **THEN** the hook reports the file, line and rule in the same turn, before any other tool runs

#### Scenario: A commit with a spelling in American English
- **WHEN** a staged Markdown file contains "organization"
- **THEN** the pre-commit hook refuses the commit and names the file, line and British form

#### Scenario: A bypassed hook is caught in CI
- **WHEN** a pull request contains a forbidden term committed with the hooks bypassed
- **THEN** the CI run fails and names the file, line and rule

### Requirement: Forbidden terms and exceptions are data
Forbidden terms, the paths they apply to and their messages SHALL be listed in `docs/rules/`, with explicit exceptions that carry a reason. Game names SHALL be forbidden in modules' `Domain` folders, and Wizards of the Coast product names SHALL be forbidden in the whole repository.

#### Scenario: A game name in a domain type
- **WHEN** a file under `src/Herald.Tournaments/Domain/` names a listed game
- **THEN** the check fails with the rule's message

#### Scenario: An external name that must stay
- **WHEN** code reads the directory's `tid` claim and that name is listed as an exception with its reason
- **THEN** the check passes

### Requirement: Package licences are on an allowed list
Every .NET and web package, direct or transitive, SHALL have a licence on the allowed list in `docs/rules/licences.txt`. A package without a licence, or with one not on the list, SHALL fail the check with its name and version.

#### Scenario: A package with a new licence
- **WHEN** a change adds a package whose licence is not on the allowed list
- **THEN** the check fails, naming the package, its version and its licence, and the change waits for the maintainer's decision

### Requirement: ADR 0017's inventory covers every recorded actor and time
An architecture test SHALL fail when a domain type records an actor and a time, or is a history record, and is neither named in ADR 0017's inventory of notifiable facts nor listed as an exemption with a reason.

#### Scenario: A new history record without an inventory row
- **WHEN** a change adds a `CheckInChange` record to a module's domain and no inventory row names it
- **THEN** the architecture tests fail and name the type and ADR 0017's inventory
