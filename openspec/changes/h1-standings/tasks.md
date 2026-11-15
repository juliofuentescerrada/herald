## 1. Review gates

- [x] 1.1 Record in proposal.md that merging the batch 2 proposals pull request approved this change, with the review's answers to Q1 and Q2 and any change it asked for (ADR 0018); verify with `openspec validate h1-standings`

## 2. Contract and Competition

- [x] 2.1 `TournamentResultsChanged` v1 with a serialisation test (design D-1)
- [x] 2.2 Competition publishes it on start and on every resolution through the outbox; tests that each write publishes the next revision

## 3. Standings

- [x] 3.1 Domain: the table from a snapshot (D-2); domain tests for every `standings` scenario
- [x] 3.2 Projection, migration and feature `GetStandings`; API tests against PostgreSQL, including an older snapshot and another organisation's 404s
- [x] 3.3 Regenerate Wolverine code (`codegen write`) and the OpenAPI documents and client (`pnpm api:generate`); CI drift checks pass

## 4. Admin application

- [x] 4.1 New `standings` feature: Standings page with the Visual input states; the Standings tab on every tournament page
- [x] 4.2 Vitest for each Visual input state and `axe-core`; lint and boundary checks pass

## 5. End-to-end journey and seeds

- [ ] 5.1 `tools/Herald.Seed`: the running four-player tournament's results give a shared position
- [ ] 5.2 Journey 22; the suite passes
- [ ] 5.3 Test script in `e2e/scripts/` (seeded data, `scriptPersona`) with a screenshot per step: before start, provisional table, shared position, an entrant's explanation, narrow layout

## 6. Validation and completion

- [ ] 6.1 `covers` markers for every scenario this change adds; `node scripts/spec-coverage.mjs` passes
- [ ] 6.2 Full run (`scripts/check all` and the e2e suite); record in design.md
- [ ] 6.3 Capture the Visual input states at 1440 and 390 px, compare with the prototypes and record the differences in design.md
- [ ] 6.4 Docs: visual direction §9.3 inventory, the Standings module README, herald-reviewer review of the diff; sync the specs and archive the change in the slice's pull request
