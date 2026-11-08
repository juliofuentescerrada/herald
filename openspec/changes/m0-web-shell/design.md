## Status and context

**Approved for implementation on 8 November 2026** (gates 1.1–1.4 closed). The decisions below (W-01–W-06) and the reviewed visual references are the implementation contract. ADR 0011 defines the direction. `m0-solution-skeleton` and `m0-messaging` are implemented and archived; this design was updated on 8 November 2026 with what `m0-messaging` delivered (task 1.4).

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
- **A candidate that builds without starting:** `Microsoft.Extensions.ApiDescription.Server` was the candidate; W-04's experiment showed it starts the host and needs the database, and chose Wolverine's `openapi` command instead.
- **Existing patterns to reuse:** the host sets `RunWorkingDirectory`, so `dotnet run --project src/Herald.Host -- <command>` runs from its folder; CI already regenerates Wolverine's code and fails on any changed, deleted or new file (`codegen delete`, `codegen write`, then `git diff` plus untracked files). The OpenAPI and client drift check follows the same shape and message style.

Ownership: this change owns exporting the document at build time, TypeScript generation, the drift check, and the edits these need in the host, AppHost and CI. It extends the existing description pipeline (`AddHeraldApi`) rather than adding a second one, does not describe Wolverine endpoints by hand, and does not change messaging or transport. It modifies `api-description` only to split the one document into public and admin documents (W-04).

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

Reuse the supplied references where sufficient. Missing states remain explicitly pending visual input/review before implementation, as required by CLAUDE and OpenSpec context.

### Reviewed references (approved 8 November 2026)

The maintainer approved the shell-state prototype [`shell-states.html`](../../../prototypes/frontend/shell-states.html) and its [captures](../../../docs/assets/mockups/shell/README.md) (desktop and mobile, headless Chrome, no page errors or horizontal overflow) as the gate 1.2 visual input. Together with the reused references below they cover every surface and state in the table above.

| Surface/state | Approved reference |
| --- | --- |
| Admin shell, wide and narrow; missing context; denied access | Reused: `journey-individual-access-desktop.png`, `journey-individual-setup-mobile.png`, `state-private-denied-mobile.png` |
| Public shell and representative page, wide and narrow (Menu disclosure) | `shell-public-shell-{desktop,mobile,mobile-menu}.png` |
| Shared controls: variants × default/hover/focus/pressed, loading, unavailable with reason, labels, notice, alert, field error | `shell-controls-{desktop,mobile}.png` |
| Offline/API unavailable with retry | `shell-api-unavailable-{desktop,mobile}.png` |
| Section failed to load (reload) | `shell-route-failed-{desktop,mobile}.png` |
| Public and admin not found (generic) | `shell-not-found-public-*.png`, `shell-not-found-admin-*.png` |
| Context replaced in another tab | `shell-context-replaced-{desktop,mobile}.png` |

Approved choices: the destructive variant is outlined in red rather than filled; loading keeps the label and width with a square spinner and a status announcement; the hero copy is placeholder text and the hero carries no illustration in M0. The captures do not prove keyboard order, screen-reader output or exact contrast; task 3.5 records that evidence from the catalogue.

**Icons.** The visual guide confirms Tabler Icons (outline, consistent stroke; 20 px controls, 24 px navigation, 16 px metadata, 8 px gap; decorative icons hidden, icon-only actions named). The prototype is exempt and draws none. The application uses `@tabler/icons-angular` 3.50.0 (MIT, peer `@angular/core` ≥ 21, with `@tabler/icons` 3.50.0), consumed only through `ui` like the component foundation.

## Decisions required before implementation

| ID | Decision | Evidence needed |
| --- | --- | --- |
| W-01 | Workspace location, package manager and pinned Node/Angular/tool versions | **Decided 2026-11-08**, below |
| W-02 | Boundary-check tooling and public-entry conventions | **Decided 2026-11-08**, below |
| W-03 | Component foundation and catalogue tooling | **Decided 2026-11-08, confirmed by the task 3.1 experiment**, below |
| W-04 | OpenAPI export mechanism, generator, transport and artifact paths | **Decided 2026-11-08**, below |
| W-05 | Concrete route render modes and Aspire integration | **Decided 2026-11-08**, below |
| W-06 | State scope and reset mechanism | **Decided 2026-11-08**, below |

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

### W-03: component foundation and catalogue (decided 2026-11-08, confirmed by experiment)

