## 1. Review gates

- [x] 1.1 Record in proposal.md that merging the batch 2 proposals pull request approved this change, with the review's answer to Q1 and any change it asked for (ADR 0018); verify with `openspec validate h1-exceptional-outcomes`

## 2. Competition

- [x] 2.1 Causes and their outcomes on the resolution (design D-1); play and start evidence (D-2); domain tests for every added `match-results` scenario
- [ ] 2.2 Migration; `RecordResult` takes the cause and its fields; details carry them; API tests against PostgreSQL, including the rejections and repeats
- [ ] 2.3 Regenerate Wolverine code (`codegen write`) and the OpenAPI documents and client (`pnpm api:generate`); CI drift checks pass

## 3. Admin application

- [ ] 3.1 `matches` feature: the cause-first Result panel and resolved summaries; `schedule` feature: causes in match rows
- [ ] 3.2 Vitest for each Visual input state and `axe-core`; lint and boundary checks pass

## 4. End-to-end journey and seeds

- [ ] 4.1 `tools/Herald.Seed`: one match of each cause in the running four-player tournament
- [ ] 4.2 Journey 21; the suite passes
- [ ] 4.3 Test script in `e2e/scripts/` (seeded data, `scriptPersona`) with a screenshot per step: concession chosen, conceded before play, double absence, no contest missing its reason, no contest recorded, schedule with the causes

## 5. Validation and completion

- [ ] 5.1 `covers` markers for every scenario this change adds; `node scripts/spec-coverage.mjs` passes
- [ ] 5.2 Full run (`scripts/check all` and the e2e suite); record in design.md
- [ ] 5.3 Capture the Visual input states at 1440 and 390 px, compare with the prototypes and record the differences in design.md
- [ ] 5.4 Docs: visual direction §9.3 inventory, herald-reviewer review of the diff; sync the specs and archive the change in the slice's pull request
