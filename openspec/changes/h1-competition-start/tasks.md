## 1. Review gates

- [x] 1.1 Record in proposal.md that merging the batch 1 proposals pull request approved this change, with any change the review asked for (ADR 0018); verify with `openspec validate h1-competition-start`

## 2. Contracts

- [x] 2.1 `TournamentFieldChanged` gains optional `EligibleRevision`, `Eligible`, `Pending`, `RostersOutsideBounds`; `TournamentEntryTermsChanged` gains optional `CompetitionStarted`; tests read older messages as unknown or not started
- [x] 2.2 `TournamentCompetitionStarted` v1 (Tournaments → Competition) with a serialisation test

## 3. Tournaments

- [x] 3.1 `Tournament` competition state and `Start` (design D-1); readiness from the projections (D-2); domain tests for every `competition-start` scenario
- [x] 3.2 Migration; feature `StartCompetition`; details expose readiness and start; terms and `TournamentCompetitionStarted` through the outbox
- [x] 3.3 API tests against PostgreSQL, including conflicts, repeats and another organisation's 404s

## 4. Registration and Competition

- [x] 4.1 Registration: extended counts, frozen roster revision, rejections after start, crossed roster report (D-3, D-4); domain and API tests for the `team-rosters` and "Start fixes the field" scenarios
- [x] 4.2 Competition: start projection, rejections after start, crossed withdrawal (D-4); tests for the modified `round-robin-pairings` scenario
- [x] 4.3 Regenerate Wolverine code (`codegen write`) and the OpenAPI documents and client (`pnpm api:generate`); CI drift checks pass

## 5. Admin application

- [x] 5.1 `tournaments` feature: Competition panel with readiness, confirmation, starting, started, conflict and crossed states; "Running" label in the page and list
- [x] 5.2 `entries` and `schedule` features: read-only once running, frozen roster in the roster dialog
- [x] 5.3 Vitest for each Visual input state and `axe-core`; lint and boundary checks pass

## 6. End-to-end journey and seeds

- [x] 6.1 `tools/Herald.Seed`: a team tournament with a published schedule and one roster below the minimum
- [x] 6.2 Journey 18; the suite passes
- [x] 6.3 Test script in `e2e/scripts/` (seeded data, `scriptPersona`) with a screenshot per step: readiness blocked, roster completed, ready, confirmation, running, frozen roster

## 7. Validation and completion

- [x] 7.1 `covers` markers for every scenario this change adds; `node scripts/spec-coverage.mjs` passes
- [x] 7.2 Full run (`scripts/check all` and the e2e suite); record in design.md
- [x] 7.3 Capture the Visual input states at 1440 and 390 px, compare with the prototypes and record the differences in design.md
- [ ] 7.4 Docs: visual direction §9.3 inventory, herald-reviewer review of the diff; sync the specs and archive the change in the slice's pull request
