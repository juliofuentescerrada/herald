## Context

See proposal.md (Why). After `h1-match-lineups`, Competition keeps a `Match` aggregate per pairing of the started revision, scheduled or in play, with locked lineups for team matches.

## Goals / Non-Goals

**Goals:**

- One effective played result per match, entered by the owner, safe to retry.

**Non-Goals:**

- Other causes (`h1-exceptional-outcomes`); points and positions (`h1-standings`); corrections (batch 3).

## Decisions

### D-1 A resolution on the match

`Match` gains `Resolution` (outcome: first, second or draw; cause; played; who; when; operation identity) and state `Resolved`. `RecordPlayed(operationId, outcome, expectedRevision, actor, at)`:

- scheduled individual match: records the start and the resolution in one write;
- scheduled team match: rejected, "Start the match first: its lineups lock at start";
- in play: resolved;
- resolved: the same operation returns the resolution; any other is rejected, "This match already has a result. Corrections come later."

The cause is a closed set that `h1-exceptional-outcomes` extends; this change adds `Played` only.

### D-2 Appearances from the locked lineups

For a team match, a played resolution records an appearance for each player of the two locked lineup revisions; unused roster members get none. Individual matches record no player appearances (the entrant is the player). Appearances live on the match; `h1-standings` and later history read them.

### D-3 Screens

The Match page adds a Result panel after the Lineups panels: a radio group "Outcome" with "<first> wins", "Draw", "<second> wins", none selected (§8.1: a new-result form never preselects a winner); "Record result" is disabled until a choice is made. For an individual scheduled match the help text says recording also starts the match. Recording asks no confirmation (it is not destructive and the result is shown at once), but its success is a toast and the panel then shows the result with who and when. The Schedule page shows "Robin Vale won" or "Draw" in the match row with a "Resolved" badge.

## Visual input

Prototypes: `prototypes/frontend/play-and-score-states.html`.

| Screen | States (`?state=`) |
|---|---|
| Match page, Result panel | `result-empty`, `result-chosen`, `result-saving`, `result-win`, `result-draw`, `result-team-not-started`, `result-team`, `result-conflict` |
| Schedule page | `schedule-results` |

Visual choices (G-/RU-): radio buttons for a single choice among three visible options (`docs/ui/components.md`), never a select; the outcome reads in words, not as "1–0"; the resolved state replaces the form with a read-only summary, not disabled inputs.

## Assumptions for review

- **A-1** Recording a result asks no confirmation; a mistaken result is fixed by the batch 3 correction.
- **A-2** The result names the winning entrant; the losing side's loss is derived.

## Risks / Trade-offs

- [A wrong result has no correction until batch 3] → shown plainly in the resolved panel ("Corrections come later"); seeds and test rounds use fresh tournaments.
