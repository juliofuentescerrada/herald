## Status

**Proposed in H1 batch 2's proposals pull request, 15 November 2026.** The rules come from the batch's decision session of the same day, recorded in the functional discovery (§8 "Confirmed for operator results", §8.1, F-07, §15 row D-25). It depends on `h1-match-lineups`. Merging the proposals pull request approves this change (ADR 0018); task 1.1 records that approval.

**Review answers, 15 November 2026 (#63):** the maintainer accepted Q1 and Q2 (appearances from the locked lineups, §5.1's "Resolve a pairing" row) as proposed, and the prototypes as they are.

## Why

Matches can start but cannot finish. F-07 has the operator enter a directly effective result in H1, and §8 fixes its shape: a winner or a draw and its cause, no score. Standings (`h1-standings`) and the exceptional outcomes (`h1-exceptional-outcomes`) build on one effective resolution per match.

## What Changes

- **Played result (§8, confirmed 15 Nov 2026):** the owner records a played result for a match of a running competition: one entrant wins, or a draw (allowed by the generic profile, D-04). The result is effective at once, with who and when, the cause "played" and play recorded. No score is kept.
- **Individual matches:** recording a played result on a scheduled match starts and resolves it in one operation; a match already in play is resolved.
- **Team matches:** a played result requires the match in play, so its lineups are locked (§8: a played team result references its start evidence). The locked lineup players are credited with an appearance (Q1); reserves are not.
- **One effective result:** a resolved match rejects another result, stating that corrections come later (D-07, batch 3). Repeating the same operation returns the original result; a stale revision is a conflict with the current match; nothing partial is stored.
- **Admin application:** the Match page gains a Result panel with the outcome as a radio group that starts with nothing selected, and "Record result"; the Schedule page shows each resolved match's outcome.
- **Notifiable facts (ADR 0017):** none in H1; F-10's change log (batch 3) records revised final results, not first results.
- One end-to-end journey (20): an owner records a win in an individual match, which starts and resolves it in one step, records a draw in another, and sees both on the schedule.

Out of scope: concessions, absences, no contest and administrative outcomes (`h1-exceptional-outcomes`), standings (`h1-standings`), round completion (`h1-round-operations`), corrections (`h1-safe-corrections`), competitor reports and confirmation (H2), scores and game or map detail (H3).

## Decision rows

| Row | Status | Used for |
|---|---|---|
| D-25 Terminal outcomes | Confirmed 15 Nov 2026 (§8.1) | The played row: winner 3, loser 0, draw 1 each; credit only recorded play |
| D-04 Initial profile | Confirmed | Draws allowed in the generic profile |
| D-07 Corrections | Proposed (batch 3) | A resolved match rejects a second result |
| D-02, D-15 API contract | Proposed (batch 3) | Idempotent operation identity, as every Herald write already has |

§5.1's "Resolve a pairing" row was confirmed as written on 15 November 2026 (#63); this change implements its played part.

## Open questions for the review

- **Q1** In H1, with no substitution within a match (D-19), a played team result credits an appearance to each player of the two locked lineups, and to no reserve. Confirm, or keep appearances unrecorded until a later profile records actual participants.
- **Q2** Confirm §5.1's "Resolve a pairing" row for played results; its round-completion part arrives with `h1-round-operations`.

## Screens

Prototypes in `prototypes/frontend/play-and-score-states.html` (design.md, Visual input):

- **Match page (modified):** Result panel empty, chosen, saving, resolved (win and draw), team in play, a team match not yet started, repeat and conflict.
- **Schedule page (modified):** resolved matches with their outcome.

## Capabilities

### New Capabilities

- `match-results`: operator-entered played results, one effective result per match, and the Result panel.

### Modified Capabilities

- `end-to-end-journeys`: journey 20.

## Impact

- `Herald.Competition`: `Match` gains a resolution (outcome, cause, played, who, when, operation) and appearances; feature `RecordResult`; schedule details carry outcomes; migration.
- Admin OpenAPI document and client; Wolverine's generated code; admin `matches` and `schedule` features.
- `e2e/`: journey 20 and its test script; `tools/Herald.Seed`: a running four-player tournament with one match resolved. Docs: visual direction §9.3.