- **Foundation:** `ng-primitives` 0.131.4 (Apache-2.0), headless: it ships no styles, so Herald's tokens, square corners and spacing scale apply without overriding a theme. It supports SSR and zoneless applications, Angular 21 and 22, and brings the controls H1 will need (button, form field, dialog, tabs, select, combobox, toast, tooltip, pagination, focus trap). Its interaction primitives (press, hover, focus-visible) expose state as `data-*` attributes, which map onto the required states of the visual direction (§5.1). Its peers are `@angular/cdk` (MIT) and `@floating-ui/dom` (MIT).
- **Containing its risk:** it is pre-1.0, mostly written by a single maintainer, and has published breaking changes about monthly (0.125, 0.128, 0.131.3). Therefore it is pinned exactly (no range) and each upgrade is a reviewed change; only `ui` may import it, enforced by `eslint-plugin-boundaries`' external-dependency rule (W-02), so apps see `@herald/ui` alone and a breaking release touches one library. If the project stalls, `ui` moves to the fallback below without changing the apps; `@angular/cdk` is already installed as its peer.
- **M0 controls:** only what the shells need: button, navigation links, alert/notice, status label and loading presentation. Dialog, select, tabs, drawer and toast arrive with the H1 features that use them.
- **Catalogue:** a development-only Angular project, `web/projects/catalogue`, built with the same `@angular/build` as the apps and never deployed (ADR 0011: tooling, not a third product app). Its pages are prerendered, which checks every control under SSR; state, keyboard and focus tests run in Vitest, with an `axe-core` (MPL-2.0) accessibility check. Classified as its own element in W-02's configuration: it may import `ui` only.
- **Experiment (task 3.1), before any `ui` code:** on a throwaway W-01 scaffold, build a button with every state (including loading) and tabs using Herald's tokens and radius 0; prerender a catalogue page with no SSR errors and clean hydration; cover keyboard and focus in Vitest plus `axe-core`; check that importing `ng-primitives` from an app fails lint. Record the result here. A failure reopens W-03 with the fallback.
- **Experiment result** (task 3.1, throwaway copy of the committed workspace, Node 26.13, `ng-primitives` 0.131.4 with `@angular/cdk` 22.2.6 and `@floating-ui/dom` 1.8.0, `axe-core` 4.14.0, headless Chrome 157 through `playwright-core`, 8 November 2026, nothing committed): **passed; W-03 stands.**
  - `button[heraldButton]` (an attribute component with `NgpButton` as host directive; variants primary, secondary, quiet, destructive; hover, press and focus-visible styled from `data-hover`, `data-press`, `data-focus-visible`) and `herald-tabs` (on `NgpTabset`/`NgpTabList`/`NgpTabButton`/`NgpTabPanel`) with Herald tokens and `border-radius: 0`.
  - Prerendered catalogue: no build or server errors; the HTML already carries the states (`data-disabled="soft"`, `aria-disabled`, `aria-busy`, `role="tab"`, `aria-selected`, `aria-controls`). Development build: Angular hydrated 14 components and 100 nodes, 0 skipped, no warnings; production build: no console output.
  - In the browser after hydration: clicks run the action; disabled and loading buttons do not; a loading button stays focusable and announced; keyboard focus sets `data-focus-visible`, mouse focus does not; Enter activates; tabs keep one tab stop, ArrowRight/Home/End move focus, click and Enter select, the selected panel is the only one shown and Tab moves into it; no element has a non-square radius.
  - Vitest (jsdom): 9 tests on clicks, disabled, loading (focusable, `aria-busy`, `aria-disabled`, hidden spinner, no repeat), keyboard focus-visible, the tab stop and arrow keys, tab-to-panel links, and `axe-core` with no violations (colour contrast is not measurable in jsdom; task 3.5 measures it). Removing the loading guard makes the loading test fail.
  - Lint: an app file importing `ng-primitives/button` fails with `boundaries/dependencies`.
  - Learned for task 3.2: `'soft'` disabled still delivers events ("guard your handlers"), so `ui`'s button sets `NgpButton.setDisabled('soft')` while loading and blocks the click in the capture phase, before the consumer's `(click)` on the same element; binding `aria-disabled` directly is overwritten by `NgpButton`. Attribute components (`button[heraldButton]`) need the `component-selector` rule to accept the `herald` attribute form in `ui`. Zoneless rendering is asynchronous: browser checks wait for rendering before reading the DOM.
- **Fallback:** `@angular/cdk` with `@angular/aria` 22.2.6 (MIT, maintained by the Angular team, versioned with Angular): lower risk, but no button, form field, toast, tooltip or press/hover states, which Herald would write itself, and its documentation states neither stability nor SSR support.
- **Rejected:** styled libraries (Angular Material, PrimeNG), whose themes fight the square geometry and tokens; spartan/brain 1.9 (MIT), which requires Tailwind 4 while the visual direction uses its own tokens; Storybook 10.6 (MIT) for the catalogue, because `@storybook/angular` requires `@angular-devkit/build-angular` (a second, webpack-based build pipeline with more install scripts to approve) and does not exercise SSR.
- **Licences:** checked for the exact versions above on npm; the transitive check runs with the workspace (task 2.1).

### W-04: OpenAPI documents, export, generator and transport (decided 2026-11-08)

