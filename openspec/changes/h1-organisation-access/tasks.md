## 1. Review gates

- [x] 1.1 Review the proposal, specs, design and ADR 0014; record implementation approval in proposal.md and design.md (9 November 2026: approved by the maintainer)
- [x] 1.2 Visual input: access-state prototype and captures reviewed; A-1–A-5 answered; `public-signed-in` deferred to H2 (9 November 2026, design.md)
- [ ] 1.3 Create the `herald-api` and `herald-admin` registrations in the shared directory with assignment required, the `Organiser` role and the `access_as_user` scope; write `docs/operations/identity.md` (setup, assignment, removal, recovery verification and relink); maintainer assigns at least one test person

## 2. Authentication in the host

- [x] 2.1 Check the licence and version of `Microsoft.AspNetCore.Authentication.JwtBearer`; add JWT bearer validation and the `Organiser` policy as the admin-group default; public group anonymous
- [x] 2.2 AppHost parameters for directory, API and admin identifiers passed to host and admin; a clear start-up failure when missing
- [x] 2.3 Test token issuer for host tests; tests: every admin endpoint requires the policy (failing test names the endpoint), the host does not start without its sign-in configuration. The 401/403 cases need an admin endpoint and move to 4.4

## 3. Organisation context and isolation

- [x] 3.1 `IOrganisationAccess` and request-scoped `OrganisationContext` in `Herald.ModuleHosting`; host middleware resolving `{organisationId}` with the generic 404 problem
- [x] 3.2 `OrganisationOwned<TEntity>()` (shadow property, index, global filter with no-context-no-rows) and the save interceptor (stamp, reject other organisation, require context)
- [x] 3.3 Probe module tests against PostgreSQL: filtered query, stamped insert, cross-organisation update rejected, no context returns nothing; architecture test listing allowed `IgnoreQueryFilters()` call sites
- [x] 3.4 RLS experiment on the probe table (D-8); record adopted or rejected with evidence in design.md and ADR 0014; if adopted, add the policy and a test where a raw query bypassing EF still sees only its organisation

## 4. Organisations module

- [x] 4.1 Domain: `Person`, `Organisation` with its single-owner membership and `OrganisationCreated`, name rules (A-1); domain tests without mocks
- [x] 4.2 Persistence and migration `AddOrganisationAccess`: unique `(DirectoryId, ObjectId)`, `Membership` organisation-owned, `IdentityRelink`
- [x] 4.3 Features: `GET /api/me`, `POST /api/organisations` (D-5 retry semantics), `GET /api/organisations/{organisationId}`; `IOrganisationAccess` implementation registered by the module entry point
- [x] 4.4 Use-case/API tests: 401 without a token and 403 without the role on `GET /api/me`; the admin-policy test fails when an admin endpoint allows anonymous access; newcomer creates and owns; validation errors; identical retry returns the original; reused id conflicts without detail; same-name organisations; same display name, different persons; email change keeps the person; other owner reads/writes by direct id → 404 without private content; removed membership → 404 next call
- [x] 4.5 `relink-person` host command (D-6) with tests: relinked identity resolves, old one does not, occupied key refused, relink recorded
- [x] 4.6 Regenerate Wolverine code (`codegen write`) and the OpenAPI documents and client (`pnpm api:generate`)

## 5. Admin and public applications

- [x] 5.1 Check licences and versions of `@azure/msal-angular` and `@azure/msal-browser`; add them to the admin platform with redirect sign-in, route guard, `/api`-only token interceptor and runtime configuration
- [x] 5.2 Session-driven `INITIAL_CONTEXT`, `/` resolution (none/one/several) and `/organisations/:organisationId` routes; sign-out and switching through `AppContext.replace()`
- [x] 5.3 Platform access states from the mockups: redirecting/returning, failed, cancelled, not assigned, session expired, access lost (landing and rejected write), recovery, generic denial; loaded private data hidden, typed input kept for copying (A-3)
- [x] 5.4 `organisations` feature: creation form (validation, submitting, failed save with input kept, created) with retry-safe id; selector (one/several, switching, confirmation with unsaved input A-4); account menu in the shell
- [ ] 5.5 Public shell Sign in link to the admin origin; update the public shell tests that asserted no sign-in
- [ ] 5.6 Vitest for each state, input retention, switch confirmation, sign-out full load and `axe-core`; boundary checks pass

## 6. Validation and completion

- [ ] 6.1 Full run: format, build, all .NET tests, web lint/tests/boundaries/builds, codegen and API drift checks; record in design.md
- [ ] 6.2 Manual run through Aspire with the real directory: assigned and unassigned person, create, switch between two organisations in two tabs, sign out; compare with the reviewed captures and record differences
- [ ] 6.3 Update README status, roadmap, visual direction (UJ-01 row implemented) and ADR 0014 status proposal; acceptance review against the specs in design.md
