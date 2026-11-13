## ADDED Requirements

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
