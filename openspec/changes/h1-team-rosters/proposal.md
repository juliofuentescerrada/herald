## Status

**Approved for implementation on 11 November 2026** (gate 1.1). The maintainer chose the scope and the rules R-1 to R-10 of `design.md` after the exploration of the same day, supplied the mockups ([team roster states](../../../docs/assets/mockups/team-rosters/README.md)) and approved the proposal, the specs, the design and the assumptions A-1 to A-5, all the same day.

## Why

A team tournament can now be filled, but a team is only a name: nothing says who plays for it, so UJ-03 ("record identifiable eligible players; review exclusivity and incomplete rosters") cannot start, and the later start and lineup slices have no roster to freeze or select from. Rosters are the next step of the entries side and stay inside one module, Registration.

## What Changes

- **Tournament roster (TM-02, D-17):** the organisation's owner adds guest players of the organisation to the roster of an active team entry and removes them, while the competition has not started (always, in this slice). Members are guest players, the same guests individual tournaments use, created with the existing possible-duplicate warning.
- **Bounds:** a roster can be below the minimum while registration runs; it is shown as incomplete. Adding beyond the maximum is rejected. Waiting entries have rosters too.
- **Exclusivity (TM-03):** a player belongs to at most one active team entry of the tournament; a cancelled entry's roster is kept as evidence and stops counting. Two members of different teams with the same normalised name are flagged for review, never merged or blocked.
- **History (TM-05, ADR 0007):** each roster has a revision; every addition and removal is recorded with who and when. The freeze itself is set by the competition-start slice: start will fix the roster revision then current.
- **Bounds changed later:** the tournament's roster bounds stay editable; rosters outside new bounds are shown as incomplete or above the maximum and never trimmed.
- **Integration event:** `TournamentEntryTermsChanged` (v1) gains the minimum and maximum roster size, as optional values (backwards compatible, ADR 0016).
- **Admin application:** each team row of the entries page shows its roster readiness and opens a roster drawer to add and remove players.
- One end-to-end journey: an owner builds a team's roster to its minimum, is stopped from adding a player already in another team, and sees the team complete.
- Documents: D-17 and TM-02/03/05 record what this slice confirms; ADR 0017's inventory gains the roster changes; the visual direction's inventory gains the roster states.

Out of scope, each waiting for the slice that needs it: competition start and the actual freeze (CP-04), match lineups and their lock (TM-06/07, D-18), check-in (F-05), representatives and captains (TM-04, H2), departures and sanctions after the freeze (D-23), a configurable roster deadline, rosters on public pages (D-09), editing guest names, an organisation players page.

## Capabilities

### New Capabilities

- `team-rosters`: the roster of a team entry, its bounds and readiness, exclusivity within the tournament, its history, and the admin roster drawer.

### Modified Capabilities

- `end-to-end-journeys`: journey 15.

## Impact

- `Herald.Registration`: roster members and their history in the `Field` aggregate, two features, the field read, migration `AddRosters`, the terms handler.
- `Herald.Tournaments`: publishes the roster bounds in the entry terms; no rule changes.
- `Herald.Contracts`: two optional members on `TournamentEntryTermsChanged`.
- Admin OpenAPI document and generated client; Wolverine's generated code.
- Admin application: `entries` feature (readiness, roster drawer).
- `e2e/`: journey 15. Docs: functional discovery (§10.2, D-17), ADR 0017 inventory, visual direction §9.3, roadmap, README, CLAUDE.md, `openspec/config.yaml`.
