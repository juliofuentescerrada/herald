## 1. Review gates

- [x] 1.1 Maintainer reviews the proposal, specs and design (A-1 to A-4 and Q-1 accepted on 10 November 2026); record implementation approval in proposal.md and design.md (10 November 2026: approved by the maintainer)
- [x] 1.2 Record the 10 November 2026 decisions in `docs/herald-functional-discovery.md`: D-27 partially confirmed (first row of §5.1), D-08 note (no integration event until Registration consumes it), F-02 rules R-1 to R-5 and the answers from 1.1

## 2. Acting person in the organisation context

- [x] 2.1 `IOrganisationAccess.FindMemberAsync` returns the member's person identifier; the host's membership step and `CreateOrganisation` enter it into `OrganisationContext.ActorId`
- [x] 2.2 Tests: the membership step enters the actor; existing isolation tests still pass

## 3. Tournaments domain

- [x] 3.1 `Tournament`, `TournamentConfiguration` (`Check`, `MissingForPublication`), publication state, revision, created/changed/published by and at; domain events `TournamentDrafted` and `TournamentPublished`
- [x] 3.2 New project `tests/Herald.Tournaments.Tests` in `Herald.slnx`; domain tests without mocks for every validation and publication rule, revision increments, no-change saves, published-stays-complete, team-to-individual clearing, skipped-hour rejection

## 4. Tournaments persistence and features

- [x] 4.1 `TournamentsDbContext` as `OrganisationScopedDbContext`, `Tournament` organisation-owned, revision as concurrency token; migration `AddTournamentSetup`
- [x] 4.2 Features `CreateTournament`, `SaveTournament`, `PublishTournament`, `GetTournament`, `ListTournaments` with their endpoints (Admin group, operation names as in design D-4), validation problems by field and 409 problems with `currentRevision`
- [x] 4.3 API tests against PostgreSQL: the spec scenarios for creation and its retry/conflict, partial draft, each rejection, publication (complete, incomplete, without registration dates, team without structure, repeat), published edits, stale save, repeated save, stale publication, empty list, list per organisation, another owner's read and write (generic 404), public document without tournament operations
- [x] 4.4 Regenerate Wolverine code (`codegen write`) and the OpenAPI documents and client (`pnpm api:generate`)

## 5. Admin application

- [x] 5.1 `tournaments` feature skeleton: routes (list, new, tournament, review) composed in `app.routes.ts`, **Tournaments** rail link, queries and mutations with keys under the organisation
- [x] 5.2 List page: empty, populated (capacity unit, three lifecycle labels, "Continue draft" / "Edit configuration"), loading, failed with retry
- [x] 5.3 Configuration form: fields and sections as the captures, individual/team and on-site/online switching without losing input, read-only profile, time zone proposed from the browser, date-time text (V-3), `confirmLeave`; field presentation shared within the admin application
- [x] 5.4 Form states: missing-for-publication list with focus links and unavailable review, field errors and summary (V-2, V-4, Q-1 wording), saving, save failed with retry, revision conflict with "Reload latest"
- [x] 5.5 Review page: read-only summary (individual and team), visibility in words, publication statements, publishing, publish failed, stale review
- [x] 5.6 Published tournament: header facts, three labels, editable configuration with "Save changes", no start action (V-1)
- [x] 5.7 Vitest for each reviewed state, input retention, summary focus, leave confirmation and `axe-core`; lint and boundary checks pass

## 6. End-to-end journeys

- [x] 6.1 Journey 10: create a draft with a title, see what it lacks, complete, review, publish, and see it published in the list
- [x] 6.2 Journey 11: a save conflicts with a change from another tab, input kept, other change intact

## 7. Validation and completion

- [ ] 7.1 Full run: format, build, all .NET tests, web lint/tests/boundaries/builds, codegen and API drift checks, e2e suite; record in design.md
- [ ] 7.2 Manual run through Aspire: individual and team tournaments from draft to published on desktop and narrow widths; compare with the captures and record differences in design.md
- [ ] 7.3 Update `docs/herald-visual-direction.md` §9.3 (UJ-02 setup row), `docs/roadmap.md`, `README.md`, `CLAUDE.md` status and `openspec/config.yaml`; acceptance review against the specs in design.md
