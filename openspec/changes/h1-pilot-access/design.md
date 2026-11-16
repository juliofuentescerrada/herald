## Context

See proposal.md (Why). The host validates directory tokens with the JWT bearer handler and the `organiser` policy (role `Organiser`, `tid` and `oid`). `HeraldApi.EnterOrganisation` resolves the route's organisation through `IOrganisationAccess.FindMemberAsync` and enters an `OrganisationContext` with the actor; every module's DbContext filters by it (ADR 0014).

## Goals / Non-Goals

**Goals:**

- A server application can do exactly what an owner allowed, for exactly the tournaments allowed, and stops the moment it is revoked.

**Non-Goals:**

- Application management beyond grants; rate limits; webhooks.

## Decisions

### D-1 Two callers, one context

The `organiser` policy accepts either role: `Organiser` (a person) or `PilotApplication` (an application, whose token has no `scp`). `Caller` carries its kind. For an application, `IOrganisationAccess` returns the active grant for (organisation, directory, object) instead of a membership; `OrganisationContext` keeps the grant's actor identifier and scope. Endpoints that create organisations or read `/api/me` refuse applications.

### D-2 The grant

`ApplicationGrant(id, organisation, name ≤ 80, directoryId, objectId, tournaments: all | list, groups, grantedBy, grantedAt, revokedBy?, revokedAt?)`. One active grant per application and organisation; changing a grant is revoke and grant again, keeping both. The grant's id is the actor recorded by modules, and Organisations resolves it to "name (granted by …)" for history.

### D-3 Operation groups

Each admin endpoint declares one group with an attribute beside its `EndpointName`: `read`, `setup`, `entries`, `schedule`, `results`, `finalisation`. An endpoint filter, for application callers, checks the group and, for tournament routes, the tournament against the grant; a person is unaffected. A host test fails on an admin endpoint with no group.

### D-4 Denials

No grant or a revoked one: 404 `organisation-not-available`, as for a person without membership. Grant present, operation or tournament outside it: 403 with problem type `operation-not-granted`, naming the group, never the tournament's content.

### D-5 Screens

Workspace navigation gains "Applications" after Tournaments. The page lists grants: name, application identifier (monospace), scope ("All tournaments" or the titles), groups as labels, state ("Active" or "Revoked by … at …"), and "Revoke" (danger, secondary) on active ones. "Grant access" (primary) opens a dialog with Name, Application identifier, Tournaments (all or a list of checkboxes), Operations (checkboxes with one-line descriptions) and "Grant access". Empty: "No application has access. Grant access to let a pilot application act for this organisation."

## Visual input

Prototypes: `prototypes/frontend/correct-close-open-states.html`.

| Screen | States (`?state=`) |
|---|---|
| Applications page | `apps-empty`, `apps-list`, `apps-grant`, `apps-grant-errors`, `apps-revoke` |

Visual choices (G-/RU-): revocation is immediate and final for that grant, so it uses the danger tone; groups as labels keep the list quick to read; identifiers in monospace.

## Assumptions for review

- **A-1** The owner copies the application identifier from the provisioning procedure; Herald does not look it up in the directory.
- **A-2** Read access is a group like the others, so an application can be write-only for results only if it also has `read`; the form preselects nothing.

## Implementation notes

Choices made while implementing, within D-1 to D-4; each is for the review of the slice's pull request.

- **N-1** The grant form's application identifier is the application's object identifier (`oid`) in Herald's directory, the one the owner signs in with; the grant stores that directory with it (A-1).
- **N-2** Endpoint groups: `read` for every admin read; `setup` for creating, saving and publishing a tournament and opening or closing its registration; `entries` for guests, entries, admission, check-in, absence and rosters; `schedule` for drafts, schedule publication and withdrawal and starting the competition; `results` for lineups, starting a match, results, departures and sanctions. `finalisation` has no endpoint until `h1-finalisation`. Managing grants is `[PeopleOnly]`: no grant allows it.
- **N-3** A grant for selected tournaments does not allow an endpoint that reaches every tournament (listing and creating tournaments), declared with `AllTournaments`. Guests belong to the organisation, not a tournament, so the `entries` and `read` groups reach them whatever the tournaments.
- **N-4** `OperationGroup` lives in `Herald.BuildingBlocks`: the Organisations domain holds it and may depend only on the building blocks.
- **N-5** The responsible source is named through `IActorNames` (ModuleHosting, implemented by Organisations): the match view's result carries `recordedBy`, "Results bot (granted by Alex Morgan)" or the person's name. No screen shows it yet; the change log (`h1-change-log`) is where history is read. It is resolved at run time (`AlwaysUseServiceLocationFor`), so Competition's generated code never builds the Organisations database context.
- **N-6** Grant tournaments are identifiers the Organisations module does not check: an identifier of another organisation's tournament never matches, because the application's requests there have no grant.
- **N-7** The fake identity provider issues the pilot application's client-credentials token (`e2e/environment.ts`, `pilotApplication`; checked by hand against the container while implementing). The suite reaches the system only through the browser, so journey 29 does not use it; `h1-api-journey`'s independent client does.

## Risks / Trade-offs

- [A token issued before revocation] → revocation is checked on every request, so the token stops working at once; tokens are not revoked at the directory.
