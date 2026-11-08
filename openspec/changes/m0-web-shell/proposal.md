## Status

**Draft, prepared 7 November 2026. Not approved for implementation.** This proposal records the frontend foundation described by ADR 0011. Toolchain choices and shell/state mockups still need review. Validation of these documents does not satisfy those gates.

## Why

The implemented M0 skeleton has no production Angular workspace. H1 needs an organiser shell and a public experience with common controls, enforceable feature boundaries and a client generated from the API contract. Defining those foundations together prevents UI duplication, cross-feature coupling and handwritten API types before the first product feature.

## What Changes

- One Angular workspace with standalone components and lazy routes, containing an admin CSR application and a public/participant application with selective SSG, SSR and CSR route modes.
- An internal `ui` library for shared presentation, tokens and accessible controls, separate from generated `api-client`. Add only the controls the shells need and a component/state catalogue as development tooling.
- App composition, functional features, app platform and app-local shared presentation have explicit import boundaries. CI rejects forbidden imports, including aliases, dynamic imports and access to library internals.
- TanStack Query owns server state and signals own local interaction state. Establish context-scoped configuration and request isolation without implementing sign-in, organisation administration or tournament workflows.
- The host build exports OpenAPI and a reviewed generator creates committed TypeScript contracts/client. CI detects drift. It builds on the endpoint description `m0-messaging` delivered (`AddHeraldApi`, `/openapi/v1.json` in Development); messaging and transport are outside this proposal.
- Aspire starts both web apps alongside the existing local services. Verify both builds, a representative public prerendered page and browser hydration. Establish the public SSR configuration; API-backed tournament rendering and visibility/cache acceptance belong to the first public tournament feature.

Out of scope: H1 tournament functionality, production authentication flows, discovery, registration, team management, results, corporate/legal content beyond the representative shell page, live subscriptions, cloud deployment, a third product application, a complete component system and messaging transport changes. The disposable HTML prototype is a visual reference, not production source to migrate.

## Capabilities

### New Capabilities

- `frontend-boundaries`: feature, composition, platform and shared-library dependency rules, plus ownership and isolation of client state.
- `frontend-shells`: two shells, selective public rendering, a minimal shared UI foundation, visual/state review and local Aspire startup.
- `generated-api-client`: build-time OpenAPI export, generated client boundaries and reproducible drift checks.

### Modified Capabilities

None. The new checks extend frontend build and CI coverage without replacing the implemented backend boundary or local-environment specifications. `m0-messaging` is archived: this change edits the host build, AppHost and CI for its own export and checks, extending `api-description` rather than replacing it.

## Impact

New production frontend workspace, `ui` and `api-client` libraries, generated OpenAPI/client artifacts and frontend checks when implemented. The workspace location, package/runtime versions, generator/transport, component foundation, catalogue and boundary-check tooling remain named decisions in `design.md`. AppHost and CI need additive integration. ADR 0011 and the roadmap are updated with verified outcomes at completion; this draft does not mark them implemented.

Affected visual surfaces are the admin shell, public shell/representative page and shared control catalogue. Existing concepts cover direction, but not every required shell state. See the visual input matrix and review gate in `design.md`.
