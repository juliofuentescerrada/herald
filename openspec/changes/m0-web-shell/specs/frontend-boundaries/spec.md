## Status

Target requirements for `m0-web-shell`, approved for implementation on 8 November 2026. They are not implemented capabilities until the change is archived.

## ADDED Requirements

### Requirement: Functional features are independent
A frontend feature SHALL own its related routes, components, forms, queries, mutations and tests. Features SHALL NOT import another feature or the other application, including through public entry points or re-exported aliases. App composition SHALL access features through explicit entry points. A feature boundary SHALL NOT require an Angular NgModule, a separate library or a copy of a backend module boundary.

#### Scenario: A new feature is covered automatically
- **WHEN** a new feature is added using the reviewed feature convention
- **THEN** boundary checks cover it without maintaining a separate manual allow-list of features

#### Scenario: A feature imports another feature
- **WHEN** a feature imports another feature directly, through an alias or through a re-export
- **THEN** boundary checks fail and identify the source and forbidden target

#### Scenario: Composition accesses a feature entry point
- **WHEN** an app's route composition lazily imports a feature's declared entry point without reaching its internals
- **THEN** boundary checks accept that dependency

### Requirement: App platform and presentation remain below features
App platform SHALL own narrow identity/organisation-context and API-configuration capabilities without importing features. App-local shared presentation SHALL depend only on presentation contracts and shared presentation dependencies; it SHALL NOT import any feature or the other application, including their components, contracts or stores. App composition SHALL own cross-feature composition rather than introducing feature-to-feature dependencies or a central business-service layer.

#### Scenario: Platform imports a feature store
- **WHEN** app platform imports a feature's query, mutation or local-state implementation
- **THEN** boundary checks fail and identify the forbidden dependency

#### Scenario: Local shared presentation imports feature internals
- **WHEN** an app-local shared component imports a feature component, contract or store, or any part of another app
- **THEN** boundary checks fail

### Requirement: Shared libraries expose narrow public contracts
`ui` SHALL expose common controls, semantic tokens and presentation contracts. It SHALL NOT depend on either app, `api-client`, a query cache, sessions, permissions or app routing. `api-client` SHALL contain generated API contracts/client and its reviewed transport dependencies, without UI, navigation, application state or workflow rules. Consumers SHALL use explicit library public entry points rather than internal paths.

#### Scenario: A common control imports an API query
- **WHEN** a `ui` control imports the generated client, a query cache or an application's state
- **THEN** boundary checks fail

#### Scenario: An app deep-imports a shared library
- **WHEN** app code imports a private path inside `ui` or `api-client`
- **THEN** boundary checks fail even when the path resolves successfully for the compiler

#### Scenario: An app imports the component foundation directly
- **WHEN** app code imports the external component foundation that `ui` wraps
- **THEN** boundary checks fail, because only `ui` may depend on it

### Requirement: CI verifies dependency directions
CI SHALL enforce the dependency rules for relative imports, path aliases, barrel re-exports and dynamic route imports. Reviewed positive and negative fixtures SHALL prove that allowed composition works and forbidden edges are rejected. Temporary forbidden code SHALL NOT remain in production sources.

#### Scenario: A forbidden edge uses a lazy import
- **WHEN** a feature dynamically imports another feature using a configured path alias
- **THEN** the boundary check fails with actionable source/target diagnostics

#### Scenario: A valid workspace passes
- **WHEN** both applications and libraries follow the reviewed import matrix
- **THEN** their builds and boundary checks pass without blanket exclusions for feature directories

### Requirement: State has an owner and an authorised scope
Features SHALL own server queries/mutations through TanStack Query and local interaction state through signals. App platform SHALL supply context without owning business workflows. The initial integration SHALL support isolation and reset/detachment of protected client state when identity or organisation context changes, or sign-out/revocation signals occur. Public data SHALL remain separate from operational data. M0 SHALL verify these behaviours through test contexts without implementing production authentication or organisation workflows.

#### Scenario: Operational context changes
- **WHEN** a test changes identity or organisation context after filling a context-scoped cache and draft
- **THEN** the old protected data and draft cannot be observed or reused under the new context

#### Scenario: Another tab holds the old context
- **WHEN** one tab replaces the identity or organisation context
- **THEN** the other tabs of the same application reload and drop that context's data

#### Scenario: Access is revoked or the user signs out
- **WHEN** a test context emits sign-out or revocation
- **THEN** the configured state lifecycle prevents further use of that context's protected data

### Requirement: Presentation does not grant authority
Frontend context and permission presentation SHALL NOT replace API authorisation. Generated client code SHALL NOT decide workflow outcomes, own navigation/toasts/cache policy or retry non-idempotent writes automatically. Future feature contracts SHALL retain operation and revision metadata through their adapter; M0 SHALL NOT invent tournament write contracts to demonstrate the shell.

#### Scenario: A client receives transport acknowledgement
- **WHEN** a contract fixture distinguishes an accepted receipt from an applied result
- **THEN** the generated types preserve that distinction and the client does not convert the receipt into a completed business outcome
