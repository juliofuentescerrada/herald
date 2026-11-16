## Context

See proposal.md (Why). After batch 2, Competition keeps `Match` aggregates with one `Resolution` of any §8.1 cause, publishes `TournamentResultsChanged` (a revisioned snapshot) to Standings, and Standings ranks it with `Table`.

## Goals / Non-Goals

**Goals:**

- A wrong result is fixed once, with an explanation, without losing what was recorded before.

**Non-Goals:**

- Rollback of dependent rounds; correcting lineups, departures or the schedule.

## Decisions

### D-1 One effective resolution, a kept history

`Match.Correct(operationId, resolution, reason, expectedRevision, actor, at)` replaces `Resolution` and appends the previous one, with the replacing actor, time, reason and operation identity, to `ReplacedResolutions` (a list on the match, stored as its own table). The match revision increases once; the tournament's results revision increases once, and a new `TournamentResultsChanged` is published in the same transaction (ADR 0008). The same operation identity with the same content returns the current state; with different content it is a conflict.

### D-2 What a correction may become

| Previous resolution | Allowed new cause |
|---|---|
| Recorded play | played (winner or draw), concession after play, no contest after play |
| No recorded play, individual | any §8.1 cause; played sets play |
| No recorded play, team, not started | concession, absence or no contest, all before play |
| No recorded play, team, started | any §8.1 cause; played uses the locked lineups |

A correction never removes recorded play or appearances. An identical resolution is rejected as "nothing to correct".

### D-3 The preview belongs to Standings

`GET …/standings/preview?match=…&outcome=…&cause=…&played=…` takes the snapshot Standings applied, substitutes the match's resolution and returns, per affected entrant, points and position before and after, with the snapshot revision. If the match revision it holds is not the one the owner's form was based on, it answers "updating" and the form waits for refresh. The preview is a query with no state; confirming sends `CorrectResult` with the match's expected revision, which Competition checks authoritatively.

### D-4 Finalisation

A finalised competition rejects `CorrectResult` with "reopen the competition first" (`h1-finalisation` adds the state; until then the check is absent and the scenario lands with that slice).

### D-5 Screens

The Match page of a resolved match shows the Result panel with "Correct result" (secondary). It opens the cause-first form of batch 2 with the current values chosen, a required "Reason for the correction" and "Review impact" (primary). The impact panel lists previous → new outcome and cause, recorded play, a table of entrants with points before → after and position before → after, and "Apply correction" (primary) with "Edit correction". After applying, the Result panel shows a "Corrected" label and a "Result history" disclosure after the actions, listing each replaced resolution with who, when and the reason.

## Visual input

Prototypes: `prototypes/frontend/correct-close-open-states.html`.

| Screen | States (`?state=`) |
|---|---|
| Match page | `correct-resolved`, `correct-form`, `correct-impact`, `correct-stale`, `correct-conflict`, `correct-failed`, `corrected`, `correct-finalised` |

Visual choices (G-/RU-): the correction is not destructive but changes points, so it uses a two-step review rather than a danger confirmation; previous and new values sit side by side with the change in words ("3 → 1 points"), never colour alone; history follows the actionable groups.

## Assumptions for review

- **A-1** The reason is private, like batch 2's reasons; the public page (batch 3) shows only that a result was corrected after finalisation.
- **A-2** Corrections need no separate confirmation dialog: the impact review is the confirmation.

## Risks / Trade-offs

- [Preview computed on an older snapshot] → the preview carries its revision and the command checks the match revision; a mismatch is refused, never applied on stale information.

## Implementation notes

- **History storage (D-1):** `ReplacedResolutions` is a `jsonb` column on the match, read and written whole with it like its lineups, start and resolution, not a separate table. The history is only ever read with its match, so a table would add a mapping and a join for no query.
- **Match revision in the results (D-3):** Standings could not tell which revision of a match it held, so `ResultsMatch` gains an optional `Revision` (additive, backwards compatible: earlier messages read as null). A snapshot kept before this change previews as "updating" until the tournament's next result.
- **Same operation, other content:** answered as a revision conflict (409), the same answer as a stale revision; nothing changes.
- **Results revision:** a correction raises the tournament's results revision once and publishes the new snapshot in the same transaction, like a first resolution.

## Full run

16 November 2026, on the slice's branch: `scripts/check all` passes (rules, spec coverage, format, build, Wolverine codegen and OpenAPI client current, 588 .NET tests, web lint, boundaries, 287 admin Vitest tests, SSR isolation, build); the e2e suite passes, 24 of 24 journeys; the `seeded-corrections` test script passes.

## Comparison with the prototypes

Captured at 1440 and 390 px (`test-script-screens`: `seeded-corrections`) against `correct-close-open-states.html` states `correct-impact` and `corrected`:

- **Who:** the prototype names the actor ("Recorded by Alex Morgan", "replaced by Alex Morgan"). The admin application shows no person's name anywhere yet, so the page shows when and why; the actor is stored with each replaced resolution (D-1) and can be shown once names are available.
- **Result panel while correcting:** the prototype replaces it with the form; the page keeps the read-only Result panel above the Correct result panel, so the current result stays visible beside its correction.
- **Outcome choice:** the page reuses batch 2's outcome cards ("Winner") instead of the prototype's plain "Outcome" radios, so recording and correcting look the same.
- **Now / After the correction:** plain labelled values instead of bordered boxes; "Edit correction" sits beside "Apply correction" instead of at the far right.
- **Stale preview:** "Results changed after this match was loaded" without the new revision number, which Standings does not return in that case.
- **Finalised match (`correct-finalised`):** not implemented here; it lands with `h1-finalisation` (D-4).
