## Status

**Approved for implementation, 15 November 2026.** The maintainer accepted the scope and generated visual references and explicitly instructed committing and applying this change. References: `prototypes/frontend/tournament-admin-ux.html` and its state inventory. This approval supersedes the earlier pending gates; it does not change approvals of the separate competition changes. The implementation baseline is main revision cfc6fa6 plus this proposal; no domain/API dependencies are introduced. All work fits the existing tasks and preserves separate feature ownership.


## Why

The owner must detour through configuration to reach competition work. Running has inconsistent emphasis, schedule rows disconnect outcomes from pairings, and result entry competes with read-only lineups. Browser review also reproduced lost unsaved lineup selection and horizontal overflow in List and Entries at 700 px. See the linked assessment and operational review in design.md for methods, measurements and remaining limits.

## What Changes

- Establish consistent tournament context and route-based Configuration, Entries and Schedule navigation, with direct View schedule access from published tournament rows. Keep drafts on their current configuration/review path and match detail within Schedule context.
- Apply one explicit lifecycle presentation mapping across list and headers: publication and registration remain neutral facts; Running uses information emphasis and Preparing remains neutral. Preserve labels and reviewed icons; colour is reinforcement.
- Recompose schedule records around pairing, effective outcome, state and an explicit View match destination; names do not masquerade as person-profile links.
- Give result choices a larger labelled selectable surface using native single-choice semantics, with explicit submission and no initial selection. In started team matches put result work before compact read-only lineups; preserve preparation order before start.
- Protect unsaved lineup selections when navigating away; keep outcome selection local without adding a leave confirmation solely for an unsaved outcome choice. Keep explicit per-side save/discard and revision checks.
- Reflect start-fixed configuration as read-only with accurate reasons; preserve editable descriptive fields and all server-side enforcement.
- Add same-query search retry and complete failed-dependency reload paths. Reduce repeated primary search actions, empty-state duplication and competing history; correct phase-dependent copy and singular/plural summaries.
- Fix row wrapping at intermediate desktop widths without changing the 700 px breakpoint or full-width stacked composition. Verify keyboard, focus, mobile, long content and zoom in the affected flow.
- Align only affected shared controls/catalogue examples and numeric roles with existing UI guidance; no blanket catalogue or public-shell redesign.

Notifiable facts: none; no new domain operations, events or permissions. No module/API/schema changes are intended. If implementation discovers that a contract change is necessary, return it for explicit scope review and include the required generation/checks.

## Decision rows and boundaries

D-04 (confirmed) supplies round-robin outcomes and out-of-order play. D-06, D-17, D-18, D-27 and D-29 are partial/qualified decisions: preserve their implemented admission, roster, lineup, lifecycle and check-in clauses. D-08 ownership and D-21 restricted owner access are preserved. D-07 corrections and D-24 finalisation remain proposed; this change does not settle them. D-05/D-23/D-25 competition work remains with its owning changes. H2 D-30–38 and XP-02–08 are separate target experiences, not administrator capabilities introduced here. Audience is H1 owner operations, XP-01.

Out of scope: new dashboards or landing routes, filters/bulk actions, wizards, standings, exceptional result causes, corrections, finalisation, departures, participant/public flows, role changes, automatic lifecycle transitions and new backend progress data solely for presentation.

## Screens and visual input

Affected: list; new/draft/published/running configuration; publication review; registration/competition areas; entries and add/confirmation overlays; editable/frozen/cancelled roster drawer; blocked/draft/published/withdrawn/running schedule and withdrawal dialog; individual/team match preparation, in-play, result selection and resolved states. Include loading, empty, busy, field/request failure, stale/conflict, permission replacement, unsaved exit, long content and narrow states where applicable. The existing assessment inventories these states.

The maintainer explicitly requested agent-generated references. The navigable prototype and state inventory in `prototypes/frontend/tournament-admin-ux.html` and `tournament-admin-ux.md` are the replacement visual input for review; they are not approved. Current screenshots and older prototypes remain audit evidence. New references must preserve full-width one-column admin, square geometry, the shared spacing scale, one breakpoint below 700 px, full-width panels with independently limited prose, lifecycle labels beside titles, summary actions on the right and history after actionable work.

## Capabilities

### New Capabilities

- `tournament-administration-ux`: coherent presentation, navigation and recovery across existing administration capabilities.

### Modified Capabilities

None at proposal stage. Implementation must reconcile any affected existing presentation requirements explicitly; this capability does not override domain specifications.

## Impact

Admin tournament, entries, schedule, matches and shell composition; app-local shared presentation; affected UI controls/catalogue only if necessary; synthetic browser journeys and seeded screenshot script. Functional discovery, roadmap and public application remain unchanged. Coordinate overlapping surfaces with `h1-exceptional-outcomes`, `h1-round-operations` and `h1-standings` on the chosen implementation baseline before work starts.
