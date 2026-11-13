## MODIFIED Requirements

### Requirement: Permissions are declared in the repository
`.claude/settings.json` SHALL allow the project's routine commands. In every permission mode it SHALL deny:
- force pushes and hard resets to a remote;
- infrastructure apply and destroy, and deleting Azure resources;
- writing environment or variable files;
- listing or reading .NET user secrets.

#### Scenario: An unattended session tries a force push
- **WHEN** a session in any permission mode runs `git push --force`
- **THEN** the command is refused by the settings before it runs

#### Scenario: A session tries to read the user secrets
- **WHEN** a session in any permission mode runs `dotnet user-secrets list` or reads a file in the user-secrets folder
- **THEN** the settings refuse it before it runs
