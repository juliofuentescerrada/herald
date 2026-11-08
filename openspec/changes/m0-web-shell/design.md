## Status and context

**Draft; implementation and final shell visuals are not approved.** The authorised pre-development consolidation prepares this change without creating production code. ADR 0011 defines the direction; exact tooling and remaining visual states are reviewed before implementation. `m0-solution-skeleton` and `m0-messaging` are implemented and archived; this draft was updated on 8 November 2026 with what `m0-messaging` delivered (task 1.4).

Sources: [ADR 0011](../../../docs/adr/0011-angular-front-end-and-generated-api-contract.md), [roadmap](../../../docs/roadmap.md), [functional baseline](../../../docs/herald-functional-discovery.md), [visual direction](../../../docs/herald-visual-direction.md), [CLAUDE](../../../CLAUDE.md) and [OpenSpec context](../../config.yaml). Product scope follows ADR 0013; this technical foundation adds no H1/H2 capability.

## Scope and architecture

One Angular workspace contains two apps and separate `ui`/`api-client` libraries. Use standalone components and lazy routes. A feature is a functional boundary owning related routes, components, forms, queries, mutations and tests, not an Angular `NgModule`, a backend module replica or necessarily a library project. Add feature directories with their first behaviour; M0 does not create an empty H1–H7 hierarchy.

| Area | Owns | Permitted direction |
| --- | --- | --- |
| App composition/shell | Layout and route composition, visible context | Explicit feature entry points, own app platform/shared presentation, library public entry points |
| Feature | One cohesive user capability and its state | Own app platform/shared presentation, `ui`, `api-client`; no other feature or app |
| App platform | Context and API configuration | Narrow context/transport dependencies and `api-client`; no features |
| App-local shared presentation | Demonstrated reuse within that app | Presentation contracts and `ui`; no imports from features or the other app |
| `ui` | Common controls, tokens and interaction states | Presentation dependencies; no app, API client, query cache, session, permissions or routes |
| `api-client` | Generated types/client and chosen transport | Transport dependencies; no app, UI, navigation or business-state rules |

Composition may combine independent feature entry points. Features cannot import one another's public entry points as an escape hatch. Internal library paths are private. Boundary tooling covers relative paths, aliases, barrel exports and dynamic route imports and discovers new features automatically. Temporary fixtures prove forbidden imports fail; they do not add production features.

## State and authority

TanStack Query owns server queries/mutations; signals own local UI state such as selection and drafts. Platform supplies identity/organisation context through narrow contracts without adding a central business-service layer. The first H1 features define their concrete keys, lifetimes and invalidation. M0 establishes a testable integration that isolates identity/organisation contexts and clears or detaches protected state on context replacement, sign-out or revocation signals. Test contexts are fixtures, not working authentication or organisation switching.

Generated code owns no toasts, navigation, query cache or workflow decisions. API authorisation remains authoritative. Future features distinguish transport receipt from applied outcome and current projections; the client preserves operation/revision metadata supplied by their contracts. M0 neither invents tournament command contracts nor automatically retries unsafe mutations.

## Rendering and startup

| Surface | Rendering target | This change verifies |
| --- | --- | --- |
| Admin | CSR | Shell build and browser bootstrap |
| Corporate/public static pages | SSG | One representative shell page has HTML before JavaScript and hydrates |
| Dynamic public tournament/discovery entry pages | SSR then browser interaction | SSR route/provider configuration with a non-domain test fixture; real API-backed pages follow their feature changes |
| Participant workflows and live interaction | CSR | Route-mode separation; no participant workflow is implemented |

Mutable providers, credentials and query clients must be request-scoped when used by SSR. No protected data enters a shared public cache. An isolated concurrent-request test fixture checks that contexts are not shared. The generator/transport decision must state how server data reaches hydration: a generated fetch client must not be assumed to participate in Angular HttpClient transfer caching. The first API-backed public tournament page adds the concrete transfer, metadata, private/unlisted visibility and cache tests. M4 supplies the eventual runtime and measures cold starts; this change creates no cloud resources.

Aspire starts both app development processes with explicit API base configuration and reachable URLs, alongside the existing services: PostgreSQL, the Azure Service Bus emulator and the host. Document separate frontend build/test commands and combined local startup. Production builds remain independent artifacts; the public build includes the selected server output as well as static assets.

## OpenAPI: what `m0-messaging` delivered and what this change owns

