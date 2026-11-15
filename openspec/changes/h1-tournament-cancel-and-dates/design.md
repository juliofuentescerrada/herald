## Context

See proposal.md (Why). Tournaments owns publication, the registration window, visibility and the competition state it shows (`Preparing`, `Running`, and `Finalised` from `h1-finalisation`). Registration owns entries; Competition owns the schedule and matches. They coordinate through revisioned snapshots and events (ADR 0016).

## Goals / Non-Goals

**Goals:**

- A tournament ends cleanly, keeps its evidence, and leaves the active list when it is done.

**Non-Goals:**

- Restoring a cancelled tournament; deleting published ones; match times.

## Decisions

### D-1 Tournaments cancels; the others apply it

`CancelTournament(reason, expectedRevision)` sets `CompetitionState.Cancelled` with actor, time, reason and whether it happened before or after start, closes registration and publishes `TournamentCancelled` through the outbox. Registration, on it, cancels every waiting or admitted entry with cause `tournament-cancelled` and rejects later entry, check-in and roster writes. Competition, on it, withdraws the current publication (before start, with the reason "tournament cancelled") or resolves every unresolved match with cause `voided-cancelled`, outcome none and no points (after start), publishes a final results snapshot and rejects later writes. Both are idempotent.

### D-2 What remains visible

Cancelled entries, the withdrawn publication and voided matches keep their history. Standings shows the last results with the status "Cancelled · no champion or final ranking".

### D-3 Archive

`Archived` is a flag beside the state, settable only when the state is finalised or cancelled. The list query excludes archived tournaments unless `archived=true`. Competition tracks the flag from `TournamentArchiveChanged` and `ReopenCompetition` rejects an archived tournament with "unarchive first".

### D-4 Draft deletion

`DeleteDraft(expectedRevision)` removes the tournament's row when its publication is draft. No other module holds data for a draft (entry terms are published at publication), so nothing else is touched; a later read by its identifier is the ordinary not-found.

### D-5 Dates

`ChangeDates(changes, expectedRevision)` takes only the selected dates (`registrationOpensAt`, `registrationClosesAt`, `plannedStartAt`), validates the resulting set with the existing ordering rules, stores old and new values with actor and time, and republishes the entry terms when the window changed. It is rejected after start. The configuration form of a published tournament shows the dates read-only with "Change dates".

### D-6 Screens

Configuration page summary actions, right of the summary text: "Change dates" (secondary, before start), "Cancel tournament" (danger, secondary), "Archive" or "Unarchive" (secondary, terminal only), "Delete draft" (danger, draft only). Change dates is a dialog with one row per date: a checkbox "Change", the current value and, when selected, the new value; a preview list of "old → new" with the time zone; "Save dates" (primary). The cancel confirmation names the consequence ("3 admitted and 1 waiting entry will be cancelled; the published schedule is withdrawn" or "4 unresolved matches will be voided; results so far stay; no champion is declared") and requires a reason. A cancelled tournament shows a "Cancelled" label and a notice "Cancelled by … at …. Nothing can change." The list's filter is a "Show archived" toggle.

## Visual input

Prototypes: `prototypes/frontend/correct-close-open-states.html`.

| Screen | States (`?state=`) |
|---|---|
| Configuration page | `dates-dialog`, `dates-preview`, `dates-invalid`, `dates-after-start`, `cancel-before-start`, `cancel-after-start`, `cancelled`, `archive-ready`, `delete-draft` |
| Tournament list | `list-archived-hidden`, `list-archived-shown` |
| Schedule page | `schedule-cancelled` |
| Standings page | `standings-cancelled` |

Visual choices (G-/RU-): cancellation and deletion are destructive and final, so they use the danger tone and name what happens; archive is reversible and uses the secondary tone; the dates preview shows each change in words.

## Assumptions for review

- **A-1** The reason for cancellation is private; the public page shows that the tournament was cancelled and when.
- **A-2** Unarchiving needs no reason; archiving asks no confirmation.

## Risks / Trade-offs

- [Event lag after cancellation] → see Q2; Tournaments rejects its own writes at once, and the others within the event's delivery.
