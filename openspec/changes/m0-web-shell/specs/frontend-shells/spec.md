## Status

Target requirements for `m0-web-shell`, approved for implementation on 8 November 2026. Visuals and tooling are decided in design.md; implementation is in progress.

## ADDED Requirements

### Requirement: One workspace provides two application shells
The workspace SHALL provide an admin CSR application and a public/participant application using Angular standalone components and lazy route composition. Both SHALL consume the internal `ui` library and have their own app composition/platform boundaries. M0 SHALL implement only shell behaviour, a representative public page and development/test fixtures, without product workflows or an empty hierarchy of future features.

#### Scenario: Both shells build
- **WHEN** a clean checkout runs the documented production build commands
- **THEN** both applications build as distinct artifacts while sharing the same `ui` and generated-client libraries

#### Scenario: A visitor opens the M0 public page
- **WHEN** the representative public shell page is opened
- **THEN** it displays the reviewed shell/page without offering simulated tournament registration, results or sign-in as working product functionality

### Requirement: Public rendering is selected by route
Admin and authenticated participant workflows SHALL use CSR. Corporate/static public pages SHALL support SSG; dynamic public entry pages SHALL support SSR followed by browser interaction. M0 SHALL verify a representative prerendered page and hydration, plus SSR configuration through a non-domain fixture. Concrete API-backed tournament rendering, metadata and visibility/cache checks SHALL be delivered with the first public tournament feature.

#### Scenario: Initial content is available without JavaScript
- **WHEN** the representative static public route is requested without executing browser JavaScript
- **THEN** its built HTML contains the reviewed page content and metadata

#### Scenario: The public page hydrates
- **WHEN** the browser activates the representative prerendered page
- **THEN** reviewed controls become interactive without hydration errors or loss of the initial content

#### Scenario: A server-rendered fixture uses the selected runtime
- **WHEN** the non-domain SSR fixture is requested from the built public server output
- **THEN** it returns initial HTML through the server route while admin remains configured for CSR

#### Scenario: An unknown public URL is requested
- **WHEN** the public server receives a URL that matches no route
- **THEN** it renders a not-found page with HTTP status 404

#### Scenario: Server data reaches hydration once
- **WHEN** the SSR fixture fetches API data on the server and the browser hydrates the page
- **THEN** the browser reuses the transferred response and makes no repeat API request

#### Scenario: Fixtures stay out of production
- **WHEN** the public application is built for production
- **THEN** fixture routes and their code are absent and their URLs return 404

### Requirement: Server requests do not share mutable context
SSR SHALL isolate mutable providers, credentials and query state between requests. Shared public caches SHALL contain public data only. The reviewed generator/transport integration SHALL document its server-to-browser data-transfer mechanism and SHALL NOT assume that a generated fetch client participates automatically in Angular HttpClient transfer caching.

#### Scenario: Concurrent requests have different contexts
- **WHEN** two concurrent SSR test requests use distinct credentials/context markers and query data
- **THEN** neither rendered response nor request-local provider observes the other's protected state

#### Scenario: A feature sends credentials during server rendering
- **WHEN** a request made while rendering on the server carries an `Authorization` header or a cookie
- **THEN** the server transport strips them and the host receives an anonymous request

#### Scenario: Protected fixture data reaches a cache boundary
- **WHEN** a test renders protected context data alongside a public response
- **THEN** protected data is excluded from shared public cache entries and later public responses

### Requirement: Shared shell controls have reviewed states
The `ui` library SHALL contain only the shared controls/tokens required by the reviewed shells. Controls SHALL support SSR and the relevant default, hover, focus, pressed, disabled/loading and error states. A component/state catalogue SHALL be development tooling rather than a third product app. Shells SHALL preserve the documented square corners and spacing scale, meaningful keyboard focus and text-based error/status feedback.

#### Scenario: Both apps use a common control
- **WHEN** the same control is rendered in the admin and public shells
- **THEN** its semantics, focus and error behaviour are shared while its surrounding composition may differ

#### Scenario: The catalogue renders every control on the server
- **WHEN** the development-only catalogue is prerendered and hydrated
- **THEN** every shell control renders without server errors or hydration mismatches, and the catalogue is not part of either production artifact

#### Scenario: Keyboard and error recovery are exercised
- **WHEN** a reviewer navigates the shell and control fixtures using the keyboard and triggers an error
- **THEN** focus and reading order remain understandable, errors have text and an actionable recovery path, and valid entered data is preserved where applicable

### Requirement: Visual review precedes shell implementation
The implementation proposal SHALL reference supplied visuals for each affected shell and relevant state. Missing desktop/narrow, navigation, control or recovery states SHALL keep the change pending visual review. Review SHALL use Refactoring UI alongside the authoritative visual guide; concept images and the disposable prototype SHALL NOT establish production functionality or override domain semantics.

#### Scenario: A shell state lacks a reviewed reference
- **WHEN** implementation readiness is assessed and an affected shell/state remains uncovered
- **THEN** the gap is recorded and the change is not declared ready solely because its documents pass schema validation

#### Scenario: Desktop and narrow compositions are reviewed
- **WHEN** the shell visual gate is evaluated
- **THEN** hierarchy, grayscale/blur reading, spacing, readable status text, contrast, keyboard behaviour and narrow-screen navigation have recorded outcomes

### Requirement: Aspire starts both applications locally
The AppHost SHALL start both frontend development applications alongside the existing local services with explicit API base configuration and discoverable working URLs. Startup integration SHALL preserve the existing backend environment and SHALL NOT change messaging transport or create cloud resources.

#### Scenario: A developer starts the AppHost
- **WHEN** the documented combined local startup command runs with its prerequisites available
- **THEN** both web apps are reachable through their advertised URLs and target the configured Herald API
