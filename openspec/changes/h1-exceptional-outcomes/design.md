## Context

See proposal.md (Why). After `h1-operator-results`, a `Match` has one resolution with cause `Played`, an outcome and appearances.

## Goals / Non-Goals

**Goals:**

- Each §8.1 row the owner can choose is one cause, with its points derivable from the resolution alone.

**Non-Goals:**

- Automatic outcomes from withdrawal (`h1-round-operations`) and cancellation (batch 3); corrections (batch 3).

## Decisions

### D-1 One resolution shape for every cause

The resolution keeps: cause; outcome (first, second, draw or none); whether play took place; the reason (no contest only); who; when; operation. Each cause sets the outcome:

| Cause | Owner gives | Outcome | Play |
|---|---|---|---|
| Played | winner or draw | first, second or draw | yes |
| Concession | conceding entrant, play yes/no | the other entrant wins | as given |
| Single absence | absent entrant | the other entrant wins | no |
| Double absence | nothing more | none | no |
| No contest | reason, play yes/no | none | as given |

Points follow from the outcome alone under 3/1/0 (a win 3, a draw 1 each, none 0 each), so `h1-standings` needs no cause-specific rule. "None" is never shown as a draw.

### D-2 Play and start evidence

"Play took place" on a team match requires the match in play; otherwise the write is rejected ("Start the match first: an administrative outcome cannot record play"). Appearances are credited only when play took place (the locked lineups, as `h1-operator-results` D-2). Recording any cause on a scheduled match does not start it, except a played individual result.

### D-3 Screens

The Result panel's first radio group is "What happened?" with the four causes, none selected. Each cause reveals its fields: "Winner" (played), "Who conceded?" and "Did play take place?" (concession), "Who was absent?" or "Both were absent" (absence, one group of three radios: first, second, both), "Reason" and "Did play take place?" (no contest). The no contest's reason is a textarea of at most 500 characters, private to the organisation. "Record result" stays disabled until the chosen cause's fields are complete. The resolved summary states the cause in a sentence and "No play recorded" where it applies.

## Visual input

Prototypes: `prototypes/frontend/play-and-score-states.html`.

| Screen | States (`?state=`) |
|---|---|
| Match page, Result panel | `outcome-concession`, `outcome-absence`, `outcome-no-contest-missing-reason`, `outcome-team-play-not-started`, `resolved-concession`, `resolved-double-absence`, `resolved-no-contest` |
| Schedule page | `schedule-exceptional` |

Visual choices (G-/RU-): progressive disclosure inside one panel rather than four buttons, so the owner reads the causes side by side (RU: fewer competing primary actions); radios for every single choice; the reason's help text says it is private; no score field anywhere.

## Assumptions for review

- **A-1** An absence is recorded on a match that has not started; on a match in play the owner records a concession or a no contest instead.
- **A-2** "Both were absent" is the double absence; it never withdraws either entrant (§8.1).

## Risks / Trade-offs

- [More fields in one panel] → only the chosen cause's fields show; the prototype states check each at 390 px.
