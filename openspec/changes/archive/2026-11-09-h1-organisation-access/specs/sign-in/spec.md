## ADDED Requirements

### Requirement: Only assigned people sign in
The admin application SHALL require a session for every route. Sign-in SHALL go through the external account provider configured for Herald, and only people the platform operator has assigned to Herald's application SHALL obtain access. Herald SHALL offer no self-service registration. The provider SHALL refuse a person not assigned to Herald's admin application on its own page. A person who signs in but whose token lacks Herald's organiser role SHALL see the reviewed "access is by invitation" state, with sign-out and use-another-account actions and no organisation content or creation path.

#### Scenario: An assigned person signs in
- **WHEN** an assigned person opens the admin application without a session and completes sign-in
- **THEN** they return to the address they asked for, now with a session

#### Scenario: An unassigned person signs in
- **WHEN** a person the provider authenticates is not assigned to Herald's admin application
- **THEN** the provider refuses the sign-in on its own page and Herald receives no session

#### Scenario: A signed-in person lacks the organiser role
- **WHEN** a signed-in person's token carries no organiser role, so the API answers 403
- **THEN** the admin application shows the not-assigned state and offers no organisation content, creation or Organise action

#### Scenario: Sign-in fails or is cancelled
- **WHEN** the provider returns an error or the person cancels
- **THEN** the admin application shows the reviewed failed or cancelled state with a retry action and no protected content

### Requirement: The API authenticates every admin request
Every endpoint in the admin group SHALL require a bearer token issued by the configured directory for Herald's API, unexpired, and carrying the application role that assignment grants. Endpoints in the public group SHALL remain anonymous. A request that fails these checks SHALL receive 401 (no or invalid token) or 403 (valid token without the role) and SHALL reach no handler.

#### Scenario: An admin endpoint without a token
- **WHEN** an admin endpoint is called without a bearer token
- **THEN** the response is 401 and no handler runs

#### Scenario: A token without the assignment role
- **WHEN** an admin endpoint is called with a valid token that lacks Herald's application role
- **THEN** the response is 403 and no handler runs

#### Scenario: An endpoint without an authorisation decision
- **WHEN** an endpoint in the admin group allows anonymous access
- **THEN** a host test fails naming the endpoint

### Requirement: A person is identified by the provider's directory and object identifiers
Herald SHALL key a person on the token's directory (`tid`) and object (`oid`) identifiers and SHALL NOT use email, name or any other mutable claim as identity or for lookup. A person's record SHALL be created the first time they perform an action that needs it, with no separate registration step. The display name SHALL come from the token and SHALL NOT be used for authorisation.

#### Scenario: Two people share a display name
- **WHEN** two assigned people with the same name sign in
- **THEN** Herald holds two persons, each seeing only their own organisations

#### Scenario: A person's email changes at the provider
- **WHEN** the same `tid`/`oid` signs in with a different email claim
- **THEN** Herald resolves the same person and their organisations

### Requirement: Sign-out and session expiry protect the session's data
Sign-out SHALL end the provider session for Herald and replace the admin context through a full load, as for any context change. When a token can no longer be renewed silently, the admin application SHALL show the reviewed session-expired state: loaded private data is hidden, input the person typed in the current tab is shown for copying, nothing is resubmitted automatically, and signing in again is a full load.

#### Scenario: The person signs out
- **WHEN** the person chooses Sign out in the account menu
- **THEN** the application reloads without the session and other tabs of the admin application reload too

#### Scenario: The session expires during work
- **WHEN** a request needs a new token and silent renewal fails while the person has unsaved input
- **THEN** the session-expired state hides private data, shows their input for copying and offers Sign in again

### Requirement: Recovery starts with the provider
The admin application SHALL direct a person who cannot sign in to the provider's own recovery first, and SHALL show the reviewed support next action when that fails. Herald SHALL NOT reset credentials or claim to.

#### Scenario: Provider recovery fails
- **WHEN** a person opens the recovery help from the sign-in failure state
- **THEN** they see the provider recovery step and how to contact the platform operator, with no Herald password reset
