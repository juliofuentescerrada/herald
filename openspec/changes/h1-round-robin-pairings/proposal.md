## Status

**Proposed in H1 batch 1's proposals pull request (#39), 13 November 2026.** The rules come from the batch's decision session of the same day, recorded in the functional discovery (F-05, F-06, §5.1, §15 rows D-04, D-27 and D-29). Merging the proposals pull request approves this change (ADR 0018); task 1.1 records that approval.

**Review answers, 14 November 2026 (#55):** the maintainer accepted Q1 to Q4 as proposed (§5.1 row 6, the assumptions and the module coordination) and asked for screen changes, applied to the prototypes and recorded in design.md's Visual input.

## Why

An owner can fill a tournament, check its entries in and close registration, but cannot produce what a league is played from: its schedule. §5.1 confirms the order: the owner reviews absences, drafts the round-robin from the eligible field, reviews and publishes it, and only then starts the competition (`h1-competition-start`, which depends on this change). This is Competition's first slice: the module exists with an empty model.

## What Changes

- **Absence review (F-05, D-29):** with mandatory check-in, a pending admitted entry blocks drafting; the owner confirms its check-in or marks it absent. Marking absent cancels the entry with the cause "absent at start": final, kept as evidence, its slot freed, nothing promoted automatically. With optional check-in there is no review and every admitted entry is eligible.
- **Eligible field (D-08):** Registration shares the eligible entrants (entry, name, admission order) and the pending count with Competition as a revisioned snapshot. Its eligible revision changes only when the eligible set does: roster edits do not change it.
- **Draft (F-06, D-04):** with registration closed, nothing pending and at least two eligible entrants, the owner generates a single round-robin by the circle method, seeded by admission order or by a draw whose seed is recorded. An odd field gives each entrant one rest round. Teams are entrants: four teams give six matches. A later change of the eligible field marks the draft stale; a stale draft cannot be published until regenerated. Regenerating replaces the draft, sends nothing and keeps no history.
- **Publication and withdrawal (§5.1 rows 4 and 5):** publishing a current draft creates an identifiable revision with who and when; repeating it returns the same revision. Withdrawing requires a reason, keeps the revision in history and returns its pairings to the draft. Only the owner sees drafts and schedules in this batch.
- **A published schedule locks the field:** Tournaments keeps the schedule's state and tells Registration, through the entry terms, that the field is locked. Registration then rejects admitting, cancelling (absence included) and check-in changes; Tournaments rejects reopening registration. A change that crossed the lock is reported on the schedule ("the field changed since publication"), never repaired silently.
- **No assignments:** a match has its round and its two entrants; no table, server or time in H1.
- **Admin application:** a Schedule page per tournament (generate, seeding choice, rounds with rest, stale, publish, withdraw with reason, history, blockers); the entries page gains "Mark absent" on pending rows and the absence-review summary.
- **Notifiable facts (ADR 0017):** schedule published and schedule withdrawn (Competition), recorded with revision, actor, time and reason; the existing "entry cancelled" row gains its cause. No fact event is published: no consumer exists yet (D-26 is batch 3).
- One end-to-end journey (17): an owner marks a pending player absent, generates a five-player schedule with one rest each, publishes it, withdraws it with a reason and republishes.

Out of scope: competition start and roster freeze (`h1-competition-start`), match lineups and results (batch 2), public reading of the schedule (batch 3, D-09/D-27), manual pairing adjustments, table or time assignment, other systems than round-robin, a history of discarded drafts.

## Decision rows

| Row | Status | Used for |
|---|---|---|
| D-04 Initial profile | Confirmed | Circle method, admission-order seeding or draw, rests apart, rounds playable out of order |
| D-29 Check-in | Partial; absence review confirmed 13 Nov 2026 | Pending entries block drafting; marking absent |
| D-27 Lifecycle | Partial; §5.1 rows 4 and 5 and the order of rows 4 to 6 confirmed 13 Nov 2026 | Publication, withdrawal, reopening locked |
| D-08 Lifecycle ownership | Confirmed ownership; start coordination to specify | Snapshots between Registration, Competition and Tournaments |
| D-26 H1 announcements | Proposed (batch 3) | Not used: the facts are recorded, not announced |

No open product question remains for this change; design.md lists the implementation assumptions for review.

## Screens

Prototypes in `prototypes/frontend/start-and-pair-states.html` (design.md, Visual input):

- **Schedule page (new):** blocked, no draft, generating, draft (even and odd field, teams), stale draft, published, withdraw dialog, withdrawn with history, field changed since publication, conflict, load failure.
- **Entries page (modified):** absence-review summary, pending row with "Mark absent", the mark-absent confirmation, the absent entry under Cancelled, the field locked by a published schedule.
- **Configuration page (modified):** reopening registration disabled while a schedule is published.

## Capabilities

### New Capabilities

- `round-robin-pairings`: the eligible field in Competition, drafting, regeneration, stale drafts, publication, withdrawal, the schedule's history and the admin Schedule page.

### Modified Capabilities

- `entrant-check-in`: the absence review and marking absent.
- `guest-entries`: a published schedule locks admission and cancellation; cancellation has a cause.
- `registration-window`: reopening waits for a withdrawn schedule.
- `end-to-end-journeys`: journey 17.

## Impact

- `Herald.Competition`: `Schedule` aggregate, eligible-field projection, features, first migration with tables.
- `Herald.Registration`: eligible revision, mark absent, cancellation cause, lock from the entry terms, the eligible field message.
- `Herald.Tournaments`: schedule projection, terms gain the check-in policy and the lock, reopening rejected while published.
- `Herald.Contracts`: `TournamentEligibleFieldChanged` (Registration → Competition), `TournamentScheduleChanged` (Competition → Tournaments); `TournamentEntryTermsChanged` gains optional `CheckIn` and `FieldLocked`.
- Admin OpenAPI document and client; Wolverine's generated code; admin application (`schedule` feature, `entries`, `tournaments`).
- `e2e/`: journey 17 and its test script; `tools/Herald.Seed`: a closed tournament ready to draft. Docs: visual direction §9.3, ADR 0017 inventory.
