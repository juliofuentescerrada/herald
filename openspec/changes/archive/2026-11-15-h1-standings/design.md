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
- **Tournament navigation.** Task 4.1 asked for a Standings tab on every tournament page. The tournament section navigation merged in #69 (`TournamentNav`) gains a Standings section, and the Standings page uses it; this slice's own tabs were dropped when merging `main`.
- **Journey 21.** Renumbered from 22: `h1-exceptional-outcomes`, which had 21, has not merged; it renumbers its journey to 22.
- **Seed.** The seeded Lantern Open also records Dario Venn's win over Bram Holloway, so its standings share positions both as seeded and after `seeded-results` adds two results.
- **Tournaments started before this change.** They have no results snapshot until their next resolution, and their Standings page reads "Updating" until then. No deployed data exists before M4 (ADR 0012), so there is no backfill.
- **Simultaneous results.** Every resolution writes the schedule's results revision, so simultaneous results of one tournament queue on that row; a match write tries up to ten times (a `shortcut:` comment names the limit).
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
| `standings-before-start` | Notice "Standings begin when the competition starts" below the tournament navigation | None |
| `standings-empty` | Every entrant 1= with 0 points; "No match resolved yet" in the summary | None |
| `standings-provisional` | "Provisional" beside the title; summary "Provisional · 4 of 6 matches resolved" with the revision and the rules; points strongest, other numbers muted and right-aligned; "2=" with the accessible name "Position 2, shared" | None |
| `standings-explained` | The entrant's row expands below it with each resolved match and "Total" | Only resolved matches are listed (above) |
| `standings-teams` | "Team" heads the entrant column | A plural fix found here: "0 of 1 match resolved" |
| `standings-updating` | "Updating" in the info tone with the hourglass, in place of "Provisional" | None |
| `standings-load-failed` | Danger notice with "Try again" | None |
| Narrow (390 px) | Position, entrant and points only; the explanation wraps | None |

`standings-flags` belongs to `h1-round-operations`.

## Review

The herald-reviewer reviewed the diff on 15 November 2026 (no blocking findings):

| Finding | Resolution |
|---|---|
| Simultaneous results in one tournament could exhaust three tries and fail | Ten tries, a `shortcut:` comment, and an API test recording four results at once (all succeed, revisions 2–5) |
| `aria-label` on a plain span may not reach screen readers | Visible "2=" hidden from them, visually hidden "Position 2, shared" beside it |
| A tournament started before this change polls until its next result | Recorded above: no deployed data before M4 |
| Two scenario markers on tests that do not check the scenario's text | Markers moved to Vitest tests that assert "Provisional · 4 of 6 matches resolved" and "Round 2 · Rest · no points" |
| At 390 px the hidden counts appear nowhere | The explanation adds "Resolved · won · drawn · lost" |
| `seeded-results` comment out of date | Updated |
