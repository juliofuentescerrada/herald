## MODIFIED Requirements

### Requirement: State has an owner and an authorised scope
Features SHALL own server queries/mutations through TanStack Query and local interaction state through signals. App platform SHALL supply context and the session without owning business workflows. Sign-out, a change of person or organisation, session expiry and lost access SHALL detach protected client state: a context change is a full load, and session expiry or lost access hide loaded private data at once. Unsaved input SHALL live only in the current tab's memory and SHALL NOT be written to web storage. Public data SHALL remain separate from operational data.

#### Scenario: Operational context changes
- **WHEN** the person or organisation context changes after filling a context-scoped cache and draft
- **THEN** the old protected data and draft cannot be observed or reused under the new context

#### Scenario: Another tab holds the old context
- **WHEN** one tab replaces the identity or organisation context
- **THEN** the other tabs of the same application reload and drop that context's data

#### Scenario: The person signs out
- **WHEN** the person signs out
- **THEN** the application reloads without the session and no protected data remains in the document or web storage

#### Scenario: Access is lost during work
- **WHEN** an organisation-scoped request for the working organisation receives the generic not-found answer
- **THEN** the application hides that organisation's loaded data, shows the reviewed access-lost state and keeps only the person's typed input for copying
