## Status

**Approved for implementation on 9 November 2026** (gate 1.1). D-04 and D-21 were confirmed the same day and are recorded in the functional baseline as part of this change. The access mockups ([access states](../../../docs/assets/mockups/access/README.md)) and the answers to their five interaction assumptions are in `design.md`.

## Why

Every H1 command acts for an organisation, and H1 requires that another organisation's operator cannot read or mutate it (AT-12). Nothing in Herald knows who is calling or for which organisation. Building tournaments first would mean retrofitting authority into every handler and endpoint; sign-in, organisation context and isolation have to come first.

## What Changes

- Sign-in for the admin application through the External ID directory Herald shares with Arcana. Only people the platform operator assigns to Herald's application can sign in or call admin endpoints; there is no self-service registration.
- Herald identifies a person by the directory and object identifiers of the token, never by email, and authorises through its own memberships.
- A signed-in person can create an organisation and becomes its single owner, list the organisations they own and switch between them. Creation is retry-safe.
- Organisation isolation: organisation-scoped endpoints resolve the caller's membership before any handler runs; a missing membership looks the same as a missing resource. Persistence scopes organisation-owned data with an EF Core global query filter on an organisation shadow property and stamps it on writes. PostgreSQL row-level security is evaluated in a bounded experiment and adopted only if it fits.
- A recorded support procedure relinks a person whose provider recovery failed, without merging identities or copying permissions.
- Admin shell: real session, account menu and sign-out, organisation selector and the reviewed access states (sign-in hand-off, not assigned, creation, switching, access lost, session expired, recovery, generic denial). Unsaved input survives only in the current tab.
- Public shell: a **Sign in** action that leads to the admin application. **Scope cut:** the signed-in account menu of the public mockup (`public-signed-in`) waits for the participant portal (H2), because the public application stays anonymous (W-06).
- D-04 (round-robin profile, including the operator's seeding draw) and D-21 (H1 access) are recorded as confirmed in `docs/herald-functional-discovery.md`, and the access mockups are added to the visual direction.
- A new ADR records the identity provider, the authorisation split and the isolation mechanism.

Out of scope: tournaments and every other H1 feature, collaborators and invitations (H2), pilot API applications and their grants (D-12, the API access slice), guests (D-22), participant sign-in in the public application, cloud deployment.

## Capabilities

### New Capabilities

- `sign-in`: assigned-only sign-in and sign-out for the admin application, how the API authenticates callers, the person's identity key, session expiry and recovery.
- `organisation-access`: creating an organisation with its single owner, listing and switching the organisations a person owns, and the support relink.
- `organisation-isolation`: membership resolution for organisation-scoped requests, denial without disclosure, and the persistence filter that scopes organisation-owned data.

### Modified Capabilities

- `frontend-shells`: the public shell offers sign-in as working functionality (a link to the admin application), and the admin shell requires a session.
- `frontend-boundaries`: the state lifecycle is driven by real sign-out, session expiry and lost access instead of test contexts only.

## Impact

- Backend: `Herald.Organisations` gains its domain, features and migrations; the host gains JWT bearer authentication and authorisation; `Herald.ModuleHosting` gains the organisation context and the EF Core scoping shared by every module. New package: `Microsoft.AspNetCore.Authentication.JwtBearer` (MIT).
- Frontend: admin platform gains the session (`@azure/msal-angular` and `@azure/msal-browser`, MIT; exact versions and licences checked before adding), an organisation feature and the access states; public shell gains the sign-in link. The admin OpenAPI document and generated client gain the new endpoints.
- External setup outside any repository's state: two application registrations (API and admin SPA) in the shared directory, with assignment required. Local development needs them; tests do not (they sign their own tokens).
- AppHost passes the sign-in configuration to the host and admin. CI is unchanged apart from the new tests.
- Documents: new ADR, ADR 0012's identity line, functional discovery (D-04, D-21), visual direction (UJ-01 row), roadmap and README status at completion.
