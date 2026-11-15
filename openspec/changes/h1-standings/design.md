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
