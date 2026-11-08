## Status

**Approved for implementation on 8 November 2026.** Prepared 7 November 2026. The maintainer confirmed the shell-only scope (gate 1.1) after the shell-state visuals were approved (gate 1.2) and W-01–W-06 were decided (gate 1.3); see `design.md`. Implementation starts with the workspace, then the W-03 experiment (task 3.1).

## Why

The implemented M0 skeleton has no production Angular workspace. H1 needs an organiser shell and a public experience with common controls, enforceable feature boundaries and a client generated from the API contract. Defining those foundations together prevents UI duplication, cross-feature coupling and handwritten API types before the first product feature.

## What Changes

- One Angular workspace with standalone components and lazy routes, containing an admin CSR application and a public/participant application with selective SSG, SSR and CSR route modes.
- An internal `ui` library for shared presentation, tokens and accessible controls, separate from generated `api-client`. Add only the controls the shells need and a component/state catalogue as development tooling.
- App composition, functional features, app platform and app-local shared presentation have explicit import boundaries. CI rejects forbidden imports, including aliases, dynamic imports and access to library internals.
- TanStack Query owns server state and signals own local interaction state. Establish context-scoped configuration and request isolation without implementing sign-in, organisation administration or tournament workflows.
- The host exports public and admin OpenAPI documents and a reviewed generator creates committed TypeScript contracts/clients for each. CI detects drift. It builds on the endpoint description `m0-messaging` delivered (`AddHeraldApi`, `/openapi/v1.json` in Development); messaging and transport are outside this proposal.
- Aspire starts both web apps alongside the existing local services. Verify both builds, a representative public prerendered page and browser hydration. Establish the public SSR configuration; API-backed tournament rendering and visibility/cache acceptance belong to the first public tournament feature.

Out of scope: H1 tournament functionality, production authentication flows, discovery, registration, team management, results, corporate/legal content beyond the representative shell page, live subscriptions, cloud deployment, a third product application, a complete component system and messaging transport changes. The disposable HTML prototype is a visual reference, not production source to migrate.

## Capabilities

### New Capabilities

- `frontend-boundaries`: feature, composition, platform and shared-library dependency rules, plus ownership and isolation of client state.
- `frontend-shells`: two shells, selective public rendering, a minimal shared UI foundation, visual/state review and local Aspire startup.
- `generated-api-client`: OpenAPI export without starting the host, generated client boundaries and reproducible drift checks.

### Modified Capabilities

- `api-description`: the one document becomes two, public and admin, and every endpoint belongs to exactly one (W-04). The other implemented specifications are unchanged; this change edits the host, AppHost and CI for its own export and checks.

## Impact

New production frontend workspace, `ui` and `api-client` libraries, generated OpenAPI/client artifacts and frontend checks when implemented. The workspace location, package/runtime versions, generator/transport, component foundation, catalogue and boundary-check tooling remain named decisions in `design.md`. AppHost and CI need additive integration. ADR 0011 and the roadmap are updated with verified outcomes at completion; this draft does not mark them implemented.

Affected visual surfaces are the admin shell, public shell/representative page and shared control catalogue. Existing concepts cover direction, but not every required shell state. See the visual input matrix and review gate in `design.md`.
