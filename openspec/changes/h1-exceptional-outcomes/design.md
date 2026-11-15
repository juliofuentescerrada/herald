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

Implementation note (task 2.2): the resolution is already one `jsonb` document with its enums stored by number, so the reason and the new `Outcome` and `Cause` members (appended) need no schema migration, and earlier resolutions read with no reason. The API's `cause` defaults to "played", so a played result is written as before.

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

## Implementation notes

- **Seeds (task 4.1):** the four causes are seeded in a running four-player league of their own, "Lantern Shield" (concession before play, single absence, double absence, no contest "Venue closed"; two matches to play), not in Lantern Open as the task said. Lantern Open has six matches, one already won; the results test script records two and this slice's script three, so four more seeded there would leave too few. The proposal's intent, one match of each cause in a running four-player tournament, holds.
- **Absence after start (A-1):** the Result panel does not offer "Absence" once the match has started, so the owner never reaches the API's rejection; the API still rejects it (match-results: An absence after start).

## Risks / Trade-offs

- [More fields in one panel] → only the chosen cause's fields show; the prototype states check each at 390 px.

## Verification

15 November 2026, cloud session:

- `scripts/check all` passed.
- End-to-end suite: 21 journeys passed, journey 21 included. Test scripts: 8 passed, `seeded-exceptional-outcomes` included.

## Visual comparison

Captured from the seeded Lantern Shield (synthetic persona; one match of each cause, two to play) at 1440 and 390 px and compared with `prototypes/frontend/play-and-score-states.html` at the same widths. Browser verification of the composed application.

| State | Match | Difference and resolution |
|---|---|---|
| `outcome-concession`, `outcome-absence`, `outcome-no-contest-missing-reason` | "What happened?" with nothing selected, then only the chosen cause's radio groups; "Record result" disabled and described until complete; the reason's help says it is private and limits it to 500 characters | The prototype marks the empty reason invalid with a field error ("Give a reason for the no contest."); the build states "A no contest needs a reason." beside the disabled button, like the panel's other incomplete choices, because nothing has been submitted yet. Kept. |
| `resolved-concession`, `resolved-double-absence`, `resolved-no-contest` | The cause in one sentence, "Resolved" beside the heading, "no play recorded" or "play recorded" | Found in the capture: a match resolved by an administrative cause never starts, and the build still offered the Start panel and, for a team match, lineup editing. Fixed in this task (no Start panel once resolved; "Resolved without a start: no lineup was locked."), with a Vitest. Wording: "Both were absent · 0 each · no play recorded" drops the prototype's repeated "double absence"; the no contest reads "No contest: Venue closed · 0 each · …" as the proposal words it, instead of a trailing "Reason: Venue closed". |
| `schedule-exceptional` | Each resolved row shows "Resolved" and the same sentence as the Match page, with no score, at 1440 and 390 px | The cause line is centred under the pairing, as the operator-results schedule already does; the prototype left-aligns it. The prototype's operations panel and round labels belong to `h1-round-operations`. |

`outcome-team-play-not-started` was checked with Vitest and `axe-core` (`match-page.spec.ts`), not captured in a browser: the seeded running team league has no unstarted match left to resolve. The absence choice is not offered on a started match (Implementation notes).
