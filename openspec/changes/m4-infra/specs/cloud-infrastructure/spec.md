## ADDED Requirements

### Requirement: Each slot has the same resources under its own names
The infrastructure SHALL define, for each of the `main` and `preview` slots, an API container app, a public and an admin container app, a seeding job, Application Insights and the slot's identities, named `<type>-herald-<function>` for `main` and `<type>-herald-preview-<function>` for `preview`.

#### Scenario: Both slots are defined with their names
- **WHEN** the infrastructure code is read
- **THEN** it defines `ca-herald-api`, `ca-herald-public`, `ca-herald-admin`, `caj-herald-seed` and `appi-herald`, and `ca-herald-preview-api`, `ca-herald-preview-public`, `ca-herald-preview-admin`, `caj-herald-preview-seed` and `appi-herald-preview`

### Requirement: Slots scale to zero and only the web apps are public
Every container app SHALL have a minimum of zero replicas; the API's ingress SHALL be internal to the shared environment and the web apps' external.

#### Scenario: Minimum replicas and ingress
- **WHEN** the infrastructure code is read
- **THEN** every container app has a minimum of zero replicas, the API apps have internal ingress and the public and admin apps external ingress

### Requirement: The shared platform is found by name
The infrastructure SHALL find Steward's resources by their documented names and `data` sources, and SHALL NOT read Steward's state.

#### Scenario: No remote state of the platform
- **WHEN** the infrastructure code is read
- **THEN** it has no `terraform_remote_state` and refers to `cae-shared`, `crjfcshared`, `log-shared` and `psql-jfc-shared` by name

### Requirement: No secret in the infrastructure's configuration
The infrastructure SHALL configure the apps with non-secret values only, take the directory's identifiers from the slot's environment instead of the repository, and define no Key Vault or container app secret.

#### Scenario: No secrets defined
- **WHEN** the infrastructure code is read
- **THEN** it defines no `secret` block on any container app or job and no Key Vault, and no directory identifier appears in it

### Requirement: The slot databases are protected once imported
Once onboarded by Steward, the slot databases SHALL be imported into Herald's state and protected from destruction.

#### Scenario: Databases imported and protected
- **WHEN** the infrastructure code is read
- **THEN** `herald_main` and `herald_preview` are imported only when the databases are onboarded, with `prevent_destroy`

### Requirement: A change to the infrastructure is planned on its pull request
A pull request that changes the infrastructure SHALL run its format check, validation and a plan signed in as Herald's delivery identity.

#### Scenario: An infrastructure change triggers its plan
- **WHEN** a pull request changes a file under `infra/`
- **THEN** the `infra` workflow runs for it, and CI's code jobs are not selected by that file alone
