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
- **N-3** A grant for selected tournaments does not allow an endpoint that reaches every tournament, declared with `AllTournaments`: listing and creating tournaments, and the organisation's guests (finding and creating them), since guests are shared by all its tournaments (herald-reviewer finding 2).
- **N-4** `OperationGroup` lives in `Herald.BuildingBlocks`: the Organisations domain holds it and may depend only on the building blocks.
- **N-5** The responsible source comes from the existing access step: `IOrganisationAccess` returns the actor's name with its identifier (a person's display name, or "Results bot (granted by Alex Morgan)"), `OrganisationContext.ActorName` carries it, and Competition keeps it with the result it records (`Resolution.RecordedByName`, shown as the match view's `recordedBy`). No new port between modules (herald-reviewer finding 1, ADR 0004/0014); the name is the one at the time of recording. Results recorded before this change, and those a departure resolves, have none. No screen shows it yet; the change log (`h1-change-log`) is where history is read.
- **N-6** Grant tournaments are identifiers the Organisations module does not check: an identifier of another organisation's tournament never matches, because the application's requests there have no grant.
- **N-7** The fake identity provider issues the pilot application's client-credentials token (`e2e/environment.ts`, `pilotApplication`; checked by hand against the container while implementing). The suite reaches the system only through the browser, so journey 29 does not use it; `h1-api-journey`'s independent client does.
- **N-8** The page lives in its own admin feature, `applications`, rather than in `organisations` as the proposal's Impact says: it has its own route and queries and shares nothing with the organisation selector or creation (herald-reviewer finding 5).
- **N-9** Every grouped endpoint declares the 403 `operation-not-granted` response in the admin OpenAPI document (herald-reviewer finding 4).

## Risks / Trade-offs

- [A token issued before revocation] → revocation is checked on every request, so the token stops working at once; tokens are not revoked at the directory.

## Verification

16 November 2026, on the slice's branch: `scripts/check all` passed every step (rules, specification coverage, format, build, Wolverine code current, 589 .NET tests, OpenAPI client current, lint and boundaries, web tests, SSR isolation, build). The end-to-end suite passed all 24 journeys, journey 29 included, and the 13 test scripts passed, `seeded-pilot-access` included.

## Comparison with the prototypes

Captured 16 November 2026 from the end-to-end environment (seeded persona) at 1440 and 390 px, against `correct-close-open-states.html` states `apps-empty`, `apps-list`, `apps-grant`, `apps-grant-errors` and `apps-revoke` at the same widths.

| Difference | Resolution |
|---|---|
| At 390 px the summary and each grant row left a tall empty gap: a flex basis became a height in the column layout | Fixed: the basis is `auto` below the breakpoint |
| The rail's Applications link carries an icon (`plug-connected`); the prototype's rail has none | Kept: every workspace destination has its icon (`docs/ui/icons.md`, row added) |
| Status labels and group labels have no icons; the prototype draws a check, a cross and circles | Kept: `StatusLabel` derives no icon from its tone and no grant-state icon is reviewed; text carries the meaning |
| "Revoke" uses the destructive variant; the prototype draws a neutral button | Kept: D-5 asks for danger tone, as the revocation is immediate and final for the grant |
| Rows also show "Granted by … · time"; times are in the viewer's zone, without a zone name | Kept: the grant's author is part of the record (D-2); the page is organisation-wide, so no tournament zone applies |
| Tournament scope is a radio pair with a checkbox per tournament; the prototype shows "Selected: Saturday Open" inline | Kept: an owner may choose several tournaments |
| Group descriptions: setup reads "registration window" instead of "dates, visibility"; results omit "corrections" | Kept: they name the endpoints that exist; `h1-tournament-cancel-and-dates` and `h1-safe-corrections` extend them with their endpoints |
| The dialog's error lines carry the error icon and "Error:" prefix | Kept: the admin application's field-error pattern |
