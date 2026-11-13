## Status

**Proposed in H1 batch 1's proposals pull request (#39), 13 November 2026.** The rules come from the batch's decision session of the same day, recorded in the functional discovery (F-05, CP-04, §5.1, §10.2, §15 rows D-17, D-18, D-23 and D-29). It depends on `h1-round-robin-pairings`. Merging the proposals pull request approves this change (ADR 0018); task 1.1 records that approval.

## Why

With a published schedule, the owner still cannot start the league: the competition state is always "Preparing". CP-04 and §5.1 row 6 make start the step that fixes the field, the schedule and the team rosters, after a readiness check the owner can read. Batch 2 plays matches only in a started competition.

## What Changes

- **Start readiness (CP-04):** the tournament page lists each condition with its state and correction path: registration closed; no entry pending a mandatory check-in; at least two eligible entrants; a schedule published and built from the current eligible field; for a team tournament, every admitted team's roster within the profile's bounds (D-17, D-18). A same-name flag is a warning only.
- **Start (§5.1 row 6):** when every condition holds, the owner starts the competition. It becomes running with who and when, and records the eligible revision and the schedule revision it started on. No match starts by itself. Repeating the start returns the same result; a stale revision is a conflict.
- **What start fixes:** Registration freezes each admitted team's current roster revision (no addition or removal after it) and rejects admission, cancellation and check-in changes; Competition rejects withdrawing or regenerating the schedule. Leaving after start is competitive withdrawal, which batch 2 delivers (D-05, D-23).
- **Coordination (D-08):** Tournaments decides start from its projections of the field counts and the schedule, which gain the eligible revision, the eligible and pending counts and the number of rosters outside their bounds. It tells Registration through the entry terms (`CompetitionStarted`) and Competition through a new `TournamentCompetitionStarted` snapshot. A change that crossed the start is reported, never repaired silently.
- **Admin application:** a Competition panel on the tournament's configuration page, after Registration, with the readiness list and "Start competition"; the lifecycle label becomes "Running"; Entries, rosters and Schedule become read-only with the reason.
- **Notifiable facts (ADR 0017):** none; F-10 lists no start notice. Start is recorded with who and when.
- One end-to-end journey (18): a team tournament's start blocked by an incomplete roster; the owner completes the roster, starts, and is stopped from adding a player to the frozen roster.

Out of scope: match start, lineups and results (batch 2), competitive withdrawal and sanctions after start (batch 2), cancellation and postponement (batch 3), scheduled or automatic start.

## Decision rows

| Row | Status | Used for |
|---|---|---|
| D-17 Roster freeze | Partial; freeze at start and bounds blocking start confirmed 13 Nov 2026 | Freeze, roster blocker |
| D-18 Team start | Partial; H1 start confirmed 13 Nov 2026 | Rosters within bounds; lineups stay with match start |
| D-23 Frozen-roster eligibility | Partial; freeze confirmed, §10.2.1 for batch 2 | No additions or removals after start |
| D-29 Check-in | Partial; absence review confirmed 13 Nov 2026 | Pending entries block start |
| D-27 Lifecycle | Partial; order of §5.1 rows 4 to 6 confirmed 13 Nov 2026 | Start after publication; row 6's other effects (below) |
| D-08 Lifecycle ownership | Confirmed ownership; start coordination specified here | Tournaments decides; Registration and Competition follow |

Open question for the maintainer: §5.1 row 6's effects other than the order remain proposed ("field and rule versions become fixed; do not implicitly start every match"). This change implements them as written; the review of this pull request confirms or changes them.

## Screens

Prototypes in `prototypes/frontend/start-and-pair-states.html` (design.md, Visual input):

- **Configuration page (modified):** Competition panel blocked (individual), blocked by rosters (team), ready, starting, started, start conflict, crossed change after start.
- **Entries page, roster dialog and Schedule page (modified):** read-only once running.
- **Tournament list (modified):** "Running" label.

## Capabilities

### New Capabilities

- `competition-start`: readiness, start, what start fixes, and the Competition panel.

### Modified Capabilities

- `team-rosters`: rosters freeze at start.
- `round-robin-pairings`: a started competition's schedule cannot be withdrawn or regenerated.
- `end-to-end-journeys`: journey 18.

## Impact

- `Herald.Tournaments`: competition state and start on `Tournament`, readiness, feature `StartCompetition`, projections extended, migration.
- `Herald.Registration`: freeze from the terms, frozen roster revision, rejections after start, extended field counts, migration.
- `Herald.Competition`: start projection, rejections after start, crossed-start report.
- `Herald.Contracts`: `TournamentFieldChanged` gains optional `EligibleRevision`, `Eligible`, `Pending`, `RostersOutsideBounds`; `TournamentEntryTermsChanged` gains optional `CompetitionStarted`; new `TournamentCompetitionStarted` v1.
- Admin OpenAPI document and client; Wolverine's generated code; admin `tournaments`, `entries`, `schedule` features.
- `e2e/`: journey 18 and its test script; `tools/Herald.Seed`: a team tournament with a published schedule and one incomplete roster. Docs: visual direction §9.3.
