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

- `@azure/msal-angular` and `@azure/msal-browser` (Microsoft, MIT; exact versions and their Angular support checked before adding) in the admin platform: redirect sign-in, a guard on every route, an interceptor attaching tokens to `/api` only. MSAL's cache uses `sessionStorage`; it holds tokens, not business data (W-06's rule on protected data in storage is about application data, and this exception is recorded here).
- Routes: `/` resolves the person (`GET /api/me`): no organisation → creation, one → `/organisations/<id>`, several → selector. Everything organisation-scoped lives under `/organisations/:organisationId`. `INITIAL_CONTEXT` comes from the session (person) and the URL (organisation); switching and sign-out use `AppContext.replace()`.
- Error mapping in the platform: provider error for an unassigned user, or 403 from the API → not-assigned; provider cancel/error → cancelled/failed; silent renewal failure → session expired; generic 404 for the working organisation → access lost. Each hides loaded private data; forms keep the person's input in signals (A-3).
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

None blocking. RLS adoption is decided by D-8's evidence.

## Implementation record

(Filled during `/opsx:apply`.)
