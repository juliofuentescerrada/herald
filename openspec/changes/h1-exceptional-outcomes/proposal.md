## Status

**Proposed in H1 batch 2's proposals pull request, 15 November 2026.** The rules come from the batch's decision session of the same day, recorded in the functional discovery (§8.1, confirmed as D-25; F-07, F-08; §15 rows D-05 and D-25). It depends on `h1-operator-results`. Merging the proposals pull request approves this change (ADR 0018); task 1.1 records that approval.

## Why

Not every match is played to a result. F-08 makes no-show, concession and administrative decision distinct actions that never fabricate a played score, and the §8.1 table, confirmed on 15 November 2026, gives each its points and its effect on participation. AT-06 repeats those rows.

## What Changes

- **Causes (§8.1):** besides "played", the owner records for a match of a running competition:
  - **concession**, naming the conceding entrant and whether play took place: opponent 3, conceding entrant 0; after play, the locked lineups' appearances are kept;
  - **single absence**, naming the absent entrant: the ready opponent 3, the absent entrant 0, no appearances, neither entrant withdrawn;
  - **double absence**: 0 each, no appearances, both still eligible for later matches;
  - **no contest**, with a required reason and whether play took place: 0 each, no winner, any recorded play kept; H1 offers no replay.
- **Play and its evidence (§8):** the owner states whether play took place for a concession or a no contest; nothing is preselected. An absence never records play. For a team match, "play took place" requires the match in play (locked lineups): an administrative outcome cannot manufacture start evidence. Any cause may resolve a match that has not started.
- **One effective result:** as for played results; a resolved match rejects another, and corrections (including turning a result into a no contest) are batch 3's (D-07).
- **Admin application:** the Result panel offers the cause first ("Played", "Concession", "Absence", "No contest"), then only that cause's fields; the Schedule page and the Match page show the cause in words ("Sam Reed conceded before play", "No contest: venue closed").
- **Notifiable facts (ADR 0017):** none in H1 (F-10's change log is batch 3).
- One end-to-end journey (21): an owner records a concession before play, a double absence and a no contest with its reason, and sees each cause on the schedule with no score and no appearances.

Out of scope: withdrawals and disqualifications and the outcomes they resolve automatically (`h1-round-operations`), cancellation's voiding (`h1-tournament-cancel-and-dates`), corrections (`h1-safe-corrections`), replay encounters.

## Decision rows

| Row | Status | Used for |
|---|---|---|
| D-25 Terminal outcomes | Confirmed 15 Nov 2026 (§8.1) | Every cause, its points and participation effect |
| D-05 Withdrawal | Confirmed for H1 15 Nov 2026 | Not here: the in-play withdrawal row arrives with `h1-round-operations` |
| D-07 Corrections | Proposed (batch 3) | No change to a resolved match |

## Open questions for the review

- **Q1** Only the no contest requires a reason (confirmed). Concession and absences take none; if an operator wants one, it waits for the batch 3 change log. Confirm, or add an optional private note to every administrative outcome.

## Screens

Prototypes in `prototypes/frontend/play-and-score-states.html` (design.md, Visual input):

- **Match page (modified):** Result panel with each cause chosen, a no contest missing its reason, a team "play took place" without start, and each resolved cause.
- **Schedule page (modified):** match rows with exceptional causes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `match-results`: concession, absences and no contest.
- `end-to-end-journeys`: journey 21.

## Impact

- `Herald.Competition`: causes `Concession`, `SingleAbsence`, `DoubleAbsence`, `NoContest` with their fields; `RecordResult` takes the cause; migration for the new resolution fields.
- Admin OpenAPI document and client; Wolverine's generated code; admin `matches` and `schedule` features.
- `e2e/`: journey 21 and its test script; `tools/Herald.Seed`: the running four-player tournament gains one match of each cause. Docs: visual direction §9.3.
