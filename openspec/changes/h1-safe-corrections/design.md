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
