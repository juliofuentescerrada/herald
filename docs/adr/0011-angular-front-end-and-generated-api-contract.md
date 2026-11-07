# 0011. An Angular front end, with the API contract generated from OpenAPI

- Status: Proposed
- Date: 2026-11-06
- Consolidated: 2026-11-07

## Context

Herald needs screens for organisers (create a tournament, close registration, confirm results) and for players and spectators (register, report a result, follow the standings live). The maintainer works with Angular, and the front end should show a modern Angular codebase. Response types written by hand drift from the API.

The public experience also includes a product landing page, mission, how it works, terms and privacy, alongside discovery and tournament pages. Public entry pages need initial HTML and page-specific metadata for search and shared links; authenticated workflows have different rendering needs.

## Decision

- **Angular** with standalone components and signals, organised by functional feature, with lazy routes; features do not import other features. A feature owns related routes, components, forms, queries, mutations and tests. "Feature module" means this functional boundary, not a requirement for `NgModule` or a separate library project.
- **One workspace, two applications:** organiser/admin and public/participant. Corporate pages live in the public app under their own layout. Shared libraries hold visual components, design tokens and the generated API client; business features remain within their app. No separate corporate framework.
- **An internal `ui` library from M0:** both apps consume the same semantic tokens, typography, common controls and interaction states. It is a library project, not a third product application; it is kept in this workspace without npm publication or independent versioning. Keep the generated `api-client` in a separate library.
- **Local components remain local:** feature components live with their feature; an app-local `shared` area is only for components used across features of that app. Navigation, corporate layouts, discovery filters, round management and registration forms stay in their app. Extract domain display components only when both apps demonstrate the same contract; do not generalise every screen in advance.
- **UI dependency boundary:** apps depend on `ui`; `ui` never imports either app or the API client and knows nothing about sessions, permissions or app routes. Components receive data and emit events, support SSR, and provide consistent keyboard/focus, error, disabled and loading behaviour where applicable. Compact/comfortable density variants serve the two experiences without duplicating controls.
- **A component catalogue is a development tool:** add it alongside the first implemented controls and their relevant states, rather than creating a third product app or a complete component system in M0. Storybook is a candidate; the exact tool and its Angular compatibility are checked in the change that introduces it. Choosing an external component foundation versus our own controls remains a separate decision.
- **Hybrid rendering by route:**

  | Surface | Rendering |
  |---|---|
  | Landing, mission, how it works, terms and privacy | Build-time prerendering (SSG) |
  | Organiser/admin app | Client-side rendering (CSR) |
  | Participant account, registration, teams and match actions | CSR |
  | Public tournament pages and initial discovery view | Server-side rendering (SSR), then client-side navigation and interaction |
  | Live standings and results | Client-side updates; public pages may include an initial SSR snapshot |

  Corporate content is regenerated on deployment. Tournament publication and edits must not require a frontend rebuild. SSR supplies initial public content and metadata; filtering and subsequent interactions use the API in the browser. Only deliberate catalogue entry pages are candidates for indexing, not every filter combination.
- **Anonymous public rendering:** shared caches contain only public information. Unlisted pages remain accessible by link but are excluded from discovery, sitemaps and indexing. Private tournament reads require API authorisation and never enter public HTML or shared caches. Credentials and request-specific state, including query caches, are isolated between SSR requests. Displayed capacity is informative; the API decides admission.
- **TanStack Query** for server state; signals for local state.
- **The API contract is generated:** building the host writes the OpenAPI document, and the TypeScript types and client are generated from it; both are committed, and CI fails if they are stale.
- **Live standings** through a push channel (SignalR or server-sent events), decided in the change that adds it.
- Unit tests with Vitest and Testing Library (ADR 0010).
- **M0 scope:** create both app shells and the internal UI library, consume it from both shells, and add only the shared pieces those shells need. Configure public hybrid rendering and verify a representative prerendered page and hydration. Verify API-backed SSR with the first public tournament page. The complete corporate site and discovery flows are outside M0; hosting must support the eventual SSR runtime (ADR 0012).

### Composition and dependency boundaries

Frontend features follow user capabilities, not a mandatory copy of backend modules or one folder per endpoint. Tournament preparation, entry management and competition operations are examples; their final size is refined with the first journey. Related result entry and round operations may initially be one feature. Create folders with their first implementation, not an empty H1–H7 hierarchy.