`m0-messaging` (archived, merged in #3) delivered the endpoint description this change builds on, specified by `api-description`:

- `Herald.ModuleHosting`'s `AddHeraldApi`/`MapHeraldApi` register Wolverine's HTTP endpoints and `Microsoft.AspNetCore.OpenApi` 10.0.14. A probe-module test proves a Wolverine endpoint appears with its route, method and response type, and a host test proves the host serves the document.
- The host serves it at `/openapi/v1.json` in **Development only**; what Azure exposes is decided in M4.
- No module has an endpoint yet, so the real document has no paths: generation needs the fixtures below until H1's first endpoint.

Constraints it leaves for the export (W-04):

- **Starting the host needs PostgreSQL.** Wolverine runs in `Balanced` durability mode and registers its node in the database at start-up. An export that starts the host (for example, requesting `/openapi/v1.json` from a running or test host) needs a database; one that only builds the host does not. Building the host also needs the `herald` and `messaging` connection strings, which `appsettings.Development.json` supplies locally.
- **A candidate that builds without starting:** `Microsoft.Extensions.ApiDescription.Server` writes the document during `dotnet build` by building the host without starting it. Verify in W-04 that it works with `RunJasperFxCommands`, Wolverine's endpoints and no database; otherwise choose an export that starts a host against a disposable database, and record why.
- **Existing patterns to reuse:** the host sets `RunWorkingDirectory`, so `dotnet run --project src/Herald.Host -- <command>` runs from its folder; CI already regenerates Wolverine's code and fails on any changed, deleted or new file (`codegen delete`, `codegen write`, then `git diff` plus untracked files). The OpenAPI and client drift check follows the same shape and message style.

Ownership: this change owns exporting the document at build time, TypeScript generation, the drift check, and the edits these need in the host, AppHost and CI. It extends the existing description pipeline (`AddHeraldApi`) rather than adding a second one, does not describe Wolverine endpoints by hand, and does not change messaging, transport or the `api-description` behaviour.

Generation must run reproducibly from a clean checkout with pinned tools and configuration. The checked-in OpenAPI document and generated client are regenerated in CI; differences fail with actionable file names. Document whether export starts the host and how it avoids deployment credentials, schema mutation and external services solely for generation. Use test fixtures for representative request, response and error types while production endpoints do not yet exercise them. Generator output adapts through public entry points; handwritten workflow logic does not enter generated files.

## Visual input and review gate

Apply Refactoring UI while preserving the visual guide's confirmed square corners and 4/8/12/16/24/32/48/64 spacing scale. The neutral competition direction is confirmed; do not promote the lime accent or exact compositions from proposal to approval. Review hierarchy in grayscale and blur, spacing, readable states, focus and contrast. Use the guide's typography and accessibility targets; an image cannot prove keyboard or screen-reader behaviour.

| Surface/state | Existing reference | Remaining review |
| --- | --- | --- |
| Admin shell, wide and narrow | [Current prototype](../../../prototypes/frontend/index.html), [corrected operational concept](../../../docs/assets/mockups/herald-match-outcomes-and-standings.png) | Extract shell-only layouts; context visibility, navigation, keyboard focus and narrow layout |
| Public shell and representative static page | [Discovery concept](../../../docs/assets/mockups/herald-tournament-discovery.png), current prototype | Review shell/page without implying working discovery, sign-in or registration; narrow navigation and hydration/loading presentation |
| Shared shell controls/catalogue | Visual direction §§5 and 10; prototype controls | Default, hover, focus, pressed, disabled/loading where relevant; empty/error/retry fixtures and valid input preservation |
| Failure and context recovery | Functional/visual contracts | Offline/API unavailable, failed route load, missing context, context replacement and accessible error recovery |

The earlier [round-management image](../../../docs/assets/mockups/herald-round-management.png) is superseded for result semantics and is not the current functional reference. The prototype is disposable; its illustrative authority and in-memory state are not implementation evidence. Do not include tournament editor, team roster, result or finalisation screens in M0 to fill visual gaps.

Reuse the supplied references where sufficient. Missing states remain explicitly pending visual input/review before implementation, as required by CLAUDE and OpenSpec context. No new request for implementation approval is implied by preparing this draft. Record the agreed shell/state references here when that review occurs.

## Decisions required before implementation

| ID | Decision | Evidence needed |
| --- | --- | --- |
| W-01 | Workspace location, package manager and pinned Node/Angular/tool versions | Compatibility, free-use licences, reproducible local/CI builds |
| W-02 | Boundary-check tooling and public-entry conventions | Negative fixtures covering aliases, dynamic imports, barrels, deep imports and new features |
| W-03 | Component foundation and catalogue tooling | SSR support, keyboard/focus/error states, required shell controls only, reviewed visuals |
| W-04 | OpenAPI export mechanism, generator, transport and artifact paths | Export without starting the host (or a recorded reason), Wolverine endpoints included, typed errors, deterministic output, SSR/request-scoping and hydration plan |
| W-05 | Concrete route render modes and Aspire integration | Representative SSG/hydration, SSR fixture, CSR app bootstrap and both local URLs |
| W-06 | State scope and reset mechanism | Concurrent SSR isolation and client identity/organisation-change fixtures without production auth |

Exact library/generator versions and a component foundation are deliberately unselected. These draft requirements are proposed targets, not evidence that the choices or implementation are approved.

## Validation and completion

Before implementation: resolve W-01–06, review affected shell states and approve the bounded change. During implementation: compile both apps, check library imports and negative fixtures, verify deterministic API/client generation, render at desktop/mobile widths and exercise keyboard/error recovery, run SSG/hydration and concurrent-request isolation fixtures, and start both apps through Aspire. Record actual commands, versions and results here. Archive only after the tasks and acceptance scenarios are complete; schema validation alone is not completion.

Document validation on 8 November 2026, after recording what `m0-messaging` delivered: `openspec validate m0-web-shell --strict` passed. This checks proposal structure only; review gates 1.1–1.3 and every implementation task remain open.
