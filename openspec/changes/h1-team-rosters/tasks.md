## 1. Review gates

- [x] 1.1 Maintainer supplies the mockups of design.md's Visual input and reviews the proposal, specs and design (R-1 to R-10, A-1 to A-5); record implementation approval in proposal.md and design.md
- [x] 1.2 Record the decisions in `docs/herald-functional-discovery.md`: D-17 and TM-02, TM-03 and TM-05 (what this slice confirms: freeze at start, members are guest players, exclusivity by identity among active entries); add the roster row to ADR 0017's inventory

## 2. Contract

- [x] 2.1 `TournamentEntryTermsChanged` gains optional `MinimumRosterSize` and `MaximumRosterSize`; Tournaments sends them for team tournaments; a test deserialises a v1 message without them

## 3. Registration domain

- [x] 3.1 `Entry` roster (members, roster revision, `RosterChange` history), `Field` methods to add and remove members with bounds, exclusivity, cancelled entries, awaiting terms and repeats; derived readiness; the terms carry the bounds; domain events `RosterMemberAdded` and `RosterMemberRemoved`
- [x] 3.2 Domain tests without mocks for every `team-rosters` rule: player kind, individual tournaments, full roster, incomplete, bounds lowered, exclusivity across active entries, cancellation releasing members, same-name flag, revisions, conflicts and repeats

## 4. Registration persistence and features

- [x] 4.1 Mapping and migration `AddRosters`; the terms handler keeps the bounds
- [x] 4.2 Features `AddRosterMember`, `RemoveRosterMember`, `GetRoster`; `GetField` gains roster size, revision and readiness; `FindGuests` reports a player's active team in the tournament (design D-5)
- [x] 4.3 API tests against PostgreSQL for the `team-rosters` scenarios, including two concurrent additions of one player to two teams, another organisation's generic 404s, and bounds arriving from a Tournaments save
- [x] 4.4 Regenerate Wolverine code (`codegen write`) and the OpenAPI documents and client (`pnpm api:generate`)

## 5. Admin application

- [x] 5.1 `entries` feature: readiness on team rows, `Roster` action, roster drawer with members, add (search with unavailable players, create, possible duplicate), remove, history, and every state of design.md's Visual input
- [x] 5.2 Vitest for each Visual input state and `axe-core`; lint and boundary checks pass

## 6. End-to-end journey

- [x] 6.1 Journey 15: a team's roster built to its minimum, a player on another team refused, the team complete

## 7. Validation and completion

- [x] 7.1 Full run: format, build, all .NET tests, web lint/tests/boundaries/builds, codegen and API drift checks, e2e suite; record in design.md
- [ ] 7.2 Capture the Visual input states at 1440 and 390 px and compare with the mockups; maintainer run through Aspire; record differences in design.md
- [ ] 7.3 Update `docs/herald-visual-direction.md` §9.3, `docs/roadmap.md`, `README.md`, `CLAUDE.md` status and `openspec/config.yaml`; acceptance review against the specs in design.md