| Area | Responsibility and permitted direction |
| --- | --- |
| App composition and shell | Own layout, route composition and organisation context presentation; access explicit feature entry points and app platform; no central business-service layer |
| Feature | Own its UI, requests, queries/mutations and interaction state; use app platform, app-local shared presentation, `ui` and `api-client`; no imports from another feature or the other app |
| App platform | Session, organisation context and API configuration; expose narrow context/transport capabilities without importing features |
| App-local shared presentation | Components actually reused within this app; depend on presentation contracts and `ui`, not features or their stores |
| `ui` | Common presentation, controls, tokens and accessibility behaviour; no API client, query cache, sessions, permissions, app routes or app imports |
| `api-client` | Generated public contracts/client and authorised transport dependencies; no UI, navigation, application state or workflow rules |

A composed rounds-and-standings surface either belongs to one cohesive feature or is composed above independent feature entry points. A feature cannot reach into another feature's private state or import its public API as a workaround. Do not use app-local `shared` as an automatic destination for anything with two callers.

Import checks enforce the matrix from the first workspace, covering relative imports, aliases, dynamic route imports and access to another library's internals. New features are covered automatically. Feature entry points are available to app composition only; libraries expose explicit public entry points. The implementation change chooses tooling without requiring a specific workspace framework.

### State, authority and contracts

Each feature owns its server queries and mutations through TanStack Query; signals hold local interaction state such as selection and drafts. The app platform supplies identity/organisation context. Define state lifetime and invalidation for sign-out, identity change, organisation switch and permission revocation. Scope data to its authorised context; public cache entries are separate from operational data. Frontend permission presentation never replaces API authorisation.

The generated client owns no toasts, routing or business cache policy. Feature code adapts responses to its UI, including typed validation, permission, state and revision errors. A retry preserves operation identity; changed intent or a stale revision requires re-reading and review. Display received/applied/rejected outcomes accurately instead of treating transport acknowledgement as a completed admission or result.

The generator/transport decision specifies how data is transferred from SSR to the browser. Do not assume a generated fetch-based client participates automatically in Angular's HttpClient transfer cache. Isolate mutable providers, credentials and query clients between SSR requests; test concurrent requests and hydration with the selected integration. Route-level dependency injection is an organisation mechanism, not a security boundary.

**Implementation status:** production Angular code has not been created. The disposable prototype is a visual reference, not the seed architecture or proof of SSR/authentication. The `m0-web-shell` proposal establishes the shells and these boundaries; individual H1 feature proposals add behaviour and their reviewed visual states.

## Alternatives considered

- **React or Blazor:** both capable; Angular is what the maintainer would lead in a team, so that is what the reference shows.
- **Pure SPA everywhere:** simplest development and static hosting, but public content and metadata depend on JavaScript execution. Keep CSR for operational workflows.
- **SSR everywhere:** adds server rendering and compatibility constraints to authenticated screens without a clear benefit.
- **SSG for every public page:** cheap to serve, but rebuilding on each tournament publication or edit couples product operations to frontend delivery.
- **Astro for corporate content, Angular for portals:** lighter editorial pages and independent publishing, at the cost of another framework, build pipeline and component system. The initial landing and explanatory/legal pages do not justify that cost, and public tournament SSR still needs solving in Angular. Revisit if substantial editorial content or independent editorial ownership emerges.
- **Hand-written API types:** less tooling, guaranteed drift.
- **Only app-local shared components:** less initial structure, but duplicates common controls and lets styling and accessibility drift between portals.
- **Put all components in one common library:** encourages reuse but couples unrelated workflows and creates excessive configuration. Share a small foundation and extract further components from demonstrated use.
- **A custom catalogue app from M0:** adds another application to maintain before there are controls to review. Introduce a catalogue as development tooling with the first controls.
- **NgRx for all state:** a lot of structure for state that is mostly server state, which TanStack Query already caches.

## Consequences

- Positive: a front end and back end that can't silently disagree; a codebase organised the way the back end is, by feature.
- Negative: code generation adds a build step and generated files to review.
- Positive: one frontend stack, with initial HTML for public entry pages and client-side interaction for operational workflows; corporate content can be served statically.
- Negative: two app builds and an SSR runtime alongside the .NET API. Hydration, browser-API compatibility, request isolation and caching need verification; API latency and cold starts can delay the first public response.
- Positive: shared UI behaviour and accessibility with independent portal compositions. Negative: shared UI changes need checking in both apps; the library boundary and catalogue require maintenance.
- Follow-ups: `m0-web-shell` chooses the component foundation, generator/transport and route configuration, and adds boundary/build checks. The first H1 features define data lifetimes, write/retry contracts and concrete composition. The first public tournament page verifies API data transfer/hydration, metadata and visibility/cache isolation. M4 decides runtime placement and measures cold starts.

## References

- [Angular server-side and hybrid rendering](https://angular.dev/guide/ssr).
- [Astro islands architecture](https://docs.astro.build/en/concepts/islands/).
- [Angular libraries](https://angular.dev/tools/libraries).
- [Angular style guide: feature organisation](https://angular.dev/style-guide).
