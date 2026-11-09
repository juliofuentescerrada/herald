## MODIFIED Requirements

### Requirement: One workspace provides two application shells
The workspace SHALL provide an admin CSR application and a public/participant application using Angular standalone components and lazy route composition. Both SHALL consume the internal `ui` library and have their own app composition/platform boundaries. The admin application SHALL require a session (see `sign-in`) and SHALL show the signed-in person and Sign out in its account menu. The public application SHALL remain anonymous and SHALL offer a Sign in action that leads to the admin application; a signed-in account menu in the public application waits for the participant portal (H2).

#### Scenario: Both shells build
- **WHEN** a clean checkout runs the documented production build commands
- **THEN** both applications build as distinct artifacts while sharing the same `ui` and generated-client libraries

#### Scenario: A visitor opens the M0 public page
- **WHEN** the representative public shell page is opened
- **THEN** it displays the reviewed shell/page with a working Sign in action that leads to the admin application, without offering simulated tournament registration or results

#### Scenario: The admin shell has a session
- **WHEN** a signed-in person opens the admin application
- **THEN** the account menu shows their display name and a Sign out action, and the rail shows the working organisation
