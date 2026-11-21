## Context

See proposal.md (Why). The public application is server-rendered for dynamic entry pages (ADR 0011) and calls the host's anonymous `public` API document. Tournaments stores visibility (public, unlisted, private) with no effect yet; it already consumes Competition's schedule snapshot for start readiness.

## Goals / Non-Goals

**Goals:**

- A visitor follows the tournament without an account; nothing private reaches them, before or after a visibility change.

**Non-Goals:**

- Discovery, live updates, participant pages, caching.

## Decisions

### D-1 One public query in Tournaments

`GET /api/public/tournaments/{id}` returns the page model when the tournament is published and its visibility is public or unlisted; otherwise 404 with the generic problem. The check and the reads happen in one request against Tournaments' schema: the tournament row, the public change log entries and three projections — published schedule (pairings and rests with aliases, by revision), results (`TournamentResultsChanged`: match states, outcomes, causes) and standings (`TournamentStandingsChanged`). Each projection keeps the highest revision (ADR 0016).

### D-2 Content filter by construction

The page model has no field for contacts, reasons, rosters or lineups, and the projections store none: what is not stored cannot leak. Entrant names come from the snapshots, which carry aliases.

### D-3 Visibility changes

`ChangeVisibility(visibility, expectedRevision)` in any state after publication (and as part of the configuration before it). The admin dialog for private → public or unlisted shows a preview built from the same public query's model, requested by the owner through an admin endpoint that skips the visibility check (`GET /api/admin/tournaments/{id}/public-preview`). The switch to private commits and the next anonymous request is refused; responses carry `Cache-Control: no-store`, so no shared cache holds them.

### D-4 Explanation

Each standing's explanation lists its resolved matches with opponent, outcome, cause and points, its rest and its remaining matches, from the results projection, as the admin Standings page does.

### D-5 Screens

Public page (visual direction §8): the public shell's header; the title with lifecycle labels beside it; an overview panel (organiser, game, venue, dates with time zone, structure); then Rounds (each round with its state and matches, causes in words, rests), Standings (table with Position, Entrant, Points and, at 700 px and above, Resolved, Won, Drawn, Lost; a row opens its explanation), and Changes (public change log entries). The standings header says "Provisional · results revision 9 · updated 22 November 2026, 11:40 Europe/Madrid" or "Final · final revision 2 (revised after reopening)". Not available: a short page with the heading "This tournament is not available" and a link to the home page. Admin: a "Visibility" panel on the configuration page with the current value, "Change visibility" (secondary) and "View public page" (link, public or unlisted only).

### D-6 The organiser's name

Tournaments holds no organisation names. The public query asks Organisations for the name through `IOrganisationAccess` in `Herald.ModuleHosting`, which gains `FindNameAsync(organisationId)`. The visibility check and every other part of the page stay in Tournaments, and a name is never private. The maintainer chose this over a name projection on 21 November 2026.

## Visual input

Prototypes: `prototypes/frontend/correct-close-open-states.html`.

| Screen | States (`?state=`) |
|---|---|
| Public tournament page | `public-before-start`, `public-schedule`, `public-running`, `public-explained`, `public-final`, `public-revised`, `public-cancelled`, `public-not-available` |
| Configuration page | `visibility-panel`, `visibility-to-private`, `visibility-preview` |

Visual choices (G-/RU-): the public page reads top-down without an aside; status in words with icon; numbers right-aligned in tabular figures; the narrow table drops secondary columns, never points.

## Assumptions for review

- **A-1** The public link is the tournament's identifier in the public application's address; there is no separate slug in H1.
- **A-2** Archived tournaments stay readable at their link; archiving changes only the admin list (§5.1).

## Risks / Trade-offs

- [Projection lag on the public page] → the page shows the revision and time it reflects; the operator's pages remain authoritative.
