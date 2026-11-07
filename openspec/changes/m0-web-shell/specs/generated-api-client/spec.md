## Status

Draft target requirements for `m0-web-shell`. The generator, transport, exact versions and export paths are unselected until review.

## ADDED Requirements

### Requirement: The host build exports the authoritative API contract
The reviewed host build target SHALL write an OpenAPI document from the host's actual endpoint descriptions, including Wolverine endpoints supplied by `m0-messaging`. Generation SHALL NOT rely on a frontend-authored substitute schema. The export command and build ordering SHALL be documented and reproducible without deployment credentials, schema mutation or external services solely for contract generation.

#### Scenario: The host contract is exported
- **WHEN** the documented export command runs after endpoint-description support is available
- **THEN** the output describes the available endpoints with their routes, methods and declared request/response/error types

#### Scenario: The messaging prerequisite is not ready
- **WHEN** Wolverine endpoint-description integration is unavailable
- **THEN** the integration task remains pending rather than introducing handwritten duplicate endpoint definitions

### Requirement: TypeScript contracts and client are generated reproducibly
A pinned generator and checked-in configuration SHALL generate TypeScript contracts/client from the exported OpenAPI document. The document and generated output SHALL be committed. Two runs with unchanged inputs SHALL produce no diff. Generated files SHALL contain no handwritten workflow code.

#### Scenario: Regeneration is stable
- **WHEN** generation runs twice from unchanged host source and tool configuration
- **THEN** the OpenAPI and client outputs are identical

#### Scenario: A representative contract is generated
- **WHEN** fixtures exercise the supported request, response and typed-error shapes
- **THEN** the generated client compiles and preserves those declared types without handwritten replacements

### Requirement: CI detects stale generated artifacts
CI SHALL regenerate the OpenAPI document and client with the pinned tools and fail if committed artifacts differ. Diagnostics SHALL identify stale outputs and the documented regeneration command. The checks SHALL run after the host contract prerequisite and before accepting the change.

#### Scenario: An API change leaves stale client code
- **WHEN** a declared endpoint contract changes without corresponding generated updates
- **THEN** CI fails and identifies the stale document or client artifacts

#### Scenario: Committed artifacts match the contract
- **WHEN** regeneration produces no differences and both applications compile against the generated public client API
- **THEN** the drift check passes

### Requirement: Generated transport is independent of presentation and business state
`api-client` SHALL expose public contracts/client and the reviewed transport configuration without importing either app, UI, routing, session stores or query caches. Application code SHALL supply authorised context through the selected integration rather than global mutable generated-client state. The browser and server integration SHALL preserve declared metadata and typed errors without treating transport success as business completion.

#### Scenario: Browser and server contexts use the client
- **WHEN** browser and isolated server test contexts instantiate the reviewed client integration
- **THEN** each uses its supplied base URL/authorised transport context without cross-request credentials or app/UI dependencies in generated code

#### Scenario: An error or revision is returned
- **WHEN** a fixture response includes declared validation, permission or revision metadata
- **THEN** the generated types expose it to the caller without navigation, toasts or hidden business retry policy

### Requirement: Contract generation is coordinated without transport changes
This change SHALL coordinate OpenAPI export/build and shared host/AppHost/CI edits with `m0-messaging`. It SHALL NOT select, revise or validate messaging transport as part of frontend generation. The first public API-backed feature SHALL verify its concrete SSR data transfer and hydration with the chosen generated client.

#### Scenario: The frontend contract work is integrated
- **WHEN** `m0-web-shell` and `m0-messaging` changes are combined
- **THEN** endpoint description and generation have one documented ownership/build sequence without duplicate schema sources or frontend-driven transport changes
