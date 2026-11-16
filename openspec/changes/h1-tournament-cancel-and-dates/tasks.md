## 1. Review gates

- [x] 1.1 Record in proposal.md that merging the batch 3 proposals pull request approved this change, with the review's answers to Q1 to Q3 and any change it asked for (ADR 0018); verify with `openspec validate h1-tournament-cancel-and-dates`

## 2. Tournaments

- [x] 2.1 Cancelled state, archive flag, draft deletion and `ChangeDates` (design D-1, D-3 to D-5); domain tests for every `tournament-lifecycle` scenario
- [x] 2.2 Migration; features `CancelTournament`, `ArchiveTournament`, `UnarchiveTournament`, `DeleteDraft`, `ChangeDates`; the list filter; `TournamentCancelled` and `TournamentArchiveChanged` v1; API tests against PostgreSQL, including repeats, conflicts and another organisation's 404s

## 3. Registration and Competition

- [x] 3.1 Registration cancels active entries and rejects later writes; tests for the `guest-entries` scenarios
- [x] 3.2 Competition withdraws the publication or voids unresolved matches, rejects later writes, tracks archive; migration; tests for the `round-robin-pairings` scenarios
- [ ] 3.3 Regenerate Wolverine code (`codegen write`) and the OpenAPI documents and client (`pnpm api:generate`); CI drift checks pass

## 4. Admin application

- [ ] 4.1 `tournaments` feature: summary actions, change dates dialog, cancel and delete confirmations, cancelled notice, "Show archived" (D-6)
- [ ] 4.2 `schedule` and `standings` features: voided matches and the cancelled status
- [ ] 4.3 Vitest for each Visual input state and `axe-core`; lint and boundary checks pass

## 5. End-to-end journey and seeds

- [ ] 5.1 `tools/Herald.Seed`: a cancelled running tournament, an archived finalised one and a draft
- [ ] 5.2 Journey 26; the suite passes
- [ ] 5.3 Test script in `e2e/scripts/` (seeded data, `scriptPersona`) with a screenshot per step: dates preview, cancel confirmation, cancelled with voided matches, archived list

## 6. Validation and completion

- [ ] 6.1 `covers` markers for every scenario this change adds; `node scripts/spec-coverage.mjs` passes
- [ ] 6.2 Full run (`scripts/check all` and the e2e suite); record in design.md
- [ ] 6.3 Capture the Visual input states at 1440 and 390 px, compare with the prototypes and record the differences in design.md
- [ ] 6.4 Docs: visual direction §9.3 inventory, ADR 0017 inventory (cancelled, dates changed), herald-reviewer review of the diff; sync the specs and archive the change in the slice's pull request
