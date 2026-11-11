## 1. Review gates

- [x] 1.1 Maintainer reviews the proposal, specs and design (EN-1 to EN-12, A-1 to A-9, V-1 and V-2; mockups supplied and referenced on 11 November 2026); record implementation approval in proposal.md and design.md (11 November 2026: approved by the maintainer)
- [x] 1.2 Record the decisions in `docs/herald-functional-discovery.md`: D-06 and D-22 (what this slice confirms), D-08 (coordination through events and projections), F-04's confirmed rules for this slice; write ADR 0016 (integration events between modules of the host through durable local queues) and the pointer note in ADR 0009

## 2. Contracts and messaging

- [x] 2.1 `Herald.Contracts`: `TournamentEntryTermsChanged` and `TournamentFieldChanged`, version 1, with their own enumerations
- [x] 2.2 Durable local queue routing for integration events in each consuming module's entry point; deduplication window recorded as chosen; a host test checks each event's route (the event crossing between the real modules and an older snapshot changing nothing are tested with their handlers, in 4.2 and 5.3)

## 3. Registration domain

- [x] 3.1 `Guest` with name rules and normalised name; `Field` with its terms, `Entry` entities and the rules EN-3 to EN-9 and EN-12; domain events
- [x] 3.2 Domain tests without mocks: creation and repeats of guests, normalisation, entering (open, closed, not open, kind, active duplicate, re-entry), automatic and manual admission, the capacity queue order, owner admission with and without a free slot and out of order, cancellation and promotion on cancellation, capacity increase and reopening, no promotion while closed, mismatches, revisions and repeats

## 4. Registration persistence and features

- [x] 4.1 Mapping, organisation filters and migration `AddGuestsAndFields`
- [x] 4.2 Handler of `TournamentEntryTermsChanged` (creates or updates the field, keeps the highest revision, applies EN-8) and publication of `TournamentFieldChanged` with every effective field change; tests: the event reaches Registration through its durable local queue without a broker, and an older snapshot changes nothing (the chain from Tournaments' own publication is tested in 5.3)
- [x] 4.3 Features `CreateGuest`, `FindGuests`, `GetField`, `EnterGuest`, `AdmitEntry`, `CancelEntry` with their endpoints (Admin group, operation names as in design D-6)
- [x] 4.4 API tests against PostgreSQL for the `guest-entries` scenarios, including the race for the last slot, another organisation's generic 404s and the public document without these operations

## 5. Tournaments

- [x] 5.1 Publish `TournamentEntryTermsChanged` with every effective change of a published tournament; `FieldCounts` projection with its handler and migration `AddFieldCounts`
- [x] 5.2 EN-10 in saves (`below-admitted`, `locked-by-entries`); `TournamentDetails`/`TournamentSummary` gain the entry counts
- [x] 5.3 Tests: domain tests for EN-10; API tests for the modified `tournament-setup` and `registration-window` scenarios, end to end across both modules (reopening fills free slots, closing keeps entries, counts in the list)
- [x] 5.4 Regenerate Wolverine code (`codegen write`) and the OpenAPI documents and client (`pnpm api:generate`)

## 6. Admin application

- [x] 6.1 `entries` feature: route, page with counts and the three groups, add panel (find, create, possible duplicate), admit (with reason when out of order), cancel confirmation, and every state of design.md's Visual input; any new `ui` control with its catalogue entry
- [x] 6.2 `tournaments` feature: entries link with counts on the tournament page, locked entry kind and admission with their reason, capacity hint and rejection, counts and "Entries" action in the list
- [x] 6.3 Vitest for each Visual input state and `axe-core`; lint and boundary checks pass

## 7. End-to-end journeys

- [x] 7.1 Journey 13: individual, automatic admission, full field, waiting, cancellation promotes
- [x] 7.2 Journey 14: team, manual admission, possible duplicate, admission

## 8. Validation and completion

- [ ] 8.1 Full run: format, build, all .NET tests, web lint/tests/boundaries/builds, codegen and API drift checks, e2e suite; record in design.md
- [ ] 8.2 Capture the Visual input states at 1440 and 390 px and compare with the mockups; maintainer run through Aspire; record differences in design.md
- [ ] 8.3 Update `docs/herald-visual-direction.md` §9.3, `docs/roadmap.md`, `README.md`, `CLAUDE.md` status and `openspec/config.yaml`; acceptance review against the specs in design.md
