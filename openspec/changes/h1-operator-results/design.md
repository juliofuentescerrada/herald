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

## Implementation notes

Deviations from the plan above, each kept small:

- **The result's text in `shared`.** `resultText` ("Robin Vale won", "Draw") is used by the schedule and matches features, so it lives in the admin app's `shared`, typed structurally because `shared` may not import the API client.
- **One primary action on an individual match.** While an individual match is scheduled, its Start panel's "Start match" is secondary: recording the result also starts it, and "Record result" is the page's primary action. A team match keeps "Start match" primary.
- **State labels.** The match and schedule show "Resolved" in the success tone, text only, as for "In play" and "Locked" (`docs/ui/icons.md` has no reviewed icon for these states).
- **No recorder's name.** The resolved summary says when the result was recorded, not by whom (as for lineups, W-1).
- **Host tests file.** `MatchLineupTests` became `MatchTests`, which covers lineups and results through the Admin API.
- **Notifiable facts.** `NotifiableFactsTests` named `Resolution`; it is exempted with the proposal's reason (a first result is not in F-10; revised final results join with the change log, D-26).

## Verification

15 November 2026, cloud session:

- `scripts/check all` passed.
- End-to-end suite: 20 journeys passed, journey 20 included. Test scripts: 7 passed, `seeded-results` included.

## Visual comparison

Captured from `e2e/scripts/seeded-results.spec.ts` (synthetic persona, seeded Lantern Open) at 1440 and 390 px and compared with `prototypes/frontend/play-and-score-states.html` (`result-empty`, `result-chosen`, `result-win`, `result-draw`, `schedule-results`). Browser verification of the composed application.

| State | Match | Difference and resolution |
|---|---|---|
| Result empty and chosen | Radio group "Outcome" with nothing selected; "Record result" disabled until a choice, described by "Choose the outcome first."; the help line says recording also starts the match | The Start panel stays above the Result panel with a secondary "Start match"; kept, so one primary action remains |
| Win and draw recorded | Read-only summary "Bram Holloway won · played" or "Draw · played", "Recorded … Corrections come later.", "Resolved" beside the heading | No author's name (above) |
| Schedule with results | Each resolved row shows "Resolved" and the outcome in words under the pairing, at 1440 and 390 px | None |