- **Two documents, one pipeline:** `AddHeraldApi` registers two `Microsoft.AspNetCore.OpenApi` documents, `public` and `admin`, and each endpoint declares its group with `[EndpointGroupName]`, which Wolverine endpoints honour. Each document includes only its own group (`ShouldInclude = d => d.GroupName == name`), because by default .NET adds ungrouped endpoints to every document. An endpoint belongs to exactly one group; a host test fails if any endpoint has none. The host serves them at `/openapi/public.json` and `/openapi/admin.json`, in Development only as before (modified `api-description`). Why: each app sees only the contract it uses, boundary checks can forbid the public app the admin client, and M4 can expose the public document without the admin one.
- **Export:** Wolverine.Http 6.62's own `openapi` command, which builds the host without starting it: `dotnet run --project src/Herald.Host -- openapi -d public -o <path>` and the same with `-d admin`. It needs no database, broker, credentials or schema change; it needs the `herald` and `messaging` connection strings to exist, which `appsettings.Development.json` supplies (it never connects). It follows the same pattern as `codegen write`.
- **Transport:** Angular's `HttpClient`. On SSR, its transfer cache carries GET responses into hydration, which a `fetch` client would not; base URL and per-request context enter through interceptors and request-scoped injection, with no global state in generated code (W-06 builds on this). TanStack Query (`@tanstack/angular-query-experimental`, MIT) wraps the generated calls inside features, by hand: generators' query plugins stay off, because generated code owns no query cache.
- **Generator:** orval 8.47.0 (MIT), pinned exactly, `client: 'angular'`, one configuration in `web/` with one target per document. It emits an `@Injectable` service using `inject(HttpClient)` and plain model interfaces. Errors stay `HttpErrorResponse`; `api-client` adds a small adapter that reads its body as the generated `ProblemDetails`/`ValidationProblemDetails`. Each endpoint gets an explicit operation id, because Wolverine's default produces names such as `gETApiPublicThingsId`.
- **Paths and entry points:** documents in `web/projects/api-client/openapi/herald.public.json` and `herald.admin.json`; generated code in `web/projects/api-client/src/public/generated/` and `src/admin/generated/`, exposed as `@herald/api-client/public` and `@herald/api-client/admin`, with the shared transport and error adapter internal to the library. The public app may import only `public`; the admin app may import both (W-02 policies).
- **Drift check in CI,** after the host build and in the shape of the Wolverine code check: export both documents, run orval, and fail on any changed, deleted or new file under `web/projects/api-client/`, naming the files and the regeneration command.
- **Fixtures:** while the host has no endpoints its documents have no paths, so representative request, response and error types come from test-only endpoints with their own exported document and generated client, never from the host's production code (task 5.2 chooses where they live).
- **Evidence** (throwaway copy of the repository, 2026-11-08, nothing committed): with three Wolverine endpoints in the copy's host (one `public` with a 404 `ProblemDetails`, one `admin` with a 400 `ValidationProblemDetails`, one without a group), and no PostgreSQL on port 5432:
  - `Microsoft.Extensions.ApiDescription.Server` 10.0.14 failed in Development (the module migrations started) and in Production (Wolverine's `StartAsync` checked the message store): it starts the host.
  - Wolverine's `openapi` command wrote both documents (OpenAPI 3.1.1) in Development and Production, identical across both. Each contained only its endpoint, errors as `application/problem+json`; the ungrouped endpoint appeared in neither.
  - orval 8.47.0 on Node 26.13 and pnpm 12.18 (approving `esbuild`'s install script): two runs produced no diff, and the output type-checked with TypeScript 6.0.3 and Angular 22.2.5 (238 lines for both clients).
  - NSwag 14.7.1 (MIT): deterministic, typed errors (`ApiException` with the parsed `ProblemDetails`), but its Angular template uses constructor parameter decorators (`@Inject`), which fail with TS1206 unless `experimentalDecorators` is on, generates classes with `fromJS`/`toJSON` (571 lines), and requests `responseType: "blob"` and parses the body itself.
  - Not covered: the host test for ungrouped endpoints, SSR transfer caching with the generated client (W-05/W-06 and the first public page), nullable OpenAPI 3.1 types.
- **Rejected:** `Microsoft.Extensions.ApiDescription.Server` (starts the host); a test host exporting the document (needs PostgreSQL for every generation); one document for both apps; NSwag (legacy decorators, class-based models, blob transport); `@hey-api/openapi-ts` 0.99 (pre-1.0); `ng-openapi-gen` 1.1 (no typed errors); `openapi-typescript` with `openapi-fetch` (`fetch` transport, TypeScript `^5.x` peer).

### W-05: render modes, SSR runtime and Aspire (decided 2026-11-08)

- **Admin:** CSR only: no `@angular/ssr`, no server output; a static build served with an `index.html` fallback.
- **Public:** `outputMode: 'server'` and an explicit `app.routes.server.ts`. In M0: `/` (the representative corporate page) `Prerender`; `/_fixtures/ssr` `Server`; `/_fixtures/client` `Client` (standing in for participant workflows); `**` `Server`, so an unknown URL gets a server-rendered page with status 404 (`RESPONSE_INIT`) rather than a 200 with an empty app. Hydration is `provideClientHydration(withEventReplay())`; incremental hydration waits for a page that needs it.
- **Fixtures** live in one file that exports both their routes and their server routes; the production configuration replaces it with an empty one (`fileReplacements`), so fixture code is absent from production artifacts.
- **SSR runtime:** the `server.ts` that `ng new --ssr` generates: Express 5 (MIT) with `AngularNodeAppEngine`, listening on `PORT`. Where it runs, and whether Express gives way to `node:http`, is M4's, with its cold-start measurements.
- **API URL:** both apps call relative `/api` URLs. In the browser in development, each app's `ng serve` forwards `/api` to the host with a `proxy.conf.mjs`; in production the same-origin routing is M4's (ingress). On the server, the public app rewrites `/api` requests to `HERALD_API_URL` **in its server `HttpBackend`**, which runs after every interceptor. An interceptor would rewrite the URL before the transfer cache computes its key, and the browser would repeat the request; in the backend, the cache keys it by the same relative URL the browser uses, and hydration reads it from `ng-state`.
- **Aspire:** `Aspire.Hosting.JavaScript` 13.6.4 (MIT), two `AddJavaScriptApp` resources on `web/` running `start:admin` and `start:public` (`ng serve <app> --port $PORT`), each with `WithHttpEndpoint(env: "PORT")`, `HERALD_API_URL` from the host's endpoint (`WithEnvironment`) and `WaitFor(host)`. One install per workspace: admin's `WithPnpm()` creates the installer, and public uses `WithPnpm(install: false)` and `WaitForCompletion` on it; two installers run `pnpm install` concurrently in the same folder and the second app never starts.
- **For M4:** Angular 22's SSR server rejects requests whose `Host` is not allowed (400, SSRF protection): production configures `security.allowedHosts` or `NG_ALLOWED_HOSTS` with the real domains. The production server serves no `/api`; the ingress must route it to the host on the same domain.
- **Evidence** (throwaway workspace and AppHost, Angular 22.2.5, pnpm 12.18.0, Node 26.13, Aspire 13.6.4, a minimal stub host instead of Herald's, 2026-11-08, nothing committed):
  - Production build: admin had browser output only; public prerendered `/` with its content (`ng-server-context="ssg"`); fixture code absent and fixture routes 404; an unknown URL 404 from the server.
  - Development build behind the built server: `/_fixtures/ssr` returned the API's data in its HTML. With the URL rewritten by an interceptor, headless Chrome repeated the API request on hydration; with the rewrite in `HttpBackend` it made none.
  - Through Aspire (`ng serve`): both apps answered on their URLs (4200, 4300); `/api` reached the host from the admin browser and from public SSR; `/`, `/_fixtures/ssr` and `/_fixtures/client` hydrated in headless Chrome with no warnings and no API requests on the public pages; the prerendered button handled clicks after hydration.
  - Failures found on the way: two installers (public never started); the stub host without launch settings had no endpoint, so the apps could not resolve the host's URL (Herald's host has them).
  - Not covered: Windows (`$PORT` relies on the script running under `sh`; pass the port with `WithArgs` if needed), Herald's real host and AppHost with PostgreSQL and the emulator, concurrent-request isolation (W-06).
- **Rejected:** `AddViteApp` (Angular CLI uses Vite internally but is not started with Vite's command); CORS on the host with absolute API URLs in the apps (more moving parts, while production routing is M4's anyway); rewriting `/api` in an interceptor (breaks the transfer cache); one installer per app.

### W-06: state scope and reset (decided 2026-11-08)

- **Server rendering is anonymous.** The public server's `HttpBackend` strips `Authorization` and `Cookie` and sends no credentials, whatever a feature sets, so the server never holds protected data and no shared or transfer cache can carry it. Personal content (a player's panel, their next match) loads in the browser after hydration. Angular's transfer cache already skips requests with authorisation headers, so those repeat in the browser by design.
- **No mutable module-level state.** Angular gives each SSR request its own injector, so `providedIn: 'root'` is per request; a module-level variable is shared by every request the Node process serves. The `QueryClient` therefore comes from an `InjectionToken` with `factory: () => new QueryClient()`, passed to `provideTanStackQuery`: one per request on the server, one per document in the browser. TanStack's documented `provideTanStackQuery(new QueryClient())` is the trap this rule exists for.
- **TanStack on the server:** the server configuration sets `notifyManager.setScheduler(cb => cb())`. TanStack registers its Angular pending task only when it is notified that a query is fetching, and its default scheduler delivers that notification late, so the render finished as `pending`. The setting is process-wide configuration, not per-request state. With it, the HttpClient transfer cache carries the response to hydration and the browser's `QueryClient` gets it without a request; no TanStack dehydration is needed.
- **The server backend** extends `FetchBackend` (rewriting to `HERALD_API_URL` and stripping credentials, W-05) instead of wrapping it, which also keeps Angular's check that SSR uses `fetch` (NG02801) quiet.
- **Reset by full load.** Each app's platform exposes the context as read-only signals (identity, organisation) and one way to change it, `replace(target)`, which posts to a `BroadcastChannel` and calls `location.assign(target)`. Sign-out, a user change, revocation and an organisation change all use it. The document's query cache, signals, services, route injectors and in-flight requests go with it; features read the context and never change it. Other tabs of the same origin receive the message and reload.
- **Nothing protected in web storage:** no protected data in `localStorage` or `sessionStorage` and no persisted query cache, so a reload really clears it. The context after a load comes from the URL and, from H1, from the session.
- **Query keys** still start with their scope (`['org', organisationId, …]`) so a key never means different data in two contexts; the full load, not the key, is what guarantees the reset.
- **Evidence** (throwaway W-05 workspace, `@tanstack/angular-query-experimental` 5.107.1 (MIT), headless Chrome through `playwright-core`, 2026-11-08, nothing committed):
  - 50 concurrent SSR requests with the same query key and a different value each, each with a `Cookie` and a fixture-set `Authorization`: with a module-level `QueryClient`, 25 rendered another request's value, 24 rendered `pending` and 1 its own; with the token, 50 of 50 rendered their own. The stub host received no credentials in any request.
  - Before the scheduler setting, the SSR rendered `pending` with the request already sent; after it, the data was in the HTML, hydration was clean and the browser made no API request.
  - Organisation A loaded `org/A/data`; after `replace()` to B the cache held only `org/B/data`, and a second tab on A reloaded on the broadcast.
  - Not covered: tabs of the other app (a different origin) are not notified; a server-side revocation signal (such as a 401) has no trigger until H1's authentication; Herald's real host.
- **Rejected:** an in-app reset (clearing the query cache, scoping every key, navigating and cleaning route injectors with `withAutoCleanupInjectors`): smoother, but every source of state has to be covered, and one service that keeps something leaks the previous context; it remains the upgrade if H1 shows organisation changes are frequent. Forwarding the user's credentials during SSR: it would make server output personal and every cache a risk. TanStack's dehydration for SSR: the HttpClient transfer cache already carries the data.

All W-01–W-06 decisions are recorded, and W-03 is confirmed by its experiment (task 3.1).

## Implementation record

### Workspace and boundaries (tasks 2.1–2.5, 8 November 2026)

- **Workspace** (`web/`): `ng new --create-application=false` with Angular CLI 22.2.5 and pnpm 12.18.0 on Node 26.13.0; projects `admin` (CSR), `public` (SSR scaffold), `catalogue` (dev-only, SSR scaffold), libraries `ui` (`@herald/ui`, mapped to its source entry, selector prefix `herald`) and `api-client` (empty until 5.2). `engineStrict` and the four approved install scripts live in `pnpm-workspace.yaml`. The W-01 build that Docker could not run now passes on Node 26: all three apps build, `public` and `catalogue` prerender one route.
- **Licences** (`pnpm licenses list`, all dependencies): MIT 307, ISC 22, BSD 13, Apache-2.0 14, BlueOak/0BSD/CC0/MIT-0 6, plus `caniuse-lite` (CC-BY-4.0, browser data) and `lightningcss` (MPL-2.0, build tool); all free for an open-source project.
- **Import matrix:** one root `eslint.config.js` (ESLint 10.14, typescript-eslint 8.71, angular-eslint 22.6.0, eslint-plugin-boundaries 7.4.2, eslint-import-resolver-typescript 4.4.5). Two settings the W-02 experiment did not need: `checkAllOrigins: true`, without which external packages (`ng-primitives`, `@tabler/*`) are never checked, and placing the libraries before the app `src` descriptor so their files are not classified as bootstrap. Library imports must reach `src/public-api.ts` (`ui`) or `src/{public,admin}/index.ts` (`api-client`); the public app may reach only `src/public/index.ts`.
- **Fixtures:** `web/boundary-fixtures/` plants 15 violations marked `// violation` (relative, alias, barrel and dynamic feature-to-feature imports; a feature added after the policies; composition into a feature's internals; feature into composition; platform and shared into features; a deep `ui` import; `ng-primitives` and Tabler from a feature; `api-client` into `ui`; the public app into the admin client and into the admin app). `pnpm lint:boundaries` passed (15 planted, 15 reported, 0 mismatches) and failed with one mismatch when a mark was removed. `pnpm lint` passes for all five projects.
- **State:** `QUERY_CLIENT` (an `InjectionToken` factory) in both apps' platform; the admin platform's `AppContext` (read-only signals, `replace()` posting to `BroadcastChannel('herald-admin-context')` and calling `location.assign`), started by `provideAppContext()`; `organisationKey()`. Seven admin tests pass: no setter on the context, replacement is a full load, no cached query or draft survives into the next document, the other tab reloads (and the test fails when the broadcast is removed), and scoped keys. The public app gets its context with its first participant feature.
- **CI:** a `web` job (pinned `pnpm/action-setup` 6.1.1, `setup-node` 7.1.0 reading `.nvmrc`) runs `install --frozen-lockfile`, `lint`, `lint:boundaries`, `test:all` and `build:all`.

### Shared controls and catalogue (tasks 3.2–3.3, 8 November 2026)

- **Dependencies** (exact): `ng-primitives` 0.131.4 (Apache-2.0), `@angular/cdk` 22.2.6, `@floating-ui/dom` 1.8.0, `@tabler/icons-angular` and `@tabler/icons` 3.50.0 (all MIT); `axe-core` 4.14.0 (MPL-2.0, tests only).
- **`ui`:** semantic tokens and a base stylesheet (`projects/ui/src/styles/`, from visual direction §§3–4; Inter with a system fallback, no font files) that every app lists in its `styles`; `button[herald-button]`/`a[herald-button]` (four variants, unavailable, loading as W-03's experiment learned), `herald-icon` (a closed set of Tabler outline icons at 20/24/16 px, hidden unless labelled), `herald-notice` (info, success, warning, danger; danger is `role="alert"`; optional icon override and dismiss), `herald-status-label` and `a[herald-nav-link]` (the app sets `aria-current`; `ui` knows no routes). Attribute selectors are kebab-case (`herald-button`), so one `component-selector` rule covers elements and attributes. Vitest: 19 tests, including `axe-core` on each control.
- **Tabler and hydration:** `TablerIconComponent` appends its SVG imperatively, so a hydrated page showed every icon twice. `herald-icon` marks its `tabler-icon` with `ngSkipHydration`: the server SVG is replaced, not duplicated. The catalogue then hydrated 47 components, skipped the 12 icons by design, and showed exactly one SVG per icon.
- **Catalogue** (`projects/catalogue`, `outputMode: 'static'`, no server entry, one prerendered page): every button variant as default, unavailable and loading; an unavailable action with its reason; a link with button appearance; icon sizes and an icon-only action; status labels; the five notices of the approved shell states; navigation links on graphite; and an error-and-recovery demo (the first attempt fails with an alert, the retry succeeds, the entry survives). Five Vitest tests (variants and states, only available buttons act, `axe-core`, the recovery flow). In headless Chrome on the prerendered build: hover sets `data-hover`, unavailable and loading buttons never act, loading buttons are in the tab order and disabled ones are not, keyboard focus is visible, the recovery flow keeps the entry, no element has a radius, no horizontal overflow at 1280 or 390 px.

### Shells (task 3.4, 8 November 2026)

- **Admin** (CSR, composition in `projects/admin/src/app`): a graphite rail with the wordmark, the working context from `AppContext` ("No organisation selected" without one) and a Workspace navigation that has only Overview until H1 features add their entries. No Tournaments or Organisation link points at nothing. Routes: the overview, and a generic "Page not found" inside the shell for any other address, naming the current organisation without confirming that the address exists elsewhere. Two shell recoveries: a lazy section that fails to load (router `NavigationError`) shows "This section did not load" with *Reload page* (a full load of the failed address) and *Go to overview*; a tab reloaded because another tab replaced the context shows a dismissible status notice once (`AppContext.replacedElsewhere`, a session-storage flag set just before the reload). The "Tournaments could not be loaded" state belongs to the first data view that fails, so it arrives with H1.
- **Public** (composition in `projects/public/src/app`): a graphite header with the wordmark, Home and an *Organiser workspace* link (the platform's `ORGANISER_WORKSPACE_URL`, `/admin/` until Aspire and hosting supply the address), a *Menu* disclosure below 700 px (`aria-expanded`, `aria-controls`, closes on navigation), the representative page (hero and three points, prerendered) and a footer. The captures' Tournaments, Privacy and Terms links are left out: their pages do not exist in M0 and would imply functionality. The 404 route is task 4.1's.
- **`ui` changes the shells needed:** `dismissible` on the notice accepts a bare attribute, and non-primary buttons on a graphite surface (`data-herald-surface="inverse"`) are outlined in the inverse colours, with hover `#30363e` (already measured in the visual guide) and pressed `#454d58` as new tokens. Both apps use the button; admin also uses the notice and navigation link, and public the icon.
- **Tests:** admin 13 (the 7 context tests plus one for the reload notice; the shell's organisation, current page, missing organisation, generic not-found, failed section and its recovery, context-replaced notice, `axe-core`), public 4 (page and current page, no sign-in, registration or results, menu disclosure, `axe-core`), ui 19, catalogue 5. `pnpm lint` clean; boundaries 15/15; `build:all` passes and public prerenders `/`.
- **Browser check** (headless Chrome on the production builds, admin served with an `index.html` fallback): public `/` has its content and `ng-server-context="ssg"` before JavaScript and hydrates with no console messages; the menu is hidden at 1280 px, and at 390 px it opens to show the links and they are reachable by keyboard; tab order is wordmark, Home, *Organiser workspace*, hero action, all with visible focus. Admin: overview, generic not-found, a lazy chunk blocked to simulate a new release (failure page; *Reload page* returns to the overview), and another tab posting a replacement (this tab reloads, shows the notice, and a second load does not). The only console errors are the blocked chunk's, as intended. No element has a radius and nothing overflows horizontally at 1280 or 390 px in either app.

### Visual and accessibility review (task 3.5, 8 November 2026)

Headless Chrome on the production builds of public, admin and the catalogue, eight states: public desktop and narrow with the menu open; admin overview without an organisation, with the context-replaced notice, generic not-found, section failed (lazy chunks blocked) and narrow; the catalogue. Each state was audited in the page itself and captured plain, in grayscale and blurred (4 px).

- **Contrast and automated checks:** `axe-core` 4.14.0 in the browser (WCAG 2.0–2.2 A/AA and best practice, colour contrast included, which jsdom cannot measure): 0 violations and 0 incomplete results in every state, with 6–54 text nodes passing contrast per state.
- **Focus:** every element reached with Tab shows a 3 px ring. Ring contrast against the surface behind the control is 9.13:1 on graphite (`#9dbbff`) and 5.41–6.37:1 on light surfaces (`#2559c3`), against the 3:1 required for non-text. Unavailable buttons are skipped, loading ones are reachable.
- **Reading order:** landmarks are header, Main navigation, main and footer (public), and rail, Workspace navigation and main (admin); one `h1` per page and no skipped levels. The public menu sits in the header before the content and closes on navigation.
- **Hierarchy (grayscale and blur):** the page title and its primary action are read first in every state; in grayscale the lime primary action stays distinct from outlined actions; notices read as secondary to the page title; the rail recedes on the admin pages.
- **Spacing and type**, measured from computed styles: every margin, padding and gap is on the scale except `auto` layout margins and the documented public gutter. Sizes: public hero 56/40 px, public section title 28 px, admin titles 32 px, body 14–16 px, metadata 14 px, table column labels and the eyebrow 12 px.
- **Fixed by this review:** the public section title was 24 px (guide: 28–36 px) and is now 28 px. The admin context subtitle was 12 px (metadata: 13–14 px) and is now 14 px. `base.css` left browser-default `p` and `h1` margins (1em, 0.67em), which were off the scale, and now sets them from it. The notice's dismiss button had the browser's default padding and its icon had a 2 px nudge; both were removed. When a section fails to load, focus could stay on a removed element so that Tab found nothing. The failure heading now takes focus, which also announces the failure, and Tab continues to *Reload page* and *Go to overview* (asserted in a test).
- **Error recovery:** the catalogue's recovery demo keeps the typed entry after a failure and succeeds on retry (task 3.3). The admin failed section recovers with a full load (task 3.4). The context-replaced notice appears once and can be dismissed.
- **Limits:** Inter is not installed on the review machine, so the captures use the system fallback (no font is downloaded, by design). No screen reader was run; the review relies on roles, names and order checked by axe and the tests.

### Render modes, 404 and fixtures (task 4.1, 8 November 2026)

- **Routes** (`projects/public/src/app`): `app.routes.server.ts` prerenders `''`, renders `**` per request, and adds the fixtures' server routes between them. The `**` route is a not-found page that sets `RESPONSE_INIT.status = 404` when rendered on the server and says nothing about unpublished tournaments (eyebrow, heading, *Go to the home page*).
- **Fixtures:** `fixtures.ts` exports `fixtureRoutes` and `fixtureServerRoutes`. `/_fixtures/ssr` is `Server`: it says where it was rendered, through the transfer state, and has a counter that proves hydration. `/_fixtures/client` is `Client`. Their pages live in `fixture-pages.ts`, loaded lazily. The production configuration's `fileReplacements` swaps in `fixtures.production.ts` (empty arrays), so neither the routes nor the pages are bundled. 4.2 and 4.3 extend the SSR fixture with API data and isolation.
- **Tests:** public 7. Three are new: an unknown address renders the not-found page with status 404; the home page is prerendered and anything else is server-rendered; each fixture uses its mode, the production replacement is empty, and the SSR fixture renders.
- **Built server** (`node dist/public/server/server.mjs` with `NG_ALLOWED_HOSTS=localhost`; without it every request is a 400, as W-05 recorded for M4):

| Request | Production build | Development build |
| --- | --- | --- |
| `/` | 200, `ng-server-context="ssg"`, page content | same |
| `/_fixtures/ssr` | 404, not-found page | 200, `ssr`, "Rendered on the server" |
| `/_fixtures/client` | 404, not-found page | 200, shell only (rendered in the browser) |
| `/tournaments/private-cup` | 404, `ssr`, not-found page | same |

  No file in the production `dist/public` contains "fixture". `prerendered-routes.json` lists only `/`.
- **Browser** (headless Chrome, development build behind the built server): `/`, the SSR fixture and the 404 page hydrate with no warnings ("6 components hydrated, 1 skipped": the Menu icon, which `herald-icon` skips by design). The SSR fixture's button responds after hydration and its text stays "Rendered on the server". The client fixture renders its heading in the browser. From the 404 page, *Go to the home page* navigates on the client. The only console error is the 404 status of the document itself.

### SSR isolation and the server transport (task 4.2, 8 November 2026)

- **Server transport** (`projects/public/src/app/platform/server-api.ts`, installed only by `app.config.server.ts` through `provideServerApi(process.env['HERALD_API_URL'])`). `ServerApiBackend` replaces `FetchBackend` (`withFetch` resolves `HttpBackend` to it). It runs after every interceptor and does three things:
  - removes `Authorization` and `Cookie` and sends with `credentials: 'omit'`, whatever the feature set, for every request;
  - rewrites this site's `/api/…` to `HERALD_API_URL`;
  - when that variable is missing, fails with an explicit error instead of calling itself.
- **What W-05's experiment did not show:** on the server, Angular resolves relative URLs against the incoming request before the backend sees them. The backend receives `http://<public host>/api/…`, not `/api/…`, and the first version, which matched the prefix, sent the request to the public server itself (404). The backend now compares origins against `REQUEST`. A URL on another host that happens to contain `/api/` is not rewritten, but its credentials are still stripped. The transfer cache still keys requests before the backend, so 4.3 checks that hydration does not repeat them.
- **TanStack on the server:** `provideServerApi` sets `notifyManager.setScheduler((cb) => cb())` (W-06). The SSR fixture's query appears resolved in the HTML.
- **SSR fixture:** with `?marker=…` it stores the marker in a request-local service (`providedIn: 'root'`) and queries `/api/_fixtures/echo` while setting `Authorization` itself. The query key is **the same in every request** while its answer depends on the request. That is the case a shared cache would leak; a key containing the marker would hide the leak (see the controls).
- **`pnpm test:ssr`** (`ssr-checks/isolation.mjs`, also in CI): it builds public for development and starts the built server against a stub API with random latency. It then sends 50 concurrent requests, each with its own marker, `Cookie` and `Authorization`, and requires that:
  - each response renders only its own marker in the provider and in the query;
  - no response contains another request's marker or any credential;
  - the API received 50 requests without credentials;
  - later responses (`/` and the fixture without a marker) carry nothing from earlier requests.
  
  Result: passes.
- **Negative controls** (the files were restored and checked with `git status`):
  - A `QueryClient` shared by the process: 55 failures (one request rendered another's marker and the rest did not render their own). The first version of the fixture put the marker in the query key and **passed** with the shared client; that is why the key is now fixed.
  - Credentials not stripped: 51 failures (the API saw credentials on every request).
- **Protected data and caches:** the server only makes anonymous requests, so no protected data enters the HTML, the transfer state or a shared cache. The check confirms that no credential appears in any response and that later public responses carry nothing from earlier ones. Personal content loads in the browser after hydration (W-06).
- **Tests:** public 10. Three new ones for the transport: stripping and rewriting with the query preserved, another host stripped but not rewritten, and an explicit error without `HERALD_API_URL`. Admin 13, ui 19, catalogue 5. Lint, boundaries 15/15 and production builds pass, with no fixtures in `dist/public`.

### Server rewrite and hydration without a repeat request (task 4.3, 8 November 2026)

- **Rewrite:** `ServerApiBackend` (task 4.2) rewrites this site's `/api/…` to `HERALD_API_URL` and keeps the path and query. Unit tests cover it.
- **Fixture:** without `?marker`, `/_fixtures/ssr` reads `/api/_fixtures/public` through TanStack and `HttpClient`, with no credentials. With a marker, the isolation query from 4.2 is unchanged; `pnpm test:ssr` still passes, and its stub also answers the public route.
- **Browser** (headless Chrome, development build behind the built server, a stub API that counts calls):

| Page | API calls from the server | Response in `ng-state` | Browser requests to `/api` | After hydration |
| --- | --- | --- | --- | --- |
| `/_fixtures/ssr` (public data) | 1 | yes | 0 | the data stays, no warnings |
| control: `?marker=control` (sets `Authorization`) | 1 | no | 2 (a repeat and TanStack's retry) | pending, then error |

  The control shows the check detects a repeat. W-06 already expected it: Angular's transfer cache skips requests with authorisation headers, so personal data loads in the browser. Its requests return 404 because the built server has no `/api`; the development proxy is task 4.4's, and in production same-origin routing is M4's (ingress).
- **Deferred:** API-backed metadata for tournament pages, visibility and cache policy belong to the first public tournament feature (spec: "Public rendering is selected by route").

### Local startup through Aspire (task 4.4, 8 November 2026)

- **AppHost:**
  - Adds `Aspire.Hosting.JavaScript` 13.6.4, MIT (checked in the package's nuspec).
  - Two `AddJavaScriptApp` resources on `web/`: `admin` runs `start:admin` with `WithPnpm()`; `public` runs `start:public` with `WithPnpm(install: false)` and `WaitForCompletion` on admin's installer, reached through `JavaScriptPackageInstallerAnnotation`.
  - Both have `WithHttpEndpoint(port: 4200/4300, env: "PORT")`, `HERALD_API_URL` set to the host's `http` endpoint, and `WaitFor(host)`.
  - The fixed ports are Aspire's proxy; `ng serve` listens on dynamic ports behind it.
- **Workspace:**
  - `start:admin` / `start:public` run `ng serve <app> --port ${PORT:-4200|4300}`.
  - `proxy.conf.mjs` (in both apps' `serve` options) forwards `/api` to `HERALD_API_URL`, or to the host's launch address `http://localhost:5180` when an app runs without the AppHost.
  - `web/README.md` documents startup, the checks and `NG_ALLOWED_HOSTS` for the built server.
- **Evidence** (`dotnet run --project src/Herald.AppHost`, Node 26.13 and pnpm 12.18.0 on `PATH`, Docker Desktop):
  - **Startup:** the real AppHost started PostgreSQL, the Service Bus emulator, the host and both apps in about 15 s with the workspace already installed. `admin-installer` went `Running → Finished` in 2 s; `public-installer` exists but stayed `NotStarted`, so only one install ran. Aspire's proxy (`dcp`) listened on 4200, 4300 and 5180. Host `/health`: `Healthy`.
  - **`/api` reaches the host on every path.** The host has no `/api` endpoint until the first feature, so its own 404 is the expected answer, recognisable by its `server: Kestrel` header (a proxy failure would be a 502 or 504).
    - `ng serve`'s proxy on 4200 and on 4300: 404 with `server: Kestrel`.
    - From the admin browser, `fetch('/api/…')`: 404 with `Kestrel`.
    - From public's SSR, the fixture shows a failed request to `http://localhost:5180/api/_fixtures/public: 404`, the host's address taken from `HERALD_API_URL`.
  - **Browser** (headless Chrome through Aspire):
    - public `/`: 200, served from the dev server's prerender (`ssg`), hydrates with no warnings and makes no `/api` request;
    - `/_fixtures/client`: renders in the browser;
    - an unknown URL: 404 with its page, which hydrates;
    - admin `/`: Overview.
  - **Shutdown:** SIGINT to the Aspire CLI process (`dotnet run` does not forward it) freed the ports in 2 s; the `ng serve` processes and the Aspire containers were gone within 6 s.
  - **Not covered:** Windows (`${PORT:-…}` needs a POSIX shell; pass the port with `WithArgs` if needed). The trusted developer certificate failed for NSS (Chromium/Firefox), which the HTTP endpoints do not need.

## Validation and completion

Before implementation: resolve W-01–06, review affected shell states and approve the bounded change. During implementation: compile both apps, check library imports and negative fixtures, verify deterministic API/client generation, render at desktop/mobile widths and exercise keyboard/error recovery, run SSG/hydration and concurrent-request isolation fixtures, and start both apps through Aspire. Record actual commands, versions and results here. Archive only after the tasks and acceptance scenarios are complete; schema validation alone is not completion.

Document validation on 8 November 2026, after recording what `m0-messaging` delivered: `openspec validate m0-web-shell --strict` passed. This checks proposal structure only; review gates 1.1–1.3 and every implementation task remain open.
