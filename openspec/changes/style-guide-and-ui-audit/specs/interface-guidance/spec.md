## ADDED Requirements

### Requirement: Component guidance covers the public UI inventory
Herald SHALL maintain a UI style-guide entry point linked to its existing numeric visual foundations. Its component guidance SHALL cover the intent, selection alternatives, supported API, state ownership, accessibility and examples of every public UI control/service and distinguish native, app-local and future patterns from exported controls.

#### Scenario: A public UI export is documented
- **WHEN** an agent checks the component guide against the `@herald/ui` public API
- **THEN** every runtime export and exported type is represented, each control/service has an intent and integration contract, and a newly undocumented export makes the inventory check fail

### Requirement: Icon guidance covers meanings and accessible use
Herald SHALL maintain a meaning table for every registered icon and guidance for placement, size, stroke, labels, decorative/standalone semantics and adding an icon. It SHALL preserve the confirmed ordinary-admin-action exclusion and the reviewed drawer-back exception.

#### Scenario: A registered icon is documented
- **WHEN** an agent checks the icon guide against the typed registry
- **THEN** every registered name and size has a documented use, and a missing meaning makes the inventory check fail

### Requirement: Audience patterns cover the H2 public and participant experience
The UI guidance SHALL document distinct organiser and participant UX archetypes, anonymous public browsing and represented-team context using shared design foundations. It SHALL cover H2 discovery/detail, account return, own entries/check-in, next-match work, teams, reports/disputes, notices/history and bounded-automation communication as design targets. It SHALL map the supplied UX document's exploratory feature aspirations to current scope or explicit future decisions without changing D-30–38 statuses or presenting H2 as implemented. UI agent entry points SHALL route to these patterns.

#### Scenario: An agent designs an H2 public or participant task
- **WHEN** an agent follows the UI guidance for a public or signed-in participant/representative screen
- **THEN** the experience patterns identify its audience, task hierarchy, states and authority boundaries, preserve the shared foundations, and distinguish H2 targets and source aspirations from implemented/confirmed capabilities

### Requirement: Existing screens receive a traceable conformance review
A UI guidance change SHALL include a dated review of existing admin/public routes, shell/access states, overlays and the catalogue. The review SHALL identify the inspected revision, states, references, methods and coverage limits and classify findings with rule, evidence, concrete failure, severity, correction and disposition. It SHALL distinguish production, development fixtures and future prototypes and SHALL NOT imply that source-only inspection passed browser or composed E2E checks.

#### Scenario: Reading the existing-screen review
- **WHEN** a maintainer reads the review linked from the style guide
- **THEN** the inventory, findings, actually executed checks and remaining verification are explicit, and production remediation remains separate from documentation delivery
