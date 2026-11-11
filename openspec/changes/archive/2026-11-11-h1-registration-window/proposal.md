## Status

**Approved for implementation on 11 November 2026** (gate 1.1). The maintainer chose the scope (the window only) and the manual action, supplied the mockups ([registration window states](../../../../docs/assets/mockups/registration-window/README.md)) and confirmed rows 2 and 3 of §5.1 (D-27) as applied here, the rules RW-1 to RW-6, the assumptions A-1 to A-4 and the corrections W-1 to W-3 of `design.md`, all the same day.

## Why

A published tournament says "Registration not open" and nothing can change that: the registration fact of §5 is a constant. Entries, the next H1 slice, are accepted only while registration is open, so the window has to exist first, as its own small step, with the owner in control of it.

## What Changes

- An owner opens the registration of a published tournament, closes it and reopens it, each with one explicit action (§5.1, rows 2 and 3). The announced opening and closure dates are information for entrants: the clock neither changes the state nor blocks the action.
- Opening requires the registration opening and closure dates, which publication did not require. While registration is open, every save must keep them.
- Opening, closing and reopening change the registration fact and nothing else: publication, competition, configuration and capacity are untouched, and no entry exists to be affected.
- These writes state the revision they were based on, like saves and publication; repeating one that is already in effect returns the current tournament.
- The tournament's read model returns the real registration state, the values still missing to open registration, and when the window last changed.
- Admin application: the published tournament page gains a registration area with the state, the announced window and one action ("Open registration", "Close registration" or "Reopen registration"), unavailable with an explanation when dates are missing or changes are unsaved. The list's registration label shows the real state.
- One end-to-end journey: open, see it in the list, close and reopen.
- Documents: D-27 gains the confirmation of rows 2 and 3 of §5.1; F-02 records the rules of this slice; the visual direction's inventory gains the registration states.

Out of scope, each waiting for the slice that needs it: entries, guests, admission, waiting list and capacity enforcement (F-04, D-06, D-22); the Registration module and any integration event (defined when Registration consumes it, D-08); opening or closing by the clock; announcements (D-26); pairings and their withdrawal before reopening (no pairing exists); cancellation and archival; the public page and visibility effects; pilot API access.

## Capabilities

### New Capabilities

- `registration-window`: opening, closing and reopening the registration of a published tournament; their preconditions, revision-aware writes and the admin screens for them.

### Modified Capabilities

- `tournament-setup`: a published tournament whose registration is open must also keep its registration dates on every save; the tournament read model returns the real registration state and the values missing to open registration.
- `end-to-end-journeys`: the list of critical journeys gains the registration window journey.

## Impact

- Backend: `Herald.Tournaments` only. The `Tournament` aggregate gains the registration state and two transitions; one additive migration; two features. No module is added and `Herald.Registration` stays empty. No new packages.
- API: two admin operations under `/api/organisations/{organisationId}/tournaments/{tournamentId}/registration`; `registration` in the tournament responses becomes a string enumeration and the detail gains `missingForRegistration` and the time of the last window change (additive). The admin OpenAPI document, the generated client and Wolverine's generated code are regenerated. The public document is unchanged.
- Frontend: the admin application's `tournaments` feature (tournament page and list labels). `ui` gains no control. No new packages.
- End-to-end: one journey added to `e2e/journeys/tournaments.spec.ts`.
- Documents and assets: `docs/assets/mockups/registration-window/` and `prototypes/frontend/registration-window-states.*`; functional discovery (D-27, F-02), visual direction §9.3, roadmap, README and `CLAUDE.md`/`openspec/config.yaml` status at completion. No new ADR: the decisions apply ADRs 0004, 0005 and 0007 and are recorded in `design.md`.
