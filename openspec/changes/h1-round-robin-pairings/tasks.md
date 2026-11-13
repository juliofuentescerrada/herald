## 1. Review gates

- [ ] 1.1 Record in proposal.md that merging the batch 1 proposals pull request approved this change, with any change the review asked for (ADR 0018); verify with `openspec validate h1-round-robin-pairings`

## 2. Contracts

- [ ] 2.1 `TournamentEntryTermsChanged` gains optional `CheckIn` and `FieldLocked`; tests read a v1 message without them as optional and unlocked
- [ ] 2.2 `TournamentEligibleFieldChanged` v1 (Registration → Competition) and `TournamentScheduleChanged` v1 (Competition → Tournaments), with serialisation tests

## 3. Registration

- [ ] 3.1 `Field`: eligible revision (design D-2), cancellation cause, mark absent (D-7), the lock from the terms rejecting admit, cancel and check-in changes (D-3); domain events; domain tests for every scenario of the modified `entrant-check-in` and `guest-entries`
- [ ] 3.2 Mapping and migration; feature `MarkAbsent`; the eligible field message published through the outbox with the field counts; `GetField` gains each cancellation's cause and the lock
- [ ] 3.3 API tests against PostgreSQL for those scenarios, including another organisation's generic 404s

## 4. Competition

- [ ] 4.1 Circle-method generator in `Domain` with seeding by admission order or recorded seed (D-6); tests for 2 to 9 entrants (every pair once, one rest each when odd, determinism by seed)
- [ ] 4.2 `Schedule` aggregate (D-1): eligible-field projection, generate, regenerate, stale, publish, repeat, withdraw with reason, crossed field (D-5); domain tests for every `round-robin-pairings` scenario
- [ ] 4.3 Persistence and first model migration; handler for `TournamentEligibleFieldChanged`; features `GenerateSchedule`, `PublishSchedule`, `WithdrawSchedule`, `GetSchedule` with revisions and operation identities (D-8); `TournamentScheduleChanged` through the outbox
- [ ] 4.4 API tests against PostgreSQL for the `round-robin-pairings` scenarios, including conflicts, repeats and another organisation's 404s

## 5. Tournaments

- [ ] 5.1 Schedule projection from `TournamentScheduleChanged` (D-4); terms carry `CheckIn` and `FieldLocked`; reopening rejected while published; migration; tests for the modified `registration-window` scenario
- [ ] 5.2 Regenerate Wolverine code (`codegen write`) and the OpenAPI documents and client (`pnpm api:generate`); CI drift checks pass

## 6. Admin application

- [ ] 6.1 `schedule` feature: route beside Entries and every Schedule state of design.md's Visual input
- [ ] 6.2 `entries` feature: absence-review summary, "Mark absent" with confirmation, cancellation cause, locked field; `tournaments` feature: reopening locked
- [ ] 6.3 Vitest for each Visual input state and `axe-core`; lint and boundary checks pass

## 7. End-to-end journey and seeds

- [ ] 7.1 `tools/Herald.Seed`: a closed individual tournament with five admitted players, one pending under mandatory check-in
- [ ] 7.2 Journey 17; the suite passes
- [ ] 7.3 Test script in `e2e/scripts/` (seeded data, `scriptPersona`) with a screenshot per step: absence review, draft with rests, publication, withdrawal with reason, republication

## 8. Validation and completion

- [ ] 8.1 `covers` markers for every scenario this change adds; `node scripts/spec-coverage.mjs` passes
- [ ] 8.2 Full run (`scripts/check all` and the e2e suite); record in design.md
- [ ] 8.3 Capture the Visual input states at 1440 and 390 px, compare with the prototypes and record the differences in design.md
- [ ] 8.4 Docs: visual direction §9.3 inventory, ADR 0017 inventory (schedule published and withdrawn; cancellation cause); herald-reviewer review of the diff; sync the specs and archive the change in the slice's pull request
