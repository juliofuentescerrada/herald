## 1. Review gates

- [x] 1.1 Maintainer supplies the mockups of design.md's Visual input and reviews the proposal, specs and design (R-1 to R-9, A-1 to A-4); record the visual decisions and implementation approval in proposal.md and design.md
- [x] 1.2 Record the decisions in `docs/herald-functional-discovery.md`: F-05 and the decision register (what this slice confirms: no window in H1, pending/confirmed only, undo with history, admitted entries only, policy locked by check-ins); verify with `openspec validate h1-check-in`

## 2. Contract

- [x] 2.1 `TournamentFieldChanged` gains optional `CheckedIn`; a test reads a v1 message without it as 0

## 3. Registration domain

- [x] 3.1 `Entry` check-in (state, check-in revision, `CheckInChange` history), `Field` methods to check in and undo with repeats, conflicts, waiting and cancelled entries; the checked-in count; domain events `EntryCheckedIn` and `EntryCheckInUndone`
- [x] 3.2 Domain tests without mocks for every `entrant-check-in` rule: check in, undo, repeats, stale revisions, waiting and cancelled entries, promotion starting pending, cancellation keeping evidence, team check-in independent of the roster, the count

## 4. Registration persistence and features

- [x] 4.1 Mapping and migration `AddCheckIn`; the field counts message carries `CheckedIn`
- [x] 4.2 Features `CheckIn` and `UndoCheckIn`; `GetField` gains each entry's check-in and the checked-in count (design D-4)
- [x] 4.3 API tests against PostgreSQL for the `entrant-check-in` scenarios, including another organisation's generic 404s and an admission in another tab not conflicting with a check-in

## 5. Tournaments

- [x] 5.1 `EntryCounts` keeps the checked-in count (migration `AddCheckedInCount`); `LockedByEntries` rejects a check-in policy change while confirmed check-ins exist; details expose the count
- [x] 5.2 Domain and API tests for the modified `tournament-setup` scenarios, including the lock arriving from a Registration check-in
- [x] 5.3 Regenerate Wolverine code (`codegen write`) and the OpenAPI documents and client (`pnpm api:generate`); CI drift checks pass

## 6. Admin application

- [x] 6.1 `entries` feature: status label, row meta, check in and undo with toast, failure in place, conflict, cancelled read-only, summary with policy and count, team rows with check-in apart from readiness, every state of design.md's Visual input
- [x] 6.2 `tournaments` feature: the check-in policy locked with its reason in the configuration form
- [x] 6.3 Vitest for each Visual input state and `axe-core`; lint and boundary checks pass

## 7. End-to-end journey

- [x] 7.1 Journey 16: two admitted players checked in, one undone, the count 1 of 2; the suite passes
- [x] 7.2 Test script in `e2e/scripts/` (seeded data, `scriptPersona`) with a screenshot per step of checking in, undoing and the locked check-in policy, for the maintainer's test round

## 8. Validation and completion

- [ ] 8.0 `covers` markers on the tests proving each scenario of `entrant-check-in`, the modified `tournament-setup` and journey 16; `node scripts/spec-coverage.mjs` passes
- [ ] 8.1 Full run: format, build, all .NET tests, web lint/tests/boundaries/builds, codegen and API drift checks, e2e suite; record in design.md
- [ ] 8.2 Capture the Visual input states at 1440 and 390 px and compare with the mockups; maintainer run through Aspire; record differences in design.md
- [ ] 8.3 Update `docs/herald-visual-direction.md` §9.3, `docs/roadmap.md`, `README.md`, `CLAUDE.md` status and `openspec/config.yaml`; acceptance review against the specs in design.md

## Workflow follow-up

- Archive `h1-check-in` in a separate PR after merge.
