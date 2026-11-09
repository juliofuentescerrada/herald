## Context

**Approved for implementation on 9 November 2026** (gate 1.1), together with ADR 0014 as the direction. First H1 change. M0 left empty modules, a host with Wolverine and two OpenAPI groups (`public`, `admin`), and an admin application whose `AppContext` already replaces identity/organisation through a full load and a `BroadcastChannel` (W-06), waiting for a real session. Nothing authenticates or authorises.

Decisions already taken by the maintainer (9 November 2026), recorded in [ADR 0014](../../../docs/adr/0014-identity-and-organisation-isolation.md) and the functional baseline:

- D-21 confirmed: assigned-only sign-in, signed-in owner creation, one owner per organisation, `tid`+`oid` identity, Herald authorises, provider recovery plus a recorded support relink, owner-only private reads.
- Provider: the External ID directory shared with Arcana (`arcanapoc.onmicrosoft.com`, managed by hand; not in any OpenTofu state).
- Isolation: EF Core global query filters on an organisation shadow property; PostgreSQL RLS if it fits.
- D-04 confirmed in the same session; it has no effect on this change's code and is recorded here only because the baseline edit travels with it.

## Goals / Non-Goals

**Goals:** the AT-12 cases that do not need pilot applications; UJ-01 for H1 (create, select, switch, lose access, recover); an isolation mechanism every later module inherits; the reviewed access states in the admin application.

**Non-Goals:** tournaments; collaborators, invitations and ownership transfer (H2); pilot API applications and grants (D-12); guests (D-22); participant sign-in in the public application (H2); cloud deployment; an organisation settings screen beyond its name in the rail.

## Visual input

Screens: admin sign-in hand-off, not-assigned, organisation creation, admin shell account menu, organisation selector and switching, access lost (landing and rejected write), session expired, recovery, generic private denial; public top navigation (Sign in).

References: [access state review](../../../prototypes/frontend/access-states.html) and its [24 desktop/mobile captures](../../../docs/assets/mockups/access/README.md), produced and approved by the maintainer on 9 November 2026. They refine `review-states.html?state=onboarding`, `private-denied` and the M0 `context-replaced` shell state.

**Scope cut:** `public-signed-in` (account menu in the public application) is not built: the public application stays anonymous (W-06) and only links to the admin application. It returns with the participant portal (H2).

Interaction assumptions raised by the mockup session, answered 9 November 2026:

| # | Question | Decision |
|---|---|---|
| A-1 | Organisation name | Required after trimming, at most 80 characters (UTF-16 units, as the browser and .NET count them), no uniqueness |
| A-2 | Return after sign-in | Back to the requested address after the assignment and membership checks; otherwise the matching access state |
| A-3 | Unsaved input | Current tab's memory only; never web storage; lost on reload; never resubmitted automatically. After lost access or expiry, only what this person typed is shown again, for copying |
| A-4 | Switch with unsaved input | Ask before discarding (route deactivation guard). A switch from another tab reloads and discards |
| A-5 | Support | The contact given in the invitation (the platform operator). Ownership is verified out of band; the relink is a recorded host command (D-6) |

## Decisions

### D-1 External setup

Two application registrations in the shared directory, created by hand and documented in `docs/operations/identity.md` (new):

- `herald-api`: exposes the scope `access_as_user` and the application role `Organiser`; "assignment required".
- `herald-admin`: SPA platform, redirect URIs for `http://localhost:4200` (and later the deployed admin), API permission to `herald-api/access_as_user`; "assignment required". Assigning a person gives them the `Organiser` role.

Directory and client identifiers are not secrets, but they stay out of the repository: the AppHost reads them as parameters (user secrets) and passes them to the host (`Herald:Authentication:*`) and admin (`HERALD_AUTH_*`, read into a runtime configuration file the dev server serves). Without them the AppHost fails at start-up with the missing parameter's name.

