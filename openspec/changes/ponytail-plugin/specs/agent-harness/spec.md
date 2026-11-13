## ADDED Requirements

### Requirement: The coding plugin is declared, pinned and subordinate
`.claude/settings.json` SHALL declare the ponytail marketplace pinned to an exact tag and enable `ponytail@ponytail`, so every session that opens the repository loads the same version. `CLAUDE.md` SHALL state that the plugin never removes what a change's specifications, tests, ADRs or the rules of any `CLAUDE.md` require, and the clean-context reviewer SHALL be told that the plugin's instruction does not apply to its review. The settings SHALL hold no plugin configuration, webhook or token. `scripts/bootstrap` SHALL install the plugin at the pinned version, reading it from the settings, without ever stopping the bootstrap.

#### Scenario: The plugin's declaration
- **WHEN** the repository's Claude Code settings are read
- **THEN** the ponytail marketplace's source names an exact version tag and the plugin is enabled

#### Scenario: Herald's rules take precedence
- **WHEN** `CLAUDE.md` is read
- **THEN** it states that the plugin's minimalism never removes what specifications, tests, ADRs or any `CLAUDE.md` require, and the reviewer's definition says the plugin's instruction does not apply to reviewing

#### Scenario: Preparing a fresh environment
- **WHEN** `scripts/bootstrap` runs where the Claude Code CLI is installed
- **THEN** it adds the pinned marketplace and installs `ponytail@ponytail` at local scope, taking the repository and tag from `.claude/settings.json`
