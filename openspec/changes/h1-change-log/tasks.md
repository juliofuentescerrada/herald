## 1. Review gates

- [x] 1.1 Record in proposal.md that merging the batch 3 proposals pull request approved this change, with the review's answers to Q1 and Q2 and any change it asked for (ADR 0018); verify with `openspec validate h1-change-log`

## 2. Tournaments

- [x] 2.1 `ChangeLogEntry`, its own facts in the same transaction (design D-1, D-2); domain tests for the `change-log` scenarios
- [x] 2.2 Migration; consumers of the fact events; `GetChangeLog` and the public projection; API tests against PostgreSQL, including idempotent consumption and another organisation's 404s

## 3. Registration and Competition

- [x] 3.1 `EntryAdmitted`, `EntryCancelled`, `SchedulePublished`, `ScheduleWithdrawn` v1 through the outbox (D-3); tests
- [x] 3.2 Regenerate Wolverine code (`codegen write`) and the OpenAPI documents and client (`pnpm api:generate`); CI drift checks pass

## 4. Admin application

- [x] 4.1 Change log page and its navigation entry (D-4)
- [x] 4.2 Vitest for each Visual input state and `axe-core`; lint and boundary checks pass

## 5. End-to-end journey and seeds

- [x] 5.1 `tools/Herald.Seed`: tournaments with a populated change log
- [x] 5.2 Journey 27; the suite passes
- [x] 5.3 Test script in `e2e/scripts/` (seeded data, `scriptPersona`) with a screenshot per step: populated log, filter, a dates change, the cancellation

## 6. Validation and completion

- [x] 6.1 `covers` markers for every scenario this change adds; `node scripts/spec-coverage.mjs` passes
- [ ] 6.2 Full run (`scripts/check all` and the e2e suite); record in design.md
- [ ] 6.3 Capture the Visual input states at 1440 and 390 px, compare with the prototypes and record the differences in design.md
- [ ] 6.4 Docs: ADR 0017 inventory (the four fact events and their consumer), visual direction §9.3, herald-reviewer review of the diff; sync the specs and archive the change in the slice's pull request
