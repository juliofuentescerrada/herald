## 1. Review gates

- [x] 1.1 Record in proposal.md that merging the batch 2 proposals pull request approved this change, with the review's answers to Q1 and Q2 and any change it asked for (ADR 0018); verify with `openspec validate h1-match-lineups`

## 2. Contracts

- [x] 2.1 `TournamentFrozenRostersChanged` v1 (Registration → Competition) with a serialisation test; `TournamentCompetitionStarted` gains optional `ActivePlayersPerSide`, read as unknown in older messages

## 3. Competition

- [x] 3.1 Rename the round-robin record `Match` to `Pairing`; `Match` aggregate with state, lineup revisions and start (design D-1 to D-3); domain tests for every `match-lineups` scenario
- [x] 3.2 Matches created on start; frozen-roster and active-count projections (D-4); migration
- [x] 3.3 Features `GetMatch`, `RecordLineup`, `StartMatch`; the schedule details list matches with their state; API tests against PostgreSQL, including conflicts, repeats and another organisation's 404s

## 4. Registration and Tournaments

- [x] 4.1 Registration publishes the frozen rosters on start through the outbox; Tournaments sends `ActivePlayersPerSide`; tests for the `team-rosters` scenario
- [x] 4.2 Regenerate Wolverine code (`codegen write`) and the OpenAPI documents and client (`pnpm api:generate`); CI drift checks pass

## 5. Admin application

- [x] 5.1 `schedule` feature: match state badges and links in a running competition
- [x] 5.2 New `matches` feature: Match page with the individual and team states of the Visual input, Lineups panels, start confirmation, conflict and load failure
- [x] 5.3 Vitest for each Visual input state and `axe-core`; lint and boundary checks pass

## 6. End-to-end journey and seeds

- [x] 6.1 `tools/Herald.Seed`: a running team tournament with seven-player rosters and five active players per side
- [x] 6.2 Journey 19; the suite passes
- [x] 6.3 Test script in `e2e/scripts/` (seeded data, `scriptPersona`) with a screenshot per step: match scheduled, one side incomplete, start blocked, both lineups valid, confirmation, in play with locked lineups

## 7. Validation and completion

- [x] 7.1 `covers` markers for every scenario this change adds; `node scripts/spec-coverage.mjs` passes
- [x] 7.2 Full run (`scripts/check all` and the e2e suite); record in design.md
- [x] 7.3 Capture the Visual input states at 1440 and 390 px, compare with the prototypes and record the differences in design.md
- [x] 7.4 Docs: visual direction §9.3 inventory, herald-reviewer review of the diff; sync the specs and archive the change in the slice's pull request
