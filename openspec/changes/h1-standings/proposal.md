## Status

**Proposed in H1 batch 2's proposals pull request, 15 November 2026.** The rules come from the functional discovery (F-09, §7.2, §8.1; §15 rows D-04 and D-25) and the batch's decision session of 15 November 2026. It depends on `h1-operator-results` and can run beside `h1-exceptional-outcomes`. Merging the proposals pull request approves this change (ADR 0018); task 1.1 records that approval.

**Approved for implementation on 15 November 2026**, when the maintainer merged the batch 2 proposals pull request (#63), with the review answers below (ADR 0018).

**Review answers, 15 November 2026 (#63):** the maintainer accepted Q1 and Q2 (0/0 outcomes count as resolved only; the seven columns) as proposed, and the prototypes as they are.

## Why

Results exist but nobody can read who is first. F-09 asks for standings from effective results that show they are provisional and explain each entrant's points; D-04 fixes 3/1/0, shared positions on equal points and rests without points. ADR 0004 gives this to the Standings module, which is still empty, as a projection that carries the revision of the results it reflects (ADR 0007).

## What Changes

- **Results published (D-08):** Competition publishes a running competition's results as a revisioned snapshot (`TournamentResultsChanged` v1): its entrants, its matches with round, entrants, state, outcome (first, second, draw or none), cause and whether play took place, and its rests. Standings keeps the latest and recomputes.
- **The table (D-04, F-09):** for each entrant, resolved matches, wins, draws, losses and points under 3/1/0, from effective results only; pending and in-play matches count nothing. Ordered by points; entrants with equal points share a position, listed by name, which is presentation, not a tiebreaker. An outcome with no winner (double absence, no contest) gives 0 each and counts as neither a win, a draw nor a loss (Q1).
- **Explanation:** each entrant's row opens the results behind its points: each resolved match with opponent, round, cause in words and points, and its rest round as "Rest · no points".
- **Provisional and revision:** the table says "Provisional" while the competition runs and states how many matches are resolved and the results revision it reflects; while a newer revision is being applied it shows "Updating".
- **Admin application:** a Standings page for each tournament, beside Configuration, Entries and Schedule, readable once the competition has started.
- **Notifiable facts (ADR 0017):** none; standings are a projection.
- One end-to-end journey (21, renumbered from 22 because it merges before `h1-exceptional-outcomes`): an owner records the results of a four-player league and reads its standings, with two players sharing a position and one player's points traced to its results.

Out of scope: withdrawn and disqualified flags (`h1-round-operations` adds them), finalisation and the review barrier (`h1-finalisation`, D-24), the public page (`h1-public-read`), tiebreakers beyond points (H4 and profiles), team player statistics.

## Decision rows

| Row | Status | Used for |
|---|---|---|
| D-04 Initial profile | Confirmed | 3/1/0, points then shared position, rests with no points |
| D-25 Terminal outcomes | Confirmed 15 Nov 2026 | Points of every cause; 0/0 outcomes |
| D-08 Lifecycle ownership | Confirmed ownership | Competition owns results; Standings projects them |
| D-24 Finalisation barrier | Proposed (batch 3) | Not here; the revision shown now is what batch 3 compares |

## Open questions for the review

- **Q1** A double absence or a no contest counts in the "Resolved" column but in none of wins, draws and losses, and the explanation names it. Confirm, or count a double absence as a loss for both.
- **Q2** The table's columns are Position, Entrant, Resolved, Won, Drawn, Lost, Points. Confirm, or drop the three result columns in H1 and keep only Resolved and Points.

## Screens

Prototypes in `prototypes/frontend/play-and-score-states.html` (design.md, Visual input):

- **Standings page (new):** before start, no results yet, provisional with a shared position, an entrant's explanation, a team tournament, updating, load failure, narrow layout.
- **Tournament tabs (modified):** a Standings tab.

## Capabilities

### New Capabilities

- `standings`: the results snapshot, the table, its explanation and the Standings page.

### Modified Capabilities

- `end-to-end-journeys`: journey 21.

## Impact

- `Herald.Contracts`: `TournamentResultsChanged` v1 (Competition → Standings).
- `Herald.Competition`: publishes the snapshot through the outbox on start and on every resolution; no change to its EF Core model.
- `Herald.Standings`: first domain, projection, feature `GetStandings` and migration.
- Admin OpenAPI document and client; Wolverine's generated code; new admin `standings` feature and the tournament tabs.
- `e2e/`: journey 21 and its test script; `tools/Herald.Seed`: the running four-player tournament with enough results for a shared position. Docs: visual direction §9.3, `src/Herald.Standings` module README.
