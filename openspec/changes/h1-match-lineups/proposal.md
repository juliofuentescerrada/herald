## Status

**Proposed in H1 batch 2's proposals pull request, 15 November 2026.** The rules come from the batch's decision session of the same day, recorded in the functional discovery (§8, §10.2 "Confirmed for match lineups", §10.2.1, §15 rows D-18 and D-23). It depends on batch 1 (`h1-competition-start`). Merging the proposals pull request approves this change (ADR 0018); task 1.1 records that approval.

**Review answers, 15 November 2026 (#63):** the maintainer accepted Q1 and Q2 (§5.1's "Start a match" row, lineups at any time after start, confirmation on a team start) as proposed, and the prototypes as they are.

## Why

A started competition fixes the schedule and the team rosters, but no match can be played: matches have no identity of their own, and a team match has no lineup. §5.1's "Start a match" row and TM-06/07 make each match start the moment its lineups are validated and locked, and F-08 asks that a team short of eligible players cannot start.

## What Changes

- **Matches (§5.1 "Start a match"):** when the competition starts, each pairing of the started schedule revision becomes a match with its own identifier and state: scheduled, then in play. Rests stay rests and never become matches.
- **Lineups (TM-06, TM-07, confirmed 15 Nov 2026):** for a team match, the owner records each side's lineup: exactly the profile's active players per side, distinct players of that team's frozen roster. The owner may revise a lineup until the match starts; each revision is kept with who and when. Unused roster members are reserves for that match.
- **Match start:** the owner starts a scheduled match of a running competition. For a team match, start validates both lineups (the required count, distinct frozen-roster players, no player on both sides) and locks them in the same operation; an invalid or missing lineup blocks start and names the side and the problem, and nothing is substituted. An individual match starts with no lineup. A later-round match may start before earlier rounds finish. Repeating a start returns the started match; a stale revision is a conflict.
- **Coordination (D-08):** Competition learns the frozen rosters from Registration (`TournamentFrozenRostersChanged` v1) and the active count from Tournaments (`TournamentCompetitionStarted` gains optional `ActivePlayersPerSide`).
- **Admin application:** the Schedule page of a running competition lists each match with its state and opens a new Match page; for a team match, the Match page shows a Lineups panel per side and "Start match".
- **Notifiable facts (ADR 0017):** none; F-10 lists no lineup or match start notice. Each lineup revision and match start is recorded with who and when.
- One end-to-end journey (19): an owner records a team match's lineups from seven-player frozen rosters, is stopped from starting with four starters on one side, completes it and starts the match, which locks both lineups.

Out of scope: results (`h1-operator-results`), player withdrawal and sanctions and the blockers they add (`h1-round-operations`), self-service or representative lineup submission (H2, D-34), substitutions within a match (D-19), scheduling times and tables.

## Decision rows

| Row | Status | Used for |
|---|---|---|
| D-18 Team start | Partial; lineups with each match's start confirmed 13 Nov 2026 | Lineups locked at match start |
| D-23 Frozen-roster eligibility | Confirmed for H1 on 15 Nov 2026 | Lineups use only the frozen roster; unavailable players arrive with `h1-round-operations` |
| D-19 Substitution windows | Confirmed exclusion | No change within a running match |
| D-08 Lifecycle ownership | Confirmed ownership | Competition owns matches and lineups; Registration owns the frozen roster |

§10.2 "Confirmed for match lineups" (15 Nov 2026) settles the lock at match start. §5.1's "Start a match" row was confirmed as written on 15 November 2026 (#63); this change implements it, except for "no competitive departure preventing play", which arrives with `h1-round-operations` (Q1).

## Open questions for the review

- **Q1** Confirm §5.1's "Start a match" row as implemented here, with the departure check added by `h1-round-operations`.
- **Q2** A match's lineups are recorded by the organisation's owner only (H1 has no representatives); a lineup may be recorded for any scheduled match, in any round, at any time after start. Confirm.

## Screens

Prototypes in `prototypes/frontend/play-and-score-states.html` (design.md, Visual input):

- **Schedule page (modified):** a running competition's rounds with each match's state and a link to its Match page.
- **Match page (new):** individual scheduled and in play; team with lineups missing, one side incomplete, both valid, start blocked, starting, in play with locked lineups, a stale lineup conflict and a load failure.

## Capabilities

### New Capabilities

- `match-lineups`: matches of a started competition, lineups, match start and the Match page.

### Modified Capabilities

- `team-rosters`: the frozen roster is published to Competition.
- `end-to-end-journeys`: journey 19.

## Impact

- `Herald.Competition`: `Match` aggregate with lineups (the round-robin record `Match` is renamed `Pairing`), matches created on start, features `GetMatch`, `RecordLineup`, `StartMatch`, frozen-roster projection, migration.
- `Herald.Registration`: publishes `TournamentFrozenRostersChanged` on start.
- `Herald.Tournaments`: `TournamentCompetitionStarted` carries `ActivePlayersPerSide`.
- `Herald.Contracts`: `TournamentFrozenRostersChanged` v1; `TournamentCompetitionStarted` gains optional `ActivePlayersPerSide`.
- Admin OpenAPI document and client; Wolverine's generated code; admin `schedule` feature and a new `matches` feature.
- `e2e/`: journey 19 and its test script; `tools/Herald.Seed`: a running team tournament with seven-player rosters and five active players per side. Docs: visual direction §9.3.
