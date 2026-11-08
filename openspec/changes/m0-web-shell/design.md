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
| W-01 | Workspace location, package manager and pinned Node/Angular/tool versions | **Decided 2026-11-08**, below |
| W-02 | Boundary-check tooling and public-entry conventions | **Decided 2026-11-08**, below |
| W-03 | Component foundation and catalogue tooling | **Decided 2026-11-08, pending the experiment in task 3.1**, below |
| W-04 | OpenAPI export mechanism, generator, transport and artifact paths | Export without starting the host (or a recorded reason), Wolverine endpoints included, typed errors, deterministic output, SSR/request-scoping and hydration plan |
| W-05 | Concrete route render modes and Aspire integration | Representative SSG/hydration, SSR fixture, CSR app bootstrap and both local URLs |
| W-06 | State scope and reset mechanism | Concurrent SSR isolation and client identity/organisation-change fixtures without production auth |

### W-01: workspace, package manager and versions (decided 2026-11-08)

- **Location:** one Angular CLI workspace in `web/` at the repository root, beside the .NET `src/` and `tests/`: the two ecosystems build and test separately, and CI runs them as separate steps. The apps and libraries are workspace projects (`web/projects/admin`, `web/projects/public`, `web/projects/ui`, `web/projects/api-client`), created without a default application.
- **Package manager:** pnpm 12, pinned exactly in `web/package.json` (`"packageManager": "pnpm@12.18.0"`), with `pnpm-lock.yaml` committed and `pnpm install --frozen-lockfile` in CI; CI installs that exact pnpm from `packageManager`. Chosen by the maintainer over npm for its strict handling of undeclared dependencies; the import matrix is W-02's. pnpm 12 fails an install (`ERR_PNPM_IGNORED_BUILDS`) when a dependency has install scripts that are not approved: Angular's toolchain brings `esbuild`, `lmdb`, `@parcel/watcher` and `msgpackr-extract`, so the workspace lists the approved ones explicitly (`pnpm approve-builds`, recorded in `pnpm-workspace.yaml`), and each new one is a reviewed change.
- **Node:** 26, the Active LTS (supported until April 2029), in `web/.nvmrc`, read by local version managers and by CI's `node-version-file`; `engines.node` is `>=26 <27`, enforced (`engine-strict`). Locally, Node 26 is installed alongside 24 with nvm.
- **Angular:** 22.2.5, the current stable (`@angular/*`, `@angular/ssr`, `@angular/cli`, `@angular/build`), with the CLI's ranges in `package.json` and exact resolution in the lockfile. Angular 23 is not yet a release candidate; moving to it is an `ng update` in a change of its own, not a reason to wait.
- **TypeScript:** 6.0.x, because Angular 22.2 requires `>=6.0 <6.1`; TypeScript 7 waits for Angular's support. **Tests:** Vitest 5, Angular 22's default test runner, not a separate choice.
- **Licences:** Angular, `@angular/ssr`, pnpm, Node and Vitest are MIT; TypeScript is Apache-2.0. The full transitive licence check runs when the workspace is created (task 2.1), as in `m0-messaging`.
- **Evidence** (throwaway scaffold, 2026-11-08, nothing committed): `ng new --ssr` with Angular CLI 22.2.5 and pnpm 12.18.0 created the workspace and passed its tests (2 of 2) in a `node:26` (26.13.0) container; the container could not complete `ng build` within Docker Desktop's 1.92 GB, so the build was checked on Node 24.15: browser and server bundles, one prerendered route, no blocked install scripts. Repeat the build on Node 26 when the workspace is created.
- **Rejected:** npm (bundled with Node, the CLI default and what the sibling Arcana uses; pnpm's stricter dependency handling was preferred); `src/web/` (mixes two toolchains under the .NET source root); Node 24 (maintenance LTS until April 2028, which H1–H3 would outlive).

### W-02: boundary checks and public entry points (decided 2026-11-08)

- **Tool:** `eslint-plugin-boundaries` 7.4 (MIT) in the workspace's ESLint 10 configuration, with `typescript-eslint` 8 as parser and `eslint-import-resolver-typescript` 4.4 (ISC) so path aliases resolve like the compiler. Violations are ordinary ESLint errors: in the editor, in `ng lint` and in CI.
- **Classification by folder, most specific first,** per app: `features/<feature>` (the feature name is captured), `platform`, app-local `shared`, then the app's own folder as composition and `src` as bootstrap; the `ui` and `api-client` libraries are elements of their own. A file belongs to the first descriptor that matches its folder. `no-unknown-files` and `no-unknown-dependencies` reject anything outside the classification, so a stray barrel or folder cannot become a back door.
- **Policies, default `disallow`,** written once with the captured names, so a new feature folder is covered without editing the configuration: composition may use features, platform, shared presentation and libraries; a feature may use its app's platform, shared presentation and the libraries, never another feature, the composition or the other app; platform and shared presentation may use the libraries; `ui` and `api-client` use neither app nor each other. Dependencies inside one element are not checked.
- **Public entry points:** every feature, `platform` and `shared` folder exposes an `index.ts`, and other elements may import only that file (`fileInternalPath: 'index.ts'` in the policies). Libraries are imported only through their package alias (`@herald/ui`, `@herald/api-client`), which maps to their public entry; no wildcard alias exists, so an import of a library's internals does not resolve and fails as an unknown dependency.
- **Evidence** (throwaway workspace from W-01, Node 26.13.0, 2026-11-08, nothing committed): with features `alpha`, `beta`, `gamma`, a `platform` and a simulated `ui` library, ESLint reported exactly the eight planted violations and nothing else: a feature reaching another feature by relative path, by path alias, through a barrel and through `import()`; a deep import into `ui`'s internals; a feature importing the composition; `gamma`, added after the configuration was written, importing `alpha`; and the composition importing a feature's internal file. The composition's routes with `loadChildren` to a feature's `index.ts`, the bootstrap files and a feature using its own helper, `platform` and `ui` produced none. A dependency between the two apps uses the same captured-name mechanism but was not part of the experiment; the workspace's own fixtures cover it.
- **In the workspace:** the negative fixtures live in a lint test that expects each planted violation and fails if one stops being reported, so a rule that silently stops matching breaks CI; they are not production features (task 2.3).
- **Rejected:** Sheriff (`@softarc/sheriff-*` 0.20, MIT), designed for Angular feature boundaries but still pre-1.0; `dependency-cruiser` 18 (MIT), whole-graph checks with no editor feedback and a second configuration language; Nx module boundaries, which need an Nx workspace and treat projects, not feature folders, as the unit; ESLint's `no-restricted-imports`, which cannot express "any other feature" without listing every feature.

### W-03: component foundation and catalogue (decided 2026-11-08, pending the experiment in task 3.1)

- **Foundation:** `ng-primitives` 0.131.4 (Apache-2.0), headless: it ships no styles, so Herald's tokens, square corners and spacing scale apply without overriding a theme. It supports SSR and zoneless applications, Angular 21 and 22, and brings the controls H1 will need (button, form field, dialog, tabs, select, combobox, toast, tooltip, pagination, focus trap). Its interaction primitives (press, hover, focus-visible) expose state as `data-*` attributes, which map onto the required states of the visual direction (§5.1). Its peers are `@angular/cdk` (MIT) and `@floating-ui/dom` (MIT).
- **Containing its risk:** it is pre-1.0, mostly written by a single maintainer, and has published breaking changes about monthly (0.125, 0.128, 0.131.3). Therefore it is pinned exactly (no range) and each upgrade is a reviewed change; only `ui` may import it, enforced by `eslint-plugin-boundaries`' external-dependency rule (W-02), so apps see `@herald/ui` alone and a breaking release touches one library. If the project stalls, `ui` moves to the fallback below without changing the apps; `@angular/cdk` is already installed as its peer.
- **M0 controls:** only what the shells need: button, navigation links, alert/notice, status label and loading presentation. Dialog, select, tabs, drawer and toast arrive with the H1 features that use them.
- **Catalogue:** a development-only Angular project, `web/projects/catalogue`, built with the same `@angular/build` as the apps and never deployed (ADR 0011: tooling, not a third product app). Its pages are prerendered, which checks every control under SSR; state, keyboard and focus tests run in Vitest, with an `axe-core` (MPL-2.0) accessibility check. Classified as its own element in W-02's configuration: it may import `ui` only.
- **Experiment (task 3.1), before any `ui` code:** on a throwaway W-01 scaffold, build a button with every state (including loading) and tabs using Herald's tokens and radius 0; prerender a catalogue page with no SSR errors and clean hydration; cover keyboard and focus in Vitest plus `axe-core`; check that importing `ng-primitives` from an app fails lint. Record the result here. A failure reopens W-03 with the fallback.
- **Fallback:** `@angular/cdk` with `@angular/aria` 22.2.6 (MIT, maintained by the Angular team, versioned with Angular): lower risk, but no button, form field, toast, tooltip or press/hover states, which Herald would write itself, and its documentation states neither stability nor SSR support.
- **Rejected:** styled libraries (Angular Material, PrimeNG), whose themes fight the square geometry and tokens; spartan/brain 1.9 (MIT), which requires Tailwind 4 while the visual direction uses its own tokens; Storybook 10.6 (MIT) for the catalogue, because `@storybook/angular` requires `@angular-devkit/build-angular` (a second, webpack-based build pipeline with more install scripts to approve) and does not exercise SSR.
- **Licences:** checked for the exact versions above on npm; the transitive check runs with the workspace (task 2.1).

Remaining library/generator versions are deliberately unselected until W-04–W-06. These draft requirements are proposed targets, not evidence that the choices or implementation are approved.

## Validation and completion

Before implementation: resolve W-01–06, review affected shell states and approve the bounded change. During implementation: compile both apps, check library imports and negative fixtures, verify deterministic API/client generation, render at desktop/mobile widths and exercise keyboard/error recovery, run SSG/hydration and concurrent-request isolation fixtures, and start both apps through Aspire. Record actual commands, versions and results here. Archive only after the tasks and acceptance scenarios are complete; schema validation alone is not completion.

Document validation on 8 November 2026, after recording what `m0-messaging` delivered: `openspec validate m0-web-shell --strict` passed. This checks proposal structure only; review gates 1.1–1.3 and every implementation task remain open.
