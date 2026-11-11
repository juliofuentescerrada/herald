## 1. Review gates

- [x] 1.1 Maintainer reviews the proposal, specs and design (§5.1 rows 2 and 3, RW-1 to RW-6, A-1 to A-4, W-1 to W-3; mockups supplied and referenced on 11 November 2026); record implementation approval in proposal.md and design.md (11 November 2026: approved by the maintainer)
- [x] 1.2 Record the decisions in `docs/herald-functional-discovery.md`: D-27 (rows 2 and 3 of §5.1 confirmed), the §5.1 status line, and F-02's confirmed rules for this slice

## 2. Tournaments domain

- [x] 2.1 `RegistrationWindow`, `Tournament.Registration` with `RegistrationChangedBy`/`At`, `OpenRegistration`, `CloseRegistration`, RW-5 in `Change`, `TournamentConfiguration.MissingForRegistration`; domain events `TournamentRegistrationOpened` and `TournamentRegistrationClosed`
- [x] 2.2 Domain tests without mocks: open (published with dates, draft, missing dates), close (open, not open, closed), reopen (with and without dates), repeats, stale revisions, revision increments, who/when, saves while open, closed and not open

## 3. Persistence and features

- [x] 3.1 Map the new state; migration `AddRegistrationWindow` with not open as the default for existing rows
- [x] 3.2 Features `OpenRegistration` and `CloseRegistration` with their endpoints (Admin group, operation names as in design D-3); `TournamentDetails` and `TournamentSummary` return the real registration state, `missingForRegistration` and the time of the last window change
- [x] 3.3 API tests against PostgreSQL: the scenarios of `registration-window` (open, missing dates, draft, close, reopen, reopen without a date, close when not open, repeat, stale, another owner's generic 404) and of the modified `tournament-setup` requirements (save while open without a date, save while closed, missing-for-registration in the read, list after opening); the public document still has no tournament operation
- [x] 3.4 Regenerate Wolverine code (`codegen write`) and the OpenAPI documents and client (`pnpm api:generate`)

## 4. Admin application

- [x] 4.1 Registration area on the published tournament page: state in words, announced window, the last change (W-1), one action per state, mutations with the stored revision, list invalidated; three registration labels on the page and the list
- [x] 4.2 States: unavailable with missing dates (focus links) and with unsaved changes, opening and closing in progress, failed with retry, conflict with "Reload latest", a save rejected while open; no area on a draft
- [x] 4.3 Vitest for each state of design.md's Visual input and `axe-core`; lint and boundary checks pass

## 5. End-to-end journey

- [ ] 5.1 Journey 12: open the registration of a published tournament, see it open in the list, close it and reopen it

## 6. Validation and completion

- [ ] 6.1 Full run: format, build, all .NET tests, web lint/tests/boundaries/builds, codegen and API drift checks, e2e suite; record in design.md
- [ ] 6.2 Manual run through Aspire on desktop and narrow widths; compare with the captures and record differences in design.md
- [ ] 6.3 Update `docs/herald-visual-direction.md` §9.3, `docs/roadmap.md`, `README.md`, `CLAUDE.md` status and `openspec/config.yaml`; acceptance review against the specs in design.md
