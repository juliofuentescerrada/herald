## Status

**Proposed in H1 batch 3's proposals pull request, 15 November 2026, as a split of `h1-api-journey` (Q1).** The rules come from the batch's decision session of the same day, recorded in the functional discovery (F-01a, §13.1; §15 rows D-12, D-14 and D-21). It depends on batch 2 only and can run beside the batch's other slices: it changes the Organisations module and the host's authentication, not the competitive modules' models. Merging the proposals pull request approves this change (ADR 0018); task 1.1 records that approval.

## Why

The API accepts only a person's token with the `Organiser` role. A server application that should record results for one tournament has no way in, and nothing scopes what it could do. D-12, confirmed on 15 November 2026, allows pilot server applications under a revocable grant the owner records in Herald. AT-12 and AT-14 test it.

## What Changes

- **Interactive applications (F-01a):** an application acting for a person uses that person's token, issued for Herald's API to an application registration the platform operator has allowed; the person's role and organisation membership decide, as for the admin application. The procedure is documented; no code changes this path.
- **Pilot server applications (D-12):** an application authenticates with client credentials and the new `PilotApplication` application role, which the platform operator assigns through the documented provisioning procedure. It is identified by its directory and object identifiers, never by name.
- **Grants:** the organisation's owner records a grant for an application in Herald: a name for it, its application identifier, the tournaments it covers (all of the organisation's or selected ones) and the operations it may perform, chosen from groups: read, tournament setup, registration and entries, schedule, results and corrections, finalisation. A grant can be revoked at once; it is kept with who granted and revoked it and when.
- **Enforcement:** every admin request by an application resolves the organisation through its grant, then checks the tournament and the operation's group; anything else is the same generic 404 or 403 a person gets (F-01a, AT-12). No grant, a revoked grant or an expired token: nothing. A request already applied keeps its effect and authorship.
- **Responsible source (API-10):** writes by an application record it as the actor, with the grant, so history shows "Results bot (granted by Alex Morgan)". A person's grant never extends to another organisation.
- **Admin application:** the organisation's workspace gains an "Applications" page: the list of grants with their scope and state, "Grant access" (a form with name, application identifier, tournaments and operation groups) and "Revoke" (danger, confirmation).
- **Notifiable facts (ADR 0017):** none.
- One end-to-end journey (29): an owner grants a pilot application access to one tournament's results, sees it listed and revokes it.

Out of scope: an application console or self-service registration (H5), per-application rate limits and compatibility commitments (H5, D-14), webhooks (H5), competitor or team-representative applications (H2).

## Decision rows

| Row | Status | Used for |
|---|---|---|
| D-12 Pilot result-source authority | Confirmed for H1 15 Nov 2026 | Owner-recorded revocable grant by organisation, tournament and operation; recorded source |
| D-14 Ecosystem opening | Confirmed for H1 15 Nov 2026 | Pilot applications only, documented procedure, no console |
| D-21 H1 onboarding/private access | Confirmed | Assignment by the platform operator; generic denial |

## Open questions for the review

- **Q1** The roadmap kept `h1-api-journey` whole unless its proposal added API contract that does not exist yet. Grants for server applications and queryable receipts are both new, so the slice is split: this change (grants, authentication) and `h1-api-journey` (receipts and the independent client's journey). Confirm the split; a new slice issue is then added to the batch.
- **Q2** Operation groups instead of single operations keep the grant form short and survive new endpoints. Confirm the six groups, or name another set.

## Screens

Prototypes in `prototypes/frontend/correct-close-open-states.html` (design.md, Visual input):

- **Applications page (new):** empty; list with an active and a revoked grant; grant form; grant form with errors; revoke confirmation.
- **Workspace navigation (modified):** "Applications".

## Capabilities

### New Capabilities

- `pilot-access`: grants for pilot server applications and their enforcement.

### Modified Capabilities

- `organisation-isolation`: applications resolve their organisation through a grant.
- `end-to-end-journeys`: journey 29.

## Impact

- `Herald.ModuleHosting`: the `PilotApplication` role in `HeraldAuthentication`; `Caller` gains its kind (person or application); `OrganisationContext` keeps the grant; an endpoint filter checks the operation group from each endpoint's declared group.
- `Herald.Organisations`: `ApplicationGrant` aggregate; features `GrantApplication`, `RevokeGrant`, `ListGrants`; `IOrganisationAccess` resolves grants; migration.
- Every admin endpoint declares its operation group (a host test fails otherwise, like the document group).
- Admin OpenAPI document and client; Wolverine's generated code; admin `organisations` feature (Applications page).
- `docs/operations/identity.md`: provisioning and revocation procedure for interactive and server pilot applications. `e2e/`: journey 29 and its test script; the fake identity provider issues application tokens (ADR 0015). `tools/Herald.Seed`: an organisation with an active and a revoked grant.
