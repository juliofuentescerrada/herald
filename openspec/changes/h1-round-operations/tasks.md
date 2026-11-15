## 1. Review gates

- [x] 1.1 Record in proposal.md that merging the batch 2 proposals pull request approved this change, with the review's answers to Q1 to Q3 and any change it asked for (ADR 0018); verify with `openspec validate h1-round-operations`

## 2. Competition

- [x] 2.1 Round state (design D-1) and the operations summary in the schedule details; domain tests for the round scenarios
- [x] 2.2 Entrant departures and their resolutions, including either order and the revision to double absence (D-2); domain tests for every departure scenario
- [x] 2.3 Player withdrawal and sanction on the frozen-roster projection; lineup and start checks (D-3); domain tests for the `match-lineups` scenarios
- [x] 2.4 Migration; features `WithdrawEntrant`, `DisqualifyEntrant`, `WithdrawPlayer`, `SanctionPlayer`, `LiftSanction`; API tests against PostgreSQL, including repeats, conflicts and another organisation's 404s

## 3. Contract and Standings

- [x] 3.1 `TournamentResultsChanged` gains optional entrant status, read as active in older messages; Standings flags departures; tests for the `standings` scenario
- [x] 3.2 Regenerate Wolverine code (`codegen write`) and the OpenAPI documents and client (`pnpm api:generate`); CI drift checks pass

## 4. Admin application

- [x] 4.1 `schedule` feature: operations summary, Entrants panel, departure confirmations, frozen roster dialog with player actions
- [x] 4.2 `matches` feature: unavailable-player blockers; `standings` feature: flags
- [x] 4.3 Vitest for each Visual input state and `axe-core`; lint and boundary checks pass

## 5. End-to-end journey and seeds

- [x] 5.1 `tools/Herald.Seed`: a running team tournament with a sanctioned player and a running individual one with a withdrawn player
- [x] 5.2 Journey 23; the suite passes
- [x] 5.3 Test script in `e2e/scripts/` (seeded data, `scriptPersona`) with a screenshot per step: operations summary, withdrawal confirmation, withdrawn entrant and its absences, flagged standings, round completed, sanctioned player blocking a start

## 6. Validation and completion

- [ ] 6.1 `covers` markers for every scenario this change adds; `node scripts/spec-coverage.mjs` passes
- [ ] 6.2 Full run (`scripts/check all` and the e2e suite); record in design.md
- [ ] 6.3 Capture the Visual input states at 1440 and 390 px, compare with the prototypes and record the differences in design.md
- [ ] 6.4 Docs: visual direction §9.3 inventory, herald-reviewer review of the diff; sync the specs and archive the change in the slice's pull request
