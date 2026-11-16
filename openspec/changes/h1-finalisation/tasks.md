## 1. Review gates

- [x] 1.1 Record in proposal.md that merging the batch 3 proposals pull request approved this change, with the review's answers to Q1 and Q2 and any change it asked for (ADR 0018); verify with `openspec validate h1-finalisation`

## 2. Competition

- [x] 2.1 Finalised state, final revisions, the barrier and reopening (design D-1, D-3); domain tests for every `competition-finalisation` scenario
- [x] 2.2 Every competitive write rejects a finalised competition (D-2); domain tests
- [x] 2.3 Migration; features `FinaliseCompetition`, `ReopenCompetition`; `CompetitionFinalised` and `CompetitionReopened` v1 through the outbox; API tests against PostgreSQL, including stale reviews, repeats and another organisation's 404s

## 3. Standings and Tournaments

- [x] 3.1 Standings: final status, final revisions, no active champion (D-4, D-5); tests for the `standings` scenarios
- [x] 3.2 Tournaments: `CompetitionState.Finalised` from the events; lifecycle labels
- [ ] 3.3 Regenerate Wolverine code (`codegen write`) and the OpenAPI documents and client (`pnpm api:generate`); CI drift checks pass

## 4. Admin application

- [ ] 4.1 `standings` feature: review panel, stale review, final status, reopen with reason, final revisions (D-6); `matches` feature: finalised refusals
- [ ] 4.2 Vitest for each Visual input state and `axe-core`; lint and boundary checks pass

## 5. End-to-end journey and seeds

- [ ] 5.1 `tools/Herald.Seed`: a finalised league and a fully resolved running one
- [ ] 5.2 Journey 25; the suite passes
- [ ] 5.3 Test script in `e2e/scripts/` (seeded data, `scriptPersona`) with a screenshot per step: review panel, final standings, reopen confirmation, reopened with history, final again

## 6. Validation and completion

- [ ] 6.1 `covers` markers for every scenario this change adds; `node scripts/spec-coverage.mjs` passes
- [ ] 6.2 Full run (`scripts/check all` and the e2e suite); record in design.md
- [ ] 6.3 Capture the Visual input states at 1440 and 390 px, compare with the prototypes and record the differences in design.md
- [ ] 6.4 Docs: visual direction §9.3 inventory, ADR 0017 inventory (finalised, reopened), herald-reviewer review of the diff; sync the specs and archive the change in the slice's pull request
