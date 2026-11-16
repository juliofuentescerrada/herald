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
- **A-3** (found in task 2.1) "Change dates" moves a date or sets a missing one but never removes one, so after Q3 a published tournament cannot lose a registration date: the `registration-window` scenario "A closed registration lost a date" is removed (its delta in this change). Opening without dates is still rejected for a tournament published without them.

## Risks / Trade-offs

- [Event lag after cancellation] → see Q2; Tournaments rejects its own writes at once, and the others within the event's delivery.

## Implementation record

### Decisions taken while implementing

- **I-1 Started is a time, not a state.** Tournaments' `IsStarted` now reads `StartedAt`, because a tournament cancelled before start must not count as started; the admin pages read `start.startedAt` the same way where cancelled could mean either.
- **I-2 One guard per module.** Registration and Competition reject every write of a cancelled tournament in their write helpers (`FieldDetails`/`RosterDetails.WriteAsync`, `ScheduleResults`/`MatchView.WriteAsync`) with `tournament: cancelled`, so no endpoint can forget it; Tournaments rejects in the aggregate.
- **I-3 Either order of start and cancellation.** A start that reaches Competition after the cancellation schedules its matches already voided; a finalisation or reopening that reaches Tournaments after it changes nothing (Q2).
- **I-4 Notifiable facts.** `TournamentCancelled` v1 is published (Registration and Competition consume it); the dates change is persisted as `DatesChanged` with old and new values and not yet published, waiting for `h1-change-log` (ADR 0017's inventory names both).
- **I-5 Voided is a cause.** `Cause.VoidedCancelled` (outcome none, no points) reuses the resolution model; Standings counts it like any resolution with no points, and the admin pages say "Voided: tournament cancelled · no points".
- **I-6 Entries after start.** As D-1 says, Registration cancels every active entry, after start too; the Schedule page therefore hides the "field changed since publication" notice of a cancelled competition, which is not a change to act on.
- **I-7 A-3 and journey 12.** "Change dates" sets or moves a date but never clears one (A-3); journey 12 now sets the registration dates of its published tournament through "Change dates".

### Full run (task 6.2), 16 November 2026

- `scripts/check all`: all checks passed (rules, spec coverage, format, build, Wolverine codegen current, .NET tests, OpenAPI client current, lint, boundaries, 321 Vitest tests, SSR isolation, build).
- End-to-end suite: 27 journeys passed, journey 26 included.
- Test script `e2e/scripts/seeded-cancel-and-dates.spec.ts`: passed, 26 screenshots.

### Comparison with the prototypes (task 6.3)

Captured at 1440 and 390 px by the test script (`test-results/screens/seeded-cancel-and-dates/`), compared with `prototypes/frontend/correct-close-open-states.html`:

| State | Difference | Resolution |
|---|---|---|
| `dates-dialog`, `dates-preview` | Same rows, "Now:" values, preview "old → new" and time zone; the new values use the browser's date-time control, as the configuration form does; "Save dates" stays unavailable until a selected date differs | None |
| `dates-invalid` | Same error, naming the planned start | None |
| `dates-after-start` | No "Change dates"; the summary says the dates are fixed and the form's date fields say "Fixed when the competition started." | None |
| `cancel-before-start`, `cancel-after-start` | Same consequences in words, required private reason; the leaving action reads "Keep the tournament" | None |
| `cancelled` | Same label, summary with "Archive" on the right and notice; the notice also shows the private reason to the organisation (A-1) | Kept |
| `archive-ready` | Same toast; "Archived" joins the lifecycle labels | None |
| `delete-draft` | Same confirmation | None |
| `list-archived-hidden`, `list-archived-shown` | "Show archived" sits beside "Create tournament"; the prototype's count of hidden tournaments and its per-row "Unarchive" are not built: unarchiving is on the tournament's page | Kept: the list API returns no hidden count; one place to unarchive |
| `schedule-cancelled` | Same notice, "Voided" rounds and matches with "Voided: tournament cancelled · no points"; the operations summary still counts voided matches as resolved | Kept: they are resolutions with no points |
| `standings-cancelled` | "Cancelled" label, notice "Cancelled · no champion or final ranking" and the summary "Cancelled · 4 of 6 matches resolved · 2 voided"; first capture read "Provisional · 6 of 6" | Fixed in task 6.3 |
| Every cancelled field | First capture repeated "Nothing can change." under each field (RU-03) | Fixed: the notice says it once; locked fields keep their own help |
