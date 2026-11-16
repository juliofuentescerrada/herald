## Status

**Proposed in H1 batch 3's proposals pull request, 15 November 2026.** The rules come from the batch's decision session of the same day, recorded in the functional discovery (§5.1 rows "Finalise" and "Reopen finalised competition", §9.3, F-09; §15 rows D-24, D-25 and D-27). It depends on `h1-safe-corrections`. Merging the proposals pull request approves this change (ADR 0018); task 1.1 records that approval.

**Review answers, 15 November 2026 (#74):** the maintainer accepted Q1 and Q2 (Competition owns finalisation and reopening; final standings carry no winner label, only "no champion is declared" when every entrant departed) and the prototypes as they are.

## Why

A league with every match resolved stays provisional for ever: nothing closes it, and nothing guarantees the owner approved the standings that are current. D-24, confirmed on 15 November 2026, puts a review barrier before finalisation and allows a reasoned reopening. AT-07 tests it.

## What Changes

- **Review barrier (D-24, §9.3):** finalising a running competition requires every pairing resolved (CP-05) and three revisions to agree: the current results revision of Competition, the revision the standings applied, and the revision the owner reviewed. The owner reviews the standings at a revision and sends it with the finalisation; a later result, departure or correction makes it stale, and the owner is asked to review again. Nothing shows success before finalisation succeeds.
- **Finalised (§5.1):** the competition becomes finalised; the standings at the reviewed revision become final and keep that revision; registration stays closed; every competitive write (results, lineups, starts, departures, corrections) is rejected with "reopen the competition first".
- **No active entrant (D-25):** a competition whose entrants have all departed finalises like any other; the final standings keep points, positions and flags and say that no champion is declared.
- **Reopening (§5.1):** the owner reopens a finalised competition with a required reason of at most 500 characters; it returns to running for corrections and a renewed review. The previous final revision is kept and listed; registration does not reopen and rosters stay frozen. Finalising again needs a new review.
- **Ownership (D-08):** Competition owns finalisation and reopening, because it owns the facts the barrier checks and the writes it then rejects (Q1). Tournaments and Standings learn them from two new integration events and show them.
- **Admin application:** the Standings page of a fully resolved, running competition shows a "Review and finalise" panel with the three revisions and "Finalise" (primary); a stale review shows "Standings changed" with "Review again". A final competition shows "Final" beside the title, "Reopen" (secondary, with reason) and a "Final revisions" history. Tournament labels show "Finalised".
- **Notifiable facts (ADR 0017):** competition finalised, competition reopened; published as integration events consumed by Standings and Tournaments (and by `h1-change-log`).
- One end-to-end journey (25): review, finalise, reopen with a reason, correct and finalise again with the earlier final revision kept.

Out of scope: archiving (`h1-tournament-cancel-and-dates`), the public final page (`h1-public-read`), history across tournaments (H2), cut or qualifier deciders (none in H1).

## Decision rows

| Row | Status | Used for |
|---|---|---|
| D-24 Finalisation review barrier | Confirmed for H1 15 Nov 2026 | Three revisions agree; review again on change; reasoned reopening |
| D-25 Terminal outcomes | Confirmed 15 Nov 2026 | Finalisation without an active champion |
| D-27 Lifecycle | §5.1 rows "Finalise" and "Reopen" confirmed 15 Nov 2026 | Finalised state, reopening keeps the previous final revision |
| D-08 Lifecycle ownership | Confirmed ownership; finalisation coordination specified here | Competition finalises; Tournaments shows the lifecycle |

## Open questions for the review

- **Q1** The roadmap named Standings as this slice's main module. Competition owns finalisation instead, because the barrier compares its current results revision and the finalised state must reject its writes in the same transaction. Confirm, or keep it in Standings or Tournaments with a projected revision (which cannot rule out a result recorded meanwhile).
- **Q2** Final standings name no champion in H1: they show "Final" and the positions as ranked, shared positions shared. When every entrant departed they add "No active entrant: no champion is declared". Confirm, or add a "Winner" label for a single active first position.

## Screens

Prototypes in `prototypes/frontend/correct-close-open-states.html` (design.md, Visual input):

- **Standings page (modified):** review panel ready; not all resolved; standings updating; stale review; finalising; final; final without an active champion; reopen confirmation with reason; reopened with earlier final revisions.
- **Match page (modified):** writes refused on a finalised competition (shared with `correct-finalised`).

## Capabilities

### New Capabilities

- `competition-finalisation`: the review barrier, finalisation, reopening and final revisions.

### Modified Capabilities

- `standings`: final status and revisions.
- `end-to-end-journeys`: journey 25.

## Impact

- `Herald.Competition`: competition state finalised on the schedule, final revisions with reasons; features `FinaliseCompetition`, `ReopenCompetition`; every competitive write checks the state; migration.
- `Herald.Contracts`: `CompetitionFinalised` v1 and `CompetitionReopened` v1 (tournament, results revision, final revision number, actor, time; no reason text).
- `Herald.Standings`: final status and the list of final revisions. `Herald.Tournaments`: competition state `Finalised` from the events.
- Admin OpenAPI document and client; Wolverine's generated code; admin `standings` and `tournaments` features.
- `e2e/`: journey 25 and its test script; `tools/Herald.Seed`: a finalised league and a fully resolved running one. Docs: visual direction §9.3; ADR 0017 inventory.
