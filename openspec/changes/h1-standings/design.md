## Context

See proposal.md (Why). Competition keeps `Match` aggregates with one resolution each (`h1-operator-results`); `h1-exceptional-outcomes` adds causes whose outcome is first, second, draw or none. The Standings module exists with a schema and no domain.

## Goals / Non-Goals

**Goals:**

- A table any owner can trace back to its results, labelled with the revision it reflects.

**Non-Goals:**

- Finalisation (batch 3); tiebreakers beyond points; public reading (batch 3).

## Decisions

### D-1 One snapshot per tournament

`TournamentResultsChanged` v1: organisation, tournament, revision, entrants (entry, name), matches (match, round, first, second, state, outcome, cause, play took place), rests (round, entry). Competition publishes it when the competition starts (all matches scheduled) and after every resolution, from its own data in the same transaction (outbox). Standings keeps the snapshot with the highest revision and ignores older ones (ADR 0016). The snapshot is small for H1's single round-robin; deltas are not worth their ordering rules.

Running beside `h1-exceptional-outcomes`: the contract carries `outcome` and `cause` from the first version, so causes added there need no contract change; this change only adds publishing code to Competition, not to its model.

### D-2 The table is computed, not accumulated

Standings stores the snapshot and computes the table on read: per entrant, resolved = matches with a resolution; won/drawn/lost from the outcome; points 3/1/0 from the outcome alone (none = 0 each). Sorting: points descending, then name for display; equal points share a position, and the next position skips (1, 2, 2, 4). Rebuilding is trivial: the latest snapshot is the whole input (ADR 0007).

### D-3 What the page states

"Provisional · 4 of 6 matches resolved · results revision 7". After the owner records a result in this browser, the page shows a status label "Updating" beside the title until it reads a revision at least as new as the one that write returned. The explanation is a disclosure per row listing the entrant's resolved matches and rest.

### D-4 Screens

Standings page: title with "Provisional" status label; a summary line with the resolved count and revision; a table (Position, Entrant, Resolved, Won, Drawn, Lost, Points); shared positions print "2=" with an accessible name "Position 2, shared"; each entrant name is a button that expands its explanation below the row. At 390 px the table keeps Position, Entrant and Points and the explanation lists the rest. Before start: "Standings begin when the competition starts". With no result: every entrant at position 1= with 0 points and "No match resolved yet".

## Visual input

Prototypes: `prototypes/frontend/play-and-score-states.html`.

| Screen | States (`?state=`) |
|---|---|
| Standings page | `standings-before-start`, `standings-empty`, `standings-provisional`, `standings-explained`, `standings-teams`, `standings-updating`, `standings-load-failed` |

Visual choices (G-/RU-): a real table for tabular data (`docs/ui/components.md`), numbers right-aligned with tabular figures; points in the strongest weight, the other columns muted (RU: emphasise by de-emphasising); the shared position is in text, never colour alone.

## Assumptions for review

- **A-1** Standings are readable by the owner only in H1; the public page arrives with `h1-public-read`.
- **A-2** Ordering by name within a shared position uses the organisation's culture-invariant comparison; it is presentation (F-09).

## Risks / Trade-offs

- [Projection lag after a result] → the page shows the revision it reflects; the operator's own write invalidates the query and shows "Updating" until it arrives.

## Implementation notes

Deviations from the plan above, each kept small:

- **The results revision.** The schedule keeps `ResultsRevision`: 1 when the matches are scheduled, one more per resolution. It is a concurrency token, so two resolutions saved at once cannot publish the same revision; the second is retried and publishes the next one with both results.
- **The cause crosses as a name.** The contract carries the cause as Competition's camel-case name ("played"), so causes added by `h1-exceptional-outcomes` need no new contract version; the outcome and match state are enums, `None` included from v1.
- **Updating without a results revision on the write.** A match write answers with the match, not the results revision, so the page compares Competition's resolved count (the schedule it already reads) with the standings' count: while Competition knows more, the label reads "Updating" and the standings are read again every second. A competition started but whose first snapshot has not arrived (404) reads as updating, not missing.
- **Each line's result.** `GetStandings` gives each explanation line its result for the entrant (won, drawn, lost, no winner), so the explanation reads "Round 1 · vs Jamie Brook · draw · played · 1 point".
- **Explanation of resolved matches only.** The prototype also lists matches in play or scheduled ("counts nothing yet"); the requirement lists resolved matches and the rest, so the build does not.
- **Tournament tabs.** Earlier slices left tabs out (`h1-round-robin-pairings`, `h1-competition-start`); this change's task 4.1 asks for them, so Configuration, Entries, Schedule and Standings are route links (with `aria-current="page"`, not ARIA tabs) below the title of each published tournament's pages. The pages keep their back links. The match page has none: it is a child of the schedule.
- **Journey 21.** Renumbered from 22: `h1-exceptional-outcomes`, which had 21, has not merged; it renumbers its journey to 22.
- **Seed.** The seeded Lantern Open also records Dario Venn's win over Bram Holloway, so its standings share positions both as seeded and after `seeded-results` adds two results.
- **Host tests file.** The standings API tests extend `MatchTests` (partial class `StandingsTests.cs`) for its league helpers.

## Verification

15 November 2026, cloud session:

- `scripts/check all` passed.
- End-to-end suite: 21 journeys passed, journey 21 included. Test scripts: 8 passed, `seeded-standings` included.
- The admin initial bundle is over its 900 kB budget by about 56 kB, a warning that predates this change's frontend work (the generated client grows with each endpoint).

## Visual comparison

Captured at 1440 and 390 px from the composed application (synthetic persona, seeded data; `standings-empty`, `standings-updating` and `standings-load-failed` with the standings response replaced in the browser) and compared with `prototypes/frontend/play-and-score-states.html`.

| State | Match | Difference and resolution |
|---|---|---|
| `standings-before-start` | Notice "Standings begin when the competition starts" below the tabs | None |
| `standings-empty` | Every entrant 1= with 0 points; "No match resolved yet" in the summary | None |
| `standings-provisional` | "Provisional" beside the title; summary "Provisional · 4 of 6 matches resolved" with the revision and the rules; points strongest, other numbers muted and right-aligned; "2=" with the accessible name "Position 2, shared" | None |
| `standings-explained` | The entrant's row expands below it with each resolved match and "Total" | Only resolved matches are listed (above) |
| `standings-teams` | "Team" heads the entrant column | A plural fix found here: "0 of 1 match resolved" |
| `standings-updating` | "Updating" in the info tone with the hourglass, in place of "Provisional" | None |
| `standings-load-failed` | Danger notice with "Try again" | None |
| Narrow (390 px) | Position, entrant and points only; the explanation wraps | None |

`standings-flags` belongs to `h1-round-operations`.
