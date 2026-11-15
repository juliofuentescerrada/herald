## 1. Review gates

- [ ] 1.1 Record in proposal.md that merging the batch 2 proposals pull request approved this change, with the review's answers to Q1 and Q2 and any change it asked for (ADR 0018); verify with `openspec validate h1-operator-results`

## 2. Competition

- [ ] 2.1 `Match` resolution, cause `Played` and appearances (design D-1, D-2); domain tests for every `match-results` scenario
- [ ] 2.2 Migration; feature `RecordResult`; match and schedule details carry the resolution; API tests against PostgreSQL, including repeats, conflicts, a second result and another organisation's 404s
- [ ] 2.3 Regenerate Wolverine code (`codegen write`) and the OpenAPI documents and client (`pnpm api:generate`); CI drift checks pass

## 3. Admin application

- [ ] 3.1 `matches` feature: Result panel with the Visual input states; `schedule` feature: outcomes in match rows
- [ ] 3.2 Vitest for each Visual input state and `axe-core`; lint and boundary checks pass

## 4. End-to-end journey and seeds

- [ ] 4.1 `tools/Herald.Seed`: a running four-player tournament with one match resolved
- [ ] 4.2 Journey 20; the suite passes
- [ ] 4.3 Test script in `e2e/scripts/` (seeded data, `scriptPersona`) with a screenshot per step: empty Result panel, outcome chosen, win recorded, draw recorded, schedule with both results

## 5. Validation and completion

- [ ] 5.1 `covers` markers for every scenario this change adds; `node scripts/spec-coverage.mjs` passes
- [ ] 5.2 Full run (`scripts/check all` and the e2e suite); record in design.md
- [ ] 5.3 Capture the Visual input states at 1440 and 390 px, compare with the prototypes and record the differences in design.md
- [ ] 5.4 Docs: visual direction §9.3 inventory, herald-reviewer review of the diff; sync the specs and archive the change in the slice's pull request
