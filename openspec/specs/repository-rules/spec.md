# repository-rules Specification

## Purpose
The verification part of Herald's harness (see `agent-harness`) for repository-wide rules: forbidden terms, British spelling, dependency licences and ADR 0017's inventory. These rules are checked by scripts and tests, not left as prose, and they run after each edit, before each commit and in CI.
## Requirements
### Requirement: Repository rules are checked at the edit, the commit and in CI
One rules script SHALL check forbidden terms, British spelling and package licences. It SHALL run on the edited file after each Claude Code edit, on the staged files before each commit, and on every file in CI, which SHALL fail on any finding.

#### Scenario: The agent writes a forbidden term
- **WHEN** a Claude Code edit adds "tenant" to a file under `src/`
- **THEN** the hook reports the file, line and rule in the same turn, before any other tool runs

#### Scenario: A commit with a spelling in American English
- **WHEN** a staged Markdown file contains `organization`
- **THEN** the pre-commit hook refuses the commit and names the file, line and British form

#### Scenario: A bypassed hook is caught in CI
- **WHEN** a pull request contains a forbidden term committed with the hooks bypassed
- **THEN** the CI run fails and names the file, line and rule

### Requirement: Forbidden terms and exceptions are data
Forbidden terms, the paths they apply to and their messages SHALL be listed in `docs/rules/`, with explicit exceptions that carry a reason. Game names and Wizards of the Coast product names SHALL be forbidden in code, and the sibling projects' names SHALL be forbidden in code except where an exception names what Herald shares with them. Documentation MAY mention them as examples or shared infrastructure.

#### Scenario: A game name in a domain type
- **WHEN** a file under `src/Herald.Tournaments/Domain/` names Magic or Pauper
- **THEN** the check fails with the rule's message

#### Scenario: A sibling project in code
- **WHEN** a file under `web/projects/` names PauperPilot
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

### Requirement: Private data is rejected
The repository rules SHALL report, in every tracked file that is not binary and in their three layers, private data the repository must not hold:
- a GUID that is neither synthetic nor a listed exception;
- an email address outside the allowed example and noreply domains;
- a real External ID or B2C host;
- a personal home path;
- a public IPv4 address.

The patterns, allowed values and exceptions SHALL be data in `docs/rules/private-data.json`, each exception with its reason.

#### Scenario: A real identifier in a document
- **WHEN** a Markdown file gains a GUID without a zero group that is not a listed exception
- **THEN** the rules report the file, the line and the value

#### Scenario: Synthetic identifiers
- **WHEN** a test uses `0198f5ee-0000-7000-8000-0000000000d1` or `00000000-0000-0000-0000-00000000d1ec`
- **THEN** the rules report nothing

#### Scenario: A personal address or path
- **WHEN** a file gains a personal email address, a `*.onmicrosoft.com` host or a `/home/<name>/` path
- **THEN** the rules report it

#### Scenario: Example and placeholder values
- **WHEN** a file uses `test@example.org`, `<subdomain>.ciamlogin.com` or `127.0.0.1`
- **THEN** the rules report nothing

### Requirement: Secrets are scanned before commit and in CI
Gitleaks, at a pinned and verified version, SHALL scan staged changes in the `pre-commit` hook where it is installed, and the pull request's commits in the CI `rules` job. A secret it finds SHALL fail the commit or the job, naming the file and the rule that matched. Any allow list in its configuration SHALL hold only values that are not secrets, each with its reason.

#### Scenario: A secret is committed
- **WHEN** a staged change adds a value with the shape of a cloud access key
- **THEN** the commit fails with the file and the rule that matched

#### Scenario: Development placeholders
- **WHEN** a change touches the development connection strings with `SAS_KEY_VALUE` or the E2E database password
- **THEN** gitleaks reports nothing

