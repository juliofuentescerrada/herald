## Status

**Approved for implementation on 12 November 2026** (gate 1.1). The maintainer chose the scope and the rules R-1 to R-9 of `design.md` after the exploration of the same day, supplied the mockups ([check-in states](../../../docs/assets/mockups/check-in/README.md)) and approved the proposal, the specs, the design and the assumptions A-1 to A-4, all the same day.

## Why

An owner can fill a tournament and build its teams' rosters, but nothing records who has actually turned up. F-05 makes check-in a dimension of its own, separate from admission and roster readiness, and the competition-start slice needs it to decide which entrants may start under a mandatory check-in policy. Check-in stays inside one module, Registration, with one small extension of an existing integration contract.

## What Changes

- **Check-in (F-05):** the organisation's owner checks in an admitted entry, individual or team, and can undo it, while the tournament's competition has not started (always, in this slice). There is no check-in window in H1: the operator records it at any time, whatever the registration state.
- **States:** an admitted entry's check-in is pending or confirmed. No "absent" state in this slice: pending already says it, and the director's review of absences belongs to the start slice.
- **Applies to admitted entries only:** waiting entries have no check-in; a promoted entry starts pending; a cancelled entry keeps its check-in as evidence and stops counting.
- **History (ADR 0007):** each entry's check-in has a revision; every confirmation and undo is recorded with who and when.
- **Policy:** optional or mandatory, already part of the configuration, is shown with the counts. Neither blocks anything in this slice; mandatory takes effect with competition start.
- **Policy locked by check-ins:** Tournaments rejects a change of the check-in policy while confirmed check-ins exist. `TournamentFieldChanged` (v1) gains the checked-in count as an optional member (backwards compatible, ADR 0016).
- **Teams (TM-09):** a team's check-in is the entry's, shown separately from its roster readiness; it asserts nothing about its players' attendance.
- **Admin application:** each admitted row of the entries page shows its check-in status beside the name, its last change as row meta and a check-in or undo action on the right; the summary adds the policy and how many admitted entries have checked in; the configuration form explains the locked policy.
- One end-to-end journey: an owner checks in two admitted players, undoes one, and sees the count.
- Documents: F-05 and the decision register record what this slice confirms; the visual direction's inventory gains the check-in states.

Out of scope, each waiting for the slice that needs it: competition start and combined start readiness (CP-04), the director's absence review and freeing slots, a configured or announced check-in window and its postponement (AT-11), player attendance and lineups (TM-06/07/09), self-service and representative check-in (H2), bulk check-in, filters and search on the entries page, check-in on public pages.

## Capabilities

### New Capabilities

- `entrant-check-in`: the check-in of an admitted entry, its undo and history, the checked-in count, and the admin entries page's check-in controls.

### Modified Capabilities

- `tournament-setup`: the check-in policy is locked while confirmed check-ins exist.
- `end-to-end-journeys`: journey 16.

## Impact

- `Herald.Registration`: check-in state and history on `Entry`, decided in the `Field` aggregate; two features; the field read; migration `AddCheckIn`; the field counts message.
- `Herald.Tournaments`: keeps the checked-in count from the field counts and locks the check-in policy; migration for the count.
- `Herald.Contracts`: one optional member on `TournamentFieldChanged`.
- Admin OpenAPI document and generated client; Wolverine's generated code.
- Admin application: `entries` feature (check-in status and actions), `tournaments` feature (locked policy).
- `e2e/`: journey 16. Docs: functional discovery (F-05, decision register), visual direction §9.3, roadmap, README, CLAUDE.md, `openspec/config.yaml`.
