## 1. Review gates

- [x] 1.1 Record in proposal.md that merging the batch 3 proposals pull request approved this change, with the review's answers to Q1 and Q2 and any change it asked for (ADR 0018); verify with `openspec validate h1-safe-corrections`

## 2. Competition

- [x] 2.1 `Match.Correct` with the allowed causes and the kept history (design D-1, D-2); domain tests for every `result-corrections` scenario
- [x] 2.2 Migration; feature `CorrectResult` with operation identity and expected revision; API tests against PostgreSQL, including repeats, conflicts and another organisation's 404s

## 3. Standings

- [x] 3.1 `PreviewCorrection` query over the applied snapshot (D-3); tests for the `standings` scenarios
- [x] 3.2 Regenerate Wolverine code (`codegen write`) and the OpenAPI documents and client (`pnpm api:generate`); CI drift checks pass

## 4. Admin application

- [x] 4.1 `matches` feature: "Correct result", the correction form, the impact panel, the Result history (D-5)
- [x] 4.2 Vitest for each Visual input state and `axe-core`; lint and boundary checks pass

## 5. End-to-end journey and seeds

- [x] 5.1 `tools/Herald.Seed`: a running league with a corrected result
- [x] 5.2 Journey 24; the suite passes
- [x] 5.3 Test script in `e2e/scripts/` (seeded data, `scriptPersona`) with a screenshot per step: resolved match, correction form, impact, corrected result with history

## 6. Validation and completion

- [x] 6.1 `covers` markers for every scenario this change adds; `node scripts/spec-coverage.mjs` passes
- [x] 6.2 Full run (`scripts/check all` and the e2e suite); record in design.md
- [x] 6.3 Capture the Visual input states at 1440 and 390 px, compare with the prototypes and record the differences in design.md
- [ ] 6.4 Docs: visual direction §9.3 inventory, ADR 0017 inventory (corrected result), herald-reviewer review of the diff; sync the specs and archive the change in the slice's pull request