*Rejected:* committing the identifiers in `appsettings.Development.json` (they identify the maintainer's directory in a public repository).

### D-2 API authentication

`Microsoft.AspNetCore.Authentication.JwtBearer` (Microsoft, MIT; the version matching the host's ASP.NET Core, checked before adding) with the directory's `ciamlogin.com` authority, the API's audience and the default lifetime checks. An `Organiser` policy (authenticated + role) is the default for every admin-group endpoint; public-group endpoints are anonymous. The existing host test that requires a group for every endpoint gains a twin: every admin endpoint requires the policy.

*Rejected:* `Microsoft.Identity.Web`. It adds configuration conventions, token caches and downstream-API helpers Herald does not use; plain JWT bearer validates the same token.

### D-3 Organisations module model

- `Person`: opaque id; unique `(DirectoryId, ObjectId)`; display name refreshed from the token; created on the first action that needs it.
- `Organisation` aggregate: id, name (A-1), created by/at, its memberships; raises `OrganisationCreated`. No integration event yet: no module consumes it (ADR 0008 applies with the first consumer).
- `Membership`: person, organisation, role `Owner`. The single-owner rule lives in the aggregate.
- `IdentityRelink` record: person, previous and new keys, operator, reason, time (ADR 0007).

Endpoints (admin group): `GET /api/me` (person and owned organisations), `POST /api/organisations` (create, D-5), `GET /api/organisations/{organisationId}` (organisation summary, through the organisation context).

### D-4 Organisation context

`Herald.ModuleHosting` defines `IOrganisationAccess` (is this person a current member of this organisation?) and a request-scoped `OrganisationContext`. The Organisations module registers the implementation through its entry point. A host middleware after authentication reads the `organisationId` route value; if present it resolves the person from the token, asks `IOrganisationAccess`, and either sets the context or answers the generic 404 problem (`type` `organisation-not-available`, no detail). Endpoints without the route value get no context. Other modules depend on the context only, so they never reference Organisations (ADR 0004). One lookup per organisation-scoped request; no cache, so removal takes effect on the next request.

*Rejected:* membership projections per module (revocation lags the outbox; duplicated access logic); Wolverine-only middleware (the check also has to cover any non-Wolverine endpoint).

### D-5 Retry-safe creation

The client generates the new organisation's id (`crypto.randomUUID()`) and keeps it for retries of the same attempt. The handler returns the existing organisation when id, name and creator match, 409 without detail when any differ, and creates it otherwise; the primary key decides a concurrent race. No receipts table: the identifier is the operation identity for this command.

### D-6 Support relink

A JasperFx host command, `dotnet run --project src/Herald.Host -- relink-person <personId> <directoryId> <objectId> --reason "..." --operator "..."`, run by the platform operator against the target database. It refuses a key that already belongs to a person and writes `IdentityRelink` in the same transaction. The verification steps (what the person must show) are in `docs/operations/identity.md`.

### D-7 Persistence isolation

In `Herald.ModuleHosting`:

- `modelBuilder.OrganisationOwned<TEntity>()` adds a shadow `OrganisationId` (indexed) and the global filter `OrganisationId == context.OrganisationId`. With no context the filter compares with a value no row has, so it returns nothing.
- A `SaveChanges` interceptor stamps added organisation-owned entries from the context and throws when a modified or deleted entry's `OrganisationId` differs, or when no context exists.
- Cross-organisation reads (`GET /api/me`) use `IgnoreQueryFilters()` on purpose; an architecture test lists the allowed call sites.

In this change only `Membership` is organisation-owned in production code (it is read across organisations by `/api/me`, the single exception). Tests use a probe module with an organisation-owned entity, like the messaging probes.

### D-8 Row-level security experiment

Task 3.4, on the probe table: `ENABLE` and `FORCE ROW LEVEL SECURITY`, a policy on `current_setting('herald.organisation_id', true)::uuid`, set with `set_config(..., true)` from a connection/transaction interceptor. Check pooled connections under concurrency, a Wolverine message handler with and without the context, the `/api/me` cross-organisation read, migrations run as the owner, and the cost. Outcome recorded below and in ADR 0014. Adopt only if the cross-organisation reads and handlers need no blanket bypass.

### D-9 Admin session and routes

- `@azure/msal-browser` (Microsoft, MIT; the maintainer chose it without `@azure/msal-angular` in task 5.1, see the implementation record) in the admin platform: redirect sign-in, a guard on every route, an interceptor attaching tokens to `/api` only. MSAL's cache uses `sessionStorage`; it holds tokens, not business data (W-06's rule on protected data in storage is about application data, and this exception is recorded here).
- Routes: `/` resolves the person (`GET /api/me`): no organisation → creation, one → `/organisations/<id>`, several → selector. Everything organisation-scoped lives under `/organisations/:organisationId`. `INITIAL_CONTEXT` comes from the session (person) and the URL (organisation); switching and sign-out use `AppContext.replace()`.
- Error mapping in the platform: provider error for an unassigned user, or 403 from the API → not-assigned; provider cancel/error → cancelled/failed; silent renewal failure → session expired; generic 404 for the working organisation → the generic denial (maintainer, task 5.3: the API cannot tell lost access from never having it). Each hides loaded private data; forms keep the person's input in signals (A-3).
- Features: `organisations` (creation, selector) in the admin app; the access states belong to the platform because they are about the session, not a feature.

### D-10 Public shell

The public top navigation's Sign in action is a link to the admin application's origin (configuration, like `HERALD_API_URL`). The public application does not load MSAL.

### D-11 Tests

- Host and use-case tests sign tokens with a test key: the test host replaces the authority's signing keys, so no test reaches the directory (ADR 0010, real PostgreSQL through Testcontainers).
- AT-12 cases: other owner reads and writes by direct id → 404 with no private content; removed membership → 404 on the next call; unauthenticated → 401; token without role → 403; every admin endpoint requires the policy.
- Isolation: probe module filter, stamping, missing context, the cross-organisation exception list.
- Admin: Vitest with a stubbed MSAL for each access state, unsaved input retention, switch confirmation, the sign-out full load, `axe-core`.

## Risks / Trade-offs

- [Assignment removal does not revoke issued tokens until they expire] → membership removal is immediate (D-4); token lifetime stays the directory default (about an hour); documented in the operations note.
- [The shared directory couples Herald to Arcana's administration] → Herald keys on its own person records; moving directories is a relink per person.
- [Global filters hide rows silently, which can look like missing data] → filters return nothing without a context instead of everything; an architecture test lists the explicit exceptions.
- [MSAL keeps tokens in `sessionStorage`] → recorded exception to W-06; tokens only, cleared on sign-out; revisit a backend-for-frontend if the threat model changes.
- [Local development needs the real directory] → tests never do; the AppHost names the missing parameter.

## Migration Plan

New schema content for Organisations only (migration `AddOrganisationAccess`). No existing data. Rollback is reverting the change; the application registrations can stay unused.

## Open Questions

None blocking. RLS was rejected for H1 on D-8's evidence (implementation record).

## Implementation record

### Authentication in the host (tasks 2.1–2.3, 9 November 2026)

- `Microsoft.AspNetCore.Authentication.JwtBearer` 10.0.14 (MIT; its dependency `Microsoft.IdentityModel.Protocols.OpenIdConnect` 8.19.2 is MIT), matching the other ASP.NET Core 10.0.14 packages.
- `HeraldAuthentication.AddHeraldAuthentication` in `Herald.ModuleHosting`: JWT bearer from `Herald:Authentication:Authority`/`Audience`, inbound claim mapping off (Herald reads `tid`, `oid`, `name` and `roles` as issued) and the `organiser` policy (authenticated + `Organiser` role). `MapHeraldApi` attaches the policy to every Wolverine endpoint whose `[EndpointGroupName]` is admin, so no endpoint opts in by hand.
- Missing configuration fails when the host **starts** (`ValidateOnStart`), not when it is built. A first version threw at registration and broke `openapi` export and `codegen write`, which build the host without sign-in configuration.
- AppHost parameters `auth-authority`, `auth-api-audience`, `auth-api-scope` and `auth-admin-client-id` (user secrets) go to the host as `Herald__Authentication__*` and to admin as `HERALD_AUTH_*` (consumed in task 5.1). Aspire reports an unset parameter in its dashboard; not exercised yet, since the registrations (task 1.3) do not exist.
- Tests: `TestTokens` signs directory-shaped tokens with a test RSA key and `HostFactory` gives the bearer handler that key, so nothing is fetched. `Every_admin_endpoint_requires_an_assigned_organiser` holds vacuously until the first admin endpoint (task 4.4 proves it fails); `The_host_does_not_start_without_its_sign_in_configuration` passes. Full .NET run: 56 tests pass; format, OpenAPI documents and generated Wolverine code show no drift.

### Organisation context and persistence isolation (tasks 3.1–3.3, 9 November 2026)

- `Herald.ModuleHosting`: `Caller` (from `tid`/`oid`), `IOrganisationAccess`, and `OrganisationContext` (scoped, entered once; entering another organisation in the same scope throws). It is registered with a factory, so Wolverine's generated code resolves the scope's instance instead of constructing its own; task 4.4 proves it through the host.
- `MapHeraldApi` adds the membership step ahead of the endpoints: a route with `{organisationId}` needs a `Caller` and a current membership, or it answers the 404 problem `organisation-not-available`. Exercised through real endpoints in task 4.4.
- **Deviation from D-7:** a base class, `OrganisationScopedDbContext`, instead of a model-builder extension plus a separate interceptor. EF Core only re-reads a filter's value per query when it is a member of the `DbContext`; a value captured from outside is frozen in the cached model. The base class exposes the current organisation, declares `OrganisationOwned<TEntity>()` (shadow `OrganisationId`, index, named filter `organisation`) and checks writes in `SaveChanges`: stamps added rows, rejects rows of another organisation (also those loaded past the filter) and any organisation-owned write without a context.
- Tests: new `tests/Herald.ModuleHosting.Tests` with a probe `DbContext` against PostgreSQL 18.3: filtered query, stamping, no context → no rows, no context → save fails, another organisation's row (loaded with `IgnoreQueryFilters`) cannot be changed, a planted foreign owner is rejected, a scope cannot switch organisation (7 pass). `IsolationTests.Only_reviewed_code_bypasses_the_organisation_filter` lists the files under `src/` allowed to call `IgnoreQueryFilters` (none yet).

### Row-level security experiment (task 3.4, 9 November 2026)

Probe table with `ENABLE` and `FORCE ROW LEVEL SECURITY`, a policy on `nullif(current_setting('herald.organisation_id', true), '')::uuid`, a non-superuser login role, and a `DbConnectionInterceptor` that runs `set_config(..., false)` when a connection opens in an organisation context (`RowLevelSecurityExperiment`).

Measured:
- A raw SQL query that skips the EF filter sees only its organisation's row.
- Npgsql resets session state when a connection returns to the pool: on a pool of one, the same backend process has no setting on the next open, so a scope without context sees nothing.
- 60 concurrent scopes alternating two organisations on a pool of four: each saw only its own row.
- An insert for another organisation is refused by the policy itself (SQLSTATE 42501).

Costs found:
- Superusers and, without `FORCE`, table owners bypass RLS. Aspire's local PostgreSQL and the test containers connect as a superuser, so the guard is invisible locally unless the host connects with a separate application role (and migrations with the owner): new AppHost setup, a second connection string and a role script.
- `GET /api/me` reads memberships across organisations; it would need a second policy on a person setting, set the same way.
- A message handler must enter its organisation before Wolverine's transactional middleware opens the connection, which is new plumbing for the first organisation-scoped message.
- One extra round trip per connection opened in an organisation context.

**Rejected for H1** (maintainer, 9 November 2026). The guard works, but locally it needs a separate application role and connection string to be visible at all, plus a person policy for `/api/me` and handler plumbing, while the EF filter and the save checks already cover every query and write that goes through a module's `DbContext`. Revisit before the first real deployment (M4), when database roles have to be created anyway. The experiment code was removed; this section is its record.

### Organisations domain (task 4.1, 9 November 2026)

- `Herald.BuildingBlocks` gets its first types (ADR 0006): `IDomainEvent`, `Entity<TId>` (identifier only; no equality override, nothing needs it yet) and `AggregateRoot<TId>` (records domain events). No value-object base: records give structural equality.
- `Domain`: typed `PersonId`/`OrganisationId`, `IdentityKey` (`tid`+`oid`), `Person` (display name trimmed and refreshable, never identity), `OrganisationName` (`Check` returns the broken rule, `required` or `too-long`, for field errors; `Create` throws on an unchecked bad name), `Organisation` (creator becomes the single `Owner` membership, records creator and time, raises `OrganisationCreated`) and `Repeats(name, creator)`, the domain half of D-5's retry rule. `IdentityRelink` waits for task 4.5.
- Tests: new `tests/Herald.Organisations.Tests`, 14 domain tests without mocks; architecture tests (42) still pass, including Domain depending only on the building blocks.

### Organisations persistence (task 4.2, 9 November 2026)

- `OrganisationsDbContext` derives from `OrganisationScopedDbContext`; migration `AddOrganisationAccess` creates `Persons` (unique `(DirectoryId, ObjectId)`), `Organisations` (name `varchar(80)`: PostgreSQL counts characters, never more than A-1's UTF-16 units), `Memberships` (organisation-owned, key `(OrganisationId, PersonId)`) and `IdentityRelinks` (both keys, operator, reason, time). `IdentityRelink` moved into the domain now (`Person.Relink`), since its table belongs here.
- **Two columns on `Memberships`** (maintainer's choice, 9 November 2026): EF Core needs a foreign key and its principal key to share a CLR type, so the typed `OrganisationRef` (to `Organisation.Id`) cannot be the `Guid` isolation column. Both exist and a check constraint keeps them equal. *Rejected:* a `Guid` key for `Organisation` (breaks ADR 0006's typed identifiers) and a typed key in `OrganisationOwned` (generic code in `Herald.ModuleHosting`, filter translation unproven).
- EF Core 10 neither indexes complex properties nor binds them to constructors: `Person` keeps its identity in two private properties behind `Identity`, and `Person`/`IdentityRelink` have private constructors for materialisation.
- Consequence for task 4.3: inserting the owner membership needs a context, so creation enters the new organisation's context before saving.
- Tests: 4 PostgreSQL tests in `Herald.Organisations.Tests` apply the real migration (stored organisation with owner and stamped column, identity read back, duplicate identity refused, relink stored); 2 domain tests for `Relink`. Full .NET run: 84 pass; no Wolverine code drift.

### Organisations features (task 4.3, 9 November 2026)

- `GET /api/me` (`getMe`): display name from the token and the organisations the person owns, oldest first; no person yet → empty list. A query: it creates nothing.
- `POST /api/organisations` (`createOrganisation`): field errors as a validation problem (`name`: `required`/`too-long`; `organisationId`: `required` when empty); registers the person on first use, otherwise refreshes the display name; an identical retry answers **201 with the original** (one success shape for the client), different content 409 with no detail. A new organisation enters its own context before the owner membership is added; Wolverine's transactional middleware saves. *Shortcut:* two simultaneous first attempts with the same id lose to the primary key with a 500 (retries follow a lost response, so they do not overlap).
- `GET /api/organisations/{organisationId}` (`getOrganisation`): name and id; the host's membership step has already answered 404 otherwise.
- `IOrganisationAccess` is `Persistence/OrganisationAccess`, registered by `OrganisationsModule`. It and `GetMe` are the two reviewed `IgnoreQueryFilters` call sites in `IsolationTests`.
- The `organiser` policy now also requires `tid` and `oid`, so every admin endpoint has a `Caller`.
- **Found while generating code:** Wolverine HTTP resolved services from a new scope per request, not the request's, so handlers would not see the organisation the membership step entered. `MapHeraldApi` sets `ServiceProviderSource.FromHttpContextRequestServices`, and `AddHeraldModule` marks `OrganisationContext` for service location (`AlwaysUseServiceLocationFor`), which Wolverine requires for its factory registration. The generated handlers now take the context from `httpContext.RequestServices`; task 4.4 tests it end to end.
- Wolverine code and the OpenAPI documents/client regenerated (task 4.6 repeats this at the end). Full .NET run: 84 pass.

### Use-case and API tests (task 4.4, 9 November 2026)

- `OrganisationAccessTests` (14, host in memory over its own PostgreSQL 18.3 container, one host for the collection): 401 without a token, 403 without the role, newcomer with no organisations, newcomer creates and owns (`/api/me` and the summary), `required`/`too-long` field errors, identical retry returns the original, reused id with another name or person → 409 without the name, same-name organisations, same display name different persons, changed token name keeps the person, another owner by direct id → 404 `organisation-not-available` without the name, missing organisation → the same 404, removed membership → 404 on the next call and gone from `/api/me`.
- Organisation-scoped *writes* by direct id have no endpoint in this change; they are covered by the save checks (task 3.3) and by the 409 on a reused id. The first organisation-scoped write endpoint (H1 tournaments) adds its own 404 test.
- `GET /api/organisations/{organisationId}` now reads the organisation from `OrganisationContext`, so its tests prove end to end that the membership step's context reaches the handler (the fix found in task 4.3).
- **Two test defects found and fixed:**
  - Test tokens were never accepted: with an authority configured, validation reads issuer and keys from the configuration manager, not from `JwtBearerOptions.Configuration`. `HostFactory` now installs a `StaticConfigurationManager` with the test key. No production change.
  - `Every_admin_endpoint_requires_an_assigned_organiser` could not tell an empty endpoint list from a protected one. It now also asserts `/api/me` is among the route patterns, and `The_admin_policy_check_catches_an_admin_endpoint_that_allows_anonymous_access` runs its predicate on a synthetic anonymous admin endpoint.
- Full .NET run: 99 pass; format clean; no Wolverine or OpenAPI drift.

### Support relink (task 4.5, 9 November 2026)

- Use case `Features/RelinkPerson` in the Organisations module: refuses a missing operator or reason, an unknown person, the person's current identity and an identity that belongs to another person (the unique index also refuses a concurrent claim); otherwise `Person.Relink` and the `IdentityRelink` record are saved in one transaction. Returns why nothing changed, or null.
- Command `relink-person <personId> <directoryId> <objectId> --reason … --operator …` lives in the host (JasperFx discovers commands in the entry assembly; the host already composes modules) and only builds the host, opens a scope and calls the use case; exit code 1 with the reason on refusal.
- Tests: 4 against PostgreSQL in `Herald.Organisations.Tests` (new identity resolves to the same person and memberships, old one resolves to none; record with both keys, operator, reason and time; occupied identity refused with nothing changed; unknown person or blank reason refused). Smoke run of the real command against a migrated temporary database: unknown person → message and exit code 1. Full .NET run: 103 pass; no Wolverine code drift.
- `docs/operations/identity.md` (task 1.3) documents when and how to run it.

### Generated code (task 4.6, 9 November 2026)

`codegen write` and `pnpm api:generate` were run with each endpoint change (tasks 4.3–4.4); the final run shows no drift. With the regenerated admin client, web lint and boundary fixtures (15/15), Vitest for every project and all production builds pass.

### Admin sign-in platform (task 5.1, 9 November 2026)

- **Deviation from D-9 (maintainer's choice):** `@azure/msal-browser` 5.29.0 only (MIT; its one dependency `@azure/msal-common` 16.16.1 is MIT), pinned exactly; released 6 November 2026, chosen over 5.27.0 for the latest fixes. `@azure/msal-angular` 6.3.1 (MIT, supports Angular 22) was left out: Herald needs only a guard and an interceptor, its interceptor's handling of relative `/api` URLs is opaque, and task 5.3 maps each MSAL error to an access state itself.
- `platform/session.ts`: `AUTH_CONFIG`, `MSAL_CLIENT` (a `PublicClientApplication` with `sessionStorage` cache and the authority's host as known authority) and `Session` (`start` completes a returning redirect before the first navigation; `signIn(returnTo)` uses `redirectStartPage`, so MSAL returns to the requested address, A-2; `token` acquires silently). `platform/sign-in.ts`: `signedIn` guards every route through a parent route, `apiToken` attaches the bearer token to `/api` and `/api/...` only.
- Runtime configuration: `main.ts` reads `/runtime-config.json` before bootstrapping and shows a plain failure without it. `start:admin` writes that git-ignored file from `HERALD_AUTH_*` (`projects/admin/write-runtime-config.mjs`); hosting provides it in M4.
- **Budget:** the admin's initial bundle was 620 kB after this task; the warning budget went from 500 kB to 700 kB (error stays at 1 MB). Task 5.2 measured it again and raised it to 900 kB (see there).
- Tests: `sign-in.spec.ts` (signed-in person passes; a visitor signs in with the requested address; the token goes to `/api/me` and `/api`, never to `/runtime-config.json`, another origin or `/apis`); the shell tests run with a signed-in session. Web lint, boundaries (15/15), all Vitest projects and all builds pass. Error handling (expired session, unassigned person) belongs to task 5.3.

### Session-driven context and routes (task 5.2, 9 November 2026)

- `INITIAL_CONTEXT` comes from the session (`homeAccountId`) and the address (`organisationInPath`: `/organisations/<uuid>`, lower-cased). `provideAppContext` settles the session (completing a returning redirect) before creating `AppContext`, so guards and the context see the returning person.
- Routes, all under the `signedIn` parent: `/` (`resolveHome`, from `GET /api/me`: none → `/organisations/new`, several → `/organisations`, one → its workspace), `/organisations` and `/organisations/new` (placeholder pages in `features/organisations`, completed by task 5.4), `/organisations/:organisationId` (`inOrganisation`) with the overview and a scoped not-found page, and a top-level not-found.
- **Entering is not switching:** `AppContext.enter(target)` opens a workspace with a full load. From a document without an organisation it uses `location.replace` (no history entry for `/`, no message to other tabs); from another organisation it is a replacement (`replace`: other tabs reload, A-4). Without this, opening a new tab at `/` would reload every other tab. `AppContext.signOut()` tells the other tabs, then `Session.signOut()` (MSAL `logoutRedirect`); the account menu that calls it is task 5.4.
- The rail, the overview, the not-found page and the "replaced elsewhere" notice show the organisation's name from `GET /api/organisations/{id}` (`injectWorkingOrganisation`, key `['org', id, 'summary']`); `AppContext.home` is the working organisation's overview or `/`.
- **Budget, measured:** the admin's initial bundle is 830 kB raw (210 kB gzip): `@angular/core` 399 kB, `@azure/msal-browser` 212 kB, `@azure/msal-common` 129 kB, router 91 kB, TanStack query-core 37 kB (now initial because the shell queries the organisation). Completing the redirect pulls in more of MSAL than task 5.1's estimate of 120 kB. The warning budget goes to 900 kB (maintainer, 9 November 2026); the error stays at 1 MB.
- Tests: `routing.spec.ts` (home: none, several, one with `location.replace` and no message to other tabs; workspace: same organisation passes case-insensitively, another one is a replacement, entering from none is not; sign-out tells other tabs and calls the session), `organisationInPath` cases, and the shell tests on `/organisations/<id>` with the name from a stubbed API. Web lint, boundaries (15/15), all Vitest projects and all builds pass.

### Access states (task 5.3, 9 November 2026)

- **Mechanism:** `platform/access.ts` holds `AccessState`: `report(problem)` replaces the whole workspace (the shell renders `AccessPage` instead of the rail and routes), clears the query cache and captures the person's unsaved input from forms registered with `keepDraft` (A-3: this tab's memory only, never storage, never resubmitted, offered for copying). `AccessPage` is app composition, because the import matrix keeps `ui` out of platform; the decision of which state applies stays in platform.
- **Mapping:** a returning redirect that failed (`Session.failure`): AADSTS50105 → not assigned; `user_cancelled`/`access_denied` → cancelled; other → failed. The guard shows that state instead of redirecting again, and shows "Taking you to sign in" while it redirects. `apiToken`: no token without interaction → session expired. `accessErrors` (Herald API only): 401 → session expired; 403 → not assigned; 404 `organisation-not-available` → the generic denial. Other 404s stay with their page.
- **Maintainer's decisions (9 November 2026):** an unavailable organisation always gets the generic denial ("This page is unavailable"), never "access is no longer available", because the API's 404 is the same for lost access and no access; a rejected write adds "Your change was not saved" and the kept input to it. The recovery page keeps the mockup's text but offers only working actions ("Try signing in", whose provider page offers password recovery, and "Back to public page"); "Open account recovery" and "Contact support" have no configured destination.
- **Returning:** until the session settles the app is not rendered; `index.html` shows "Checking your access to Herald…" in `app-root`.
- "Back to public page" and the top "Tournaments" link use `publicUrl` from the runtime configuration (`HERALD_PUBLIC_URL`, passed by the AppHost from the public app's endpoint).
- Not built: the mockups' "Continue to sign in"/"Cancel" on the redirecting state (the redirect starts by itself) and the account disclosure in the access header (the account menu is task 5.4).
- Tests: `access.spec.ts` (error mapping, cache cleared, only registered live drafts kept, interceptor 401/403/404 and what it ignores), `access-page.spec.ts` (each state's heading with `axe-core`, sign-in back to the same address, another account, sign-out, no organise path when unassigned, input kept and copied, generic denial names nothing, recovery from a failed sign-in, public link), `sign-in.spec.ts` (failed return shown without redirecting, redirecting state, token failure expires the session) and the shell (an access state removes the rail and the organisation's name). 64 admin tests; web lint, boundaries, all Vitest projects and builds pass.
- Visual check: the built admin served with a placeholder configuration, captured by Chrome at 1440 and 390 px ("Taking you to sign in"): layout matches the reviewed captures (inverse top bar, panel and side note, single column on mobile), no horizontal overflow, no page errors; body text raised to 16 px to match them. Other states share the layout and are covered by the component tests, not captures.

### Organisations feature, selector and account menu (task 5.4, 9 November 2026)

- **Layouts:** routes with `data: { standalone: true }` (creation) and every access state use the top bar (brand, "Tournaments" to the public app, account menu) over a panel and side note; the shared layout classes are in the admin's global styles. Organisation workspaces keep the rail, now with "Organisation · Owner", "Switch organisation" only when the person owns several (`GET /api/me`, `injectMe`), and a page header with "Organiser workspace" and the account menu.
- **Account menu** (`AccountMenu`, composition): a disclosure button "<name> · Account" (`aria-expanded`, Escape closes it and returns focus) with the person's name, "Signed in with your account provider", "Organise" (to the working organisation or `/`; hidden for an unassigned account) and "Sign out" (`AppContext.signOut`).
- **Creation** (`features/organisations`): A-1 validated in the browser with the API's rule codes (`required`, `too-long`; the API's own field errors are shown the same way), `aria-invalid`/`aria-describedby` and focus on the field; "Creating organisation…" with the field read-only, `aria-busy` and a status message, and no second submit; a failed save shows "Organisation not created", keeps the name and offers "Try again". D-5 in the client: one `crypto.randomUUID()` per attempt, reused while the trimmed name is unchanged, replaced when the name changes or the API answers 409. Success enters the new workspace with a full load to `/organisations/<id>?created`; the overview shows "Organisation created · You are now the only owner of <name>" once and drops `?created` from the address. The typed name is registered with `AccessState.keepDraft` (A-3).
- **Selector** at `/organisations` (from `/` with several organisations) and `/organisations/<id>/switch` (from the rail, marking the current one "Selected", with "Keep current organisation"); "Switch to <name>" is `AppContext.enter`, a full load and a replacement for other tabs (A-4). The mockups' intermediate "Switching organisation" screen is not built: the full load starts at once and the reloaded workspace shows only the new organisation.
- **A-4:** `confirmLeave` (platform) guards the creation route: leaving it with unsaved input asks first through the `CONFIRM` token (the browser's confirm dialog; the access-state mockups have no dialog design). A switch from another tab reloads without asking, as decided.
- **Found and fixed:** the shell's queries (`/api/me`, the working organisation) ran before sign-in, so a deep link without a session would have shown "session expired" instead of signing in; both now wait for a signed-in account.
- **Contract noise noticed:** the admin OpenAPI document also lists `200 IResult` and a bare `404` for `createOrganisation`, which Wolverine adds for an `IResult` endpoint; the client is called with `CreatedOrganisation` explicitly. Left as is; worth cleaning with the next endpoint change.
- Tests: creation (required, 80/81 characters after trimming, focus and ARIA, success enters with `?created`, creating state without double submit, failed save keeps the name and the identifier, new identifier on name change and 409, API field error, lost access left to its state, draft kept, `axe-core`), selector (current marked, switch is a full load, no current organisation, `axe-core`), leave guard (no question without input, the answer respected), shell (switch link only with several organisations, account menu with sign-out and Escape, creation without the rail, created notice once). 84 admin tests; web lint, boundaries, all Vitest projects and builds pass. Not captured in a browser: the signed-in layouts need a real session (task 6.2).

### Public Sign in (task 5.5, 9 November 2026)

- The public header's action is now "Sign in", a link to the admin application (D-10); the public app loads no MSAL and stays anonymous. The hero's "Open the organiser workspace" uses the same address.
- `ORGANISER_WORKSPACE_URL`: the server reads `HERALD_ADMIN_URL` (`provideOrganiserWorkspaceUrl`) and stores it in the transfer state, so the browser keeps the same address after hydration instead of falling back; without it, `/admin/` on the same host (shortcut until hosting, M4). A prerendered page takes the value present at build time: built with `HERALD_ADMIN_URL=http://localhost:4200`, `index.html` carries that `href` and the same value in its transfer state.
- The AppHost passes `HERALD_ADMIN_URL` (admin's endpoint) to public, next to `HERALD_PUBLIC_URL` for admin.
- Tests: the public shell test that asserted no sign-in now asserts a Sign in link to the admin address (default and from the transfer state) and still no registration or results. Public tests 12; web lint, boundaries, all Vitest projects, builds and the SSR isolation check pass.
