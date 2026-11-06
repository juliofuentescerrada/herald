# 0011. An Angular front end, with the API contract generated from OpenAPI

- Status: Proposed
- Date: 2026-11-06

## Context

Herald needs screens for organisers (create a tournament, close registration, confirm results) and for players and spectators (register, report a result, follow the standings live). The maintainer works with Angular, and the front end should show a modern Angular codebase. Response types written by hand drift from the API.

The public experience also includes a product landing page, mission, how it works, terms and privacy, alongside discovery and tournament pages. Public entry pages need initial HTML and page-specific metadata for search and shared links; authenticated workflows have different rendering needs.

## Decision

- **Angular** with standalone components and signals, organised by feature, with lazy routes; features don't import each other.
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
- Follow-ups: the UI component approach, generator and concrete hybrid route configuration in `m0-web-shell`; API data transfer/hydration, metadata and visibility/cache checks with the first public tournament page; runtime placement, cache policy and cold-start measurements in M4.

## References

- [Angular server-side and hybrid rendering](https://angular.dev/guide/ssr).
- [Astro islands architecture](https://docs.astro.build/en/concepts/islands/).
- [Angular libraries](https://angular.dev/tools/libraries).
