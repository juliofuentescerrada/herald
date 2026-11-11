## Context

`h1-organisation-access` gave Herald sign-in, organisations with a single owner, the organisation context and persistence isolation (ADR 0014). `Herald.Tournaments` is still the empty module from M0: an entry point and a `DbContext` with no entities. The admin application has an overview page and the organisation screens, and its rail has one destination.

This change is the first slice of F-02. The maintainer confirmed on 10 November 2026:

- **Scope:** create, configure, review and publish a tournament; list tournaments; edit after publication. Everything else in F-02 waits for the slice that needs it.
- **D-27, first row of §5.1 only:** publishing a draft makes it published; registration stays not open; nothing else is created; there is no unpublish. The rest of §5.1 and §5.2 stays Proposed.
- **D-08:** Tournaments owns configuration, publication and configured capacity. No coordination with Registration exists yet; the "tournament published" integration event is defined when Registration consumes it.
- **Publishing without a public page:** visibility is stored and has no effect until the public-reads slice.
- **R-1** a draft needs only a title. **R-2** capacity ≥ 2; opening < closure; closure ≤ planned start; active players ≤ minimum roster ≤ maximum roster. **R-3** publication requires planned start and time zone, not the registration dates (those are required when registration opens, next slice). **R-4** nothing is preselected except the time zone, proposed from the browser. **R-5** a published tournament must stay complete on every save; entry kind stays editable while no entries exist.

**Approved for implementation by the maintainer on 10 November 2026** (gate 1.1).

## Goals / Non-Goals

**Goals:**

- A `Tournament` aggregate whose rules live in Domain and are the same for the API and the admin application.
- Revision-aware, retry-safe writes without new infrastructure.
- The reviewed screens and states, with the corrections listed below.

**Non-Goals:**

- Registration window, entries, capacity enforcement against admissions, announcements, cancellation, archival, the public page and visibility effects, integration events, pilot API access, a profile catalogue.
- A configuration history: with no admissions nobody is affected by a change, so only the current configuration, its revision and who/when last changed it are kept (ADR 0007 applies from the first change that affects an entrant).

## Visual input

Screens: tournament list; configuration form (new, draft, published; individual and team); review before publishing; published tournament page. The admin rail gains **Tournaments**.

References: [tournament setup state review](../../../prototypes/frontend/tournament-setup-states.html) and its [18 states in 36 desktop/mobile captures](../../../docs/assets/mockups/tournament-setup/README.md), produced by the maintainer on 10 November 2026 from `.prompts/h1-tournament-setup-mockups.md`. They replace `journeys.html?step=setup` and the `configuration` state as the reference for these screens.

| Screen | States covered |
|---|---|
| List | `list-empty`, `list-populated`, `list-loading`, `list-failed` |
| Form | `create-individual`, `edit-individual-draft`, `edit-team-draft`, `draft-incomplete`, `validation-errors`, `saving`, `save-failed`, `revision-conflict` |
| Review | `preview-individual`, `preview-team`, `publishing`, `publish-failed` |
| Published | `published-individual`, `published-team` |

Corrections to apply when implementing (the captures are not regenerated for them):

| # | Capture | Correction |
|---|---|---|
| V-1 | `published-*` | Remove "A draft can be saved before all publication requirements are complete" from a published tournament |
| V-2 | `validation-errors` | The error summary is as wide as the form card |
| V-3 | all forms | The native date-time control follows the browser's locale, so each field also shows its value as "14 November 2026, 10:00"; read-only views use only that format |
| V-4 | `validation-errors` | A field in error uses the danger colour on its border and message plus an icon; the "Error:" text stays, so colour is not the only signal |
| V-5 | all | The rail's **Organisation** destination is not built: no such screen exists. The rail shows Overview and Tournaments |
| V-6 | `create-individual` | The reference time zone is proposed from the browser (R-4); the capture shows it empty |

**Deviation accepted by the maintainer on 10 November 2026 (Q-1):** the `validation-errors` capture titles its summary "Correct 3 fields before publication" and still offers "Save draft", which suggests an inconsistent draft could be stored. This design rejects inconsistent values on every save (spec: "Configuration values are validated on every save"), so the summary reads "Correct 3 fields to save". Reason: the aggregate never holds values that contradict each other, and the typed input is kept anyway. Missing values remain allowed in a draft and are the only thing listed "before publication".

## Decisions

### D-1 Aggregate and configuration

`Tournament` (`Domain`) holds a `TournamentConfiguration` value object, `Publication` (draft or published), `Revision`, and who/when for creation, last change and publication. Registration and competition states are not stored: until their slices exist they are always "not open" and "preparing", and the read model returns those constants. Storing columns nobody can change would be dead state.

`TournamentConfiguration.Check(...)` returns the broken rules as `(field, rule)` pairs, like `OrganisationName.Check`; `MissingForPublication()` returns the absent required fields. Endpoints turn both into validation problems; the read model returns the second. The rules exist once, in Domain.

The competition profile is a constant in the read model, not a column. The column arrives with the second profile (H3), backfilled with this one. F-02's "a later profile edit does not change tournament rules" has nothing to protect while profiles cannot be edited.

*Alternative considered:* separate `Draft` and `PublishedTournament` types. Rejected: the only difference is whether completeness is required, one condition in `Change`.

### D-2 Date-times and the time zone

Planned start, registration opening and closure are stored as local date-times (`timestamp without time zone`) next to the IANA zone identifier, which is what the owner typed and what is announced. Nothing in this slice acts at an instant; the slice that does converts with `TimeZoneInfo`. Ordering rules compare local values, which is correct because all three share the one reference zone.

The zone is validated with `TimeZoneInfo.TryFindSystemTimeZoneById`; a local time the zone skips (spring forward) is rejected with `TimeZoneInfo.IsInvalidTime`. A repeated hour (autumn) is accepted and read as its first occurrence when instants are needed; noted in the code as a known limit.

*Alternative considered:* storing instants. Rejected for now: a draft may have dates and no zone yet, and converting on every edit of the zone would silently move announced times.

### D-3 Revisions, conflicts and retries

`Revision` is an integer incremented in the aggregate on each effective change and mapped as the EF Core concurrency token, so two simultaneous writes cannot both succeed. Commands carry `expectedRevision`.

Retry safety needs no stored operation identities here, because both writes are idempotent by content:

- **Create:** client-supplied identifier; same identifier and content returns the original, different content or another organisation is a 409 without detail (as `CreateOrganisation`, its D-5).
- **Save:** a stale `expectedRevision` whose configuration equals the stored one is a repeat and returns the current tournament; otherwise 409 with the current revision. A save equal to the stored configuration does not increment.
- **Publish:** already published returns the published tournament; a stale revision on a draft is a 409.

§5.1's "a repeat with the same operation identity returns its original outcome" is satisfied by content for these three. Operation identities and receipts arrive with result writes (AT-14), where content cannot identify a repeat.

### D-4 API

All in the Admin group, under the existing membership step (a non-member gets the generic 404 before any handler runs):

| Operation | Route | Notes |
|---|---|---|
| `listTournaments` | `GET /api/organisations/{organisationId}/tournaments` | Newest first; no paging (shortcut noted in code: an organisation's list is short in H1) |
| `createTournament` | `POST …/tournaments` | `tournamentId`, full configuration (only title required); 201 |
| `getTournament` | `GET …/tournaments/{tournamentId}` | Configuration, revision, lifecycle facts, `missingForPublication`, profile |
| `saveTournament` | `PUT …/tournaments/{tournamentId}` | `expectedRevision`, full configuration (replacement, not patch) |
| `publishTournament` | `POST …/tournaments/{tournamentId}/publication` | `expectedRevision` |

Field rules and incompleteness are 400 validation problems keyed by field with rule codes (`required`, `too-long`, `out-of-range`, `after-closure`, …); conflicts are 409 problems carrying `currentRevision`. A tournament of another organisation is invisible through the query filter, so it is the same 404 as a missing one.

Each feature is one file in `Features/<UseCase>/`, endpoint included, as in Organisations. No Wolverine message handlers: nothing is published.

### D-5 Persistence and the acting person

`TournamentsDbContext` becomes an `OrganisationScopedDbContext` and `Tournament` is `OrganisationOwned`. One table, `tournaments.tournaments`, with the configuration as nullable columns; migration `AddTournamentSetup`.

A module cannot reference Organisations, and the caller's directory identifiers are not Herald's person. `IOrganisationAccess.IsMemberAsync` becomes `FindMemberAsync`, returning the member's person identifier or null, and the host's membership step enters it into `OrganisationContext` as `ActorId` (also set by `CreateOrganisation`). Tournaments stores that `Guid` for created/changed/published by. This is technical composition already owned by `Herald.ModuleHosting`; the identifier is opaque to Tournaments.

### D-6 Admin application

A `tournaments` feature (`features/tournaments`, entry point `index.ts`) owning its routes, pages, form, queries and mutations:

- `organisations/:organisationId/tournaments` list
- `…/tournaments/new` and `…/tournaments/:tournamentId` the form (one component; new has no identifier until its first save, when the client-generated identifier is kept for retries and the address becomes the tournament's)
- `…/tournaments/:tournamentId/review` the review

App composition adds the routes and the **Tournaments** rail link; the feature imports no other feature. Query keys are under the organisation, so the existing invalidation on organisation or user change covers them; a successful write updates the detail and invalidates the list.

The form is signal-based like `create-organisation-page`, reuses the admin application's field presentation (moved to the application's shared styles if it is page-local today) and `confirmLeave`. The server is the authority for rules: the form shows the 400's field errors and the read model's `missingForPublication`; client-side it only mirrors the cross-field rules of R-2 for immediate feedback. Time zones come from `Intl.supportedValuesOf('timeZone')`; date-time text uses `Intl.DateTimeFormat('en-GB', …)`. Lifecycle labels use `herald-status-label`. `ui` gains nothing.

"Reload latest" after a conflict asks with the existing discard confirmation, then loads the stored tournament into the form.

### D-7 Tests

- Domain (`tests/Herald.Tournaments.Tests`, no mocks): every rule of the spec's validation and publication requirements, revision increments, team-to-individual clearing.
- API against PostgreSQL: the spec's scenarios for creation, save, publication, conflict and repeat, listing, isolation (another owner reads/writes: generic 404), and the public document having no tournament operation.
- `Herald.ModuleHosting.Tests`: the membership step enters the actor.
- Vitest: one test per reviewed state, input retention, focus on the summary, leave confirmation, `axe-core`.
- End-to-end: journeys 10 and 11.

## Assumptions

All accepted by the maintainer on 10 November 2026.

| # | Assumption | Why |
|---|---|---|
| A-1 | Title ≤ 120, game/variant ≤ 80, venue ≤ 120 characters | The documents give no limits; organisation name is 80 |
| A-2 | Capacity 2–256 | A single round-robin of 256 is already 32,640 matches; an upper bound stops typing mistakes |
| A-3 | Roster sizes and active players 1–50 | An upper bound only |
| A-4 | Changing a tournament from team to individual drops its team structure on save | F-02 forbids converting identities silently, but no entries exist yet |
| Q-1 | Inconsistent values are rejected on every save, not only at publication (see Visual input) | Deviation from the `validation-errors` capture |

## Risks / Trade-offs

- [Published without a public page looks unfinished] → The published page says registration is not open; the status documents say the public page is a later slice. No link to a public address is shown.
- [Local date-times postpone the instant question] → The conversion point is named in D-2 and the skipped-hour case is already rejected.
- [Content-based repeats: two tabs saving identical content both succeed] → That is the intended outcome; nothing is lost.
- [Renaming `IsMemberAsync` touches the access path of every scoped request] → Covered by the existing isolation tests plus the new actor test; the query is the same with a projection.
- [No paging on the list] → Marked as a shortcut in code; revisit when an organisation can have archived tournaments.
- [Rules duplicated client-side for immediate feedback] → Only the three cross-field rules; the server's answer always wins and is shown.

## Migration Plan

One additive migration creating `tournaments.tournaments`; no existing data. Rollback is dropping the table. Wolverine's generated code, the OpenAPI documents and the web client are regenerated and committed with the change.

## Open Questions

None. A-1 to A-4 and Q-1 were answered on 10 November 2026.

## Implementation record

### Decisions in the functional baseline (task 1.2, 10 November 2026)

`docs/herald-functional-discovery.md`: §5.1 status and the D-27 row say the first row is confirmed (Partial), the D-08 row carries the publication note, and F-02 has the confirmed rules of this slice (R-1 to R-5, A-1 to A-4, Q-1).

### Acting person in the organisation context (tasks 2.1–2.2, 10 November 2026)

`IOrganisationAccess.FindMemberAsync` returns the member's person identifier and the membership step enters it as `OrganisationContext.ActorId`; `CreateOrganisation` enters the creator. `Enter` keeps an actor already set when called again without one. Test: `A_scope_keeps_the_person_who_entered_it`. That the membership step passes the actor through a real request is asserted by the tournaments API tests (4.3), the first endpoint that stores it; until then the existing access tests (member reads, another owner gets 404) cover `FindMemberAsync`. ModuleHosting 8, Organisations 24, Host 29 and Architecture 42 tests pass; format check clean.

### Tournaments domain (tasks 3.1–3.2, 10 November 2026)

`Domain/TournamentConfiguration.cs` (a record: `Normalised`, `Check`, `MissingForPublication`) and `Domain/Tournament.cs` (`Draft`, `Repeats`, `Change`, `Publish`). `Change` and `Publish` return a `WriteResult` (`Applied`, `Repeated`, `Stale`, `Rejected` with the broken rules) instead of throwing, so an endpoint maps one value to 200, 409 or 400. Record equality of the normalised configuration is the "same content" test of D-3.

Refinements of the spec's rule list, same behaviour: team structure values are `not-applicable` unless the entry kind is team; a venue is `not-applicable` only when the location is online (the form shows the venue while no mode is chosen); an on-site tournament needs its venue for publication; the time zone must have an IANA identifier, so a Windows name is `unknown`. Rule codes: `required`, `too-long`, `out-of-range`, `not-applicable`, `below-active-players`, `below-minimum`, `not-after-opening`, `after-planned-start`, `unknown`, `skipped-hour`.

`tests/Herald.Tournaments.Tests`: 45 domain tests pass, without mocks.

### Tournaments persistence and features (tasks 4.1–4.4, 10 November 2026)

`TournamentsDbContext` is organisation-scoped; the configuration is an EF Core complex property, so the record is stored as nullable columns of `tournaments."Tournaments"`; migration `AddTournamentSetup`. The five features are one file each; the response shape `TournamentDetails` and the result mapping live in the `Features` root namespace because four features answer with it and a feature cannot use another.

Decisions taken while implementing:

- The request and response carry the domain's `TournamentConfiguration` record directly: it is already primitives and enumerations, and a parallel contract type would repeat sixteen properties four times.
- Enumerations travel as camel-case names for every Herald endpoint (`JsonStringEnumConverter` in `HeraldApi`); the OpenAPI documents describe them as string enumerations. No earlier endpoint had one.
- Writes call `SaveChangesAsync` themselves, so a lost race (concurrency token) or a taken identifier (primary key) answers 409 instead of failing in the transaction's own save. A rejected insert is detached, or that later save would retry it.
- A tournament that is missing or another organisation's answers a plain 404 problem; the organisation-level denial keeps its `organisation-not-available` type.
- `registration`, `competition` and `profile` are string constants in the read model (`notOpen`, `preparation`, `singleRoundRobin-3-1-0`).

`TournamentSetupTests` (20 tests against PostgreSQL through the host) cover the scenarios of task 4.3, including that the stored `CreatedBy` is a person of the Organisations module (the actor of D-5 through a real request). Host 49, Architecture 42, Organisations 24, ModuleHosting 8, Messaging 6 and Tournaments 45 tests pass; format check clean. Wolverine's code, the admin OpenAPI document and the admin client were regenerated; the public document did not change.

### Admin application (tasks 5.1–5.7, 11 November 2026)

`features/tournaments`: `tournaments.ts` (query keys under the organisation, the tournament query, date-time/capacity/lifecycle wording), `TournamentListPage`, `TournamentFormPage` (new, draft and published in one component) and `TournamentReviewPage`; the four routes and the **Tournaments** rail link are composed in `app.routes.ts` and `app.html`. The field presentation was already in the application's `styles.css`; it gained `select`, a read-only background and a 2px border on a field in error (V-4).

Decisions taken while implementing:

- The form holds text per control, so nothing typed is lost while it is not a valid value; hidden controls (team structure of an individual tournament, venue of an online one) keep their text and are sent as absent.
- The form does not mirror the cross-field rules of R-2 client-side, unlike D-6 proposed: the API's 400 names field and rule, and one wording table (`ruleText`) reports it. A second copy of the rules would have to be kept equal to Domain for a saving of one request.
- Review is offered only for a saved draft without unsaved changes and nothing missing, because it shows what is stored; otherwise the action is disabled and the reason is written under it.
- A new tournament keeps one client identifier per content, so a retry after a lost answer repeats the creation (D-3); after the first save the address is replaced with the tournament's.
- A stale or no-longer-complete publication (409 or 400) reloads the tournament and shows it for another review.
- A tournament that cannot be read shows "Tournament not available" with a retry, a state the captures do not have.

Vitest: 29 tests in three specs (list 4, form 18, review 7) cover every reviewed state, input retention, summary and missing-value focus, leave confirmation, copy-on-lost-access and `axe-core` (colour contrast excluded, as in the other specs). Admin 129 tests pass; lint, the boundary fixtures (15 of 15) and the admin production build pass.

### End-to-end journeys (tasks 6.1–6.2, 11 November 2026)

`e2e/journeys/tournaments.spec.ts` has journeys 10 and 11. Journey 10 creates a team tournament (title only, then the missing values, review, publication, the list) and runs axe on the empty list, the incomplete draft, the review and the published page. Journey 11 signs the same person into a second tab, saves a capacity there, and checks that the first tab's save reports the conflict with its input kept and that the second tab's reload still shows its own change and not the first tab's. The journey sets the reference time zone explicitly: the headless browser's zone is not a fixed fact of the suite.

The whole suite passes locally: 11 journeys, typecheck clean.

### Validation and completion (tasks 7.1–7.3, 11 November 2026)

**Full run (7.1), all passing:** `dotnet format --verify-no-changes`; Release build with no errors; Wolverine's code deleted, rewritten and unchanged; 174 .NET tests (Tournaments 45, Host 49, Architecture 42, Organisations 24, ModuleHosting 8, Messaging 6); `pnpm api:generate` with no drift; lint for the five web projects; 15 of 15 boundary fixtures; Vitest admin 129, public 12, catalogue 5, ui 19, api-client 9; the SSR isolation check; production builds of admin, public and catalogue; the end-to-end suite, 11 journeys.

**Comparison with the captures (7.2):** eight states (`list-empty`, `create-individual`, `draft-incomplete`, `validation-errors`, `edit-team-draft`, `preview-team`, `published-team`, `list-populated`) were captured from the running application at 1440 and 390 px, through the end-to-end composition with its test identity provider, and compared with the reviewed captures. The maintainer then ran the application locally on 11 November 2026 and asked for the pull request; no further differences were recorded from that run.

Corrected from that comparison: the list's heading row is as wide as the list, so "Create tournament" ends where the rows end; a draft's subtitle names the organisation, as the captures do; the review-unavailable explanation has space above it.

Differences kept, beyond V-1 to V-6 and Q-1:

- The shell is the one `h1-organisation-access` refined (rail, account menu), not the captures' earlier shell.
- The action reads "Review and publish" where the captures read "Preview publication": the page it opens is titled "Review before publishing" and is where publication happens.
- The review's subtitle names the tournament and its summary has no Organisation row: the rail already names the organisation on every page.
- The second publication statement reads "A published tournament cannot be unpublished" (the spec's wording) where the captures read "There is no unpublish action".
- The published notice and the saved/failed/conflict notices use `herald-notice` with its tones and icons, where the captures draw plain panels.
- The missing-for-publication list links to each field, and review is disabled with its reason written under the actions.
- `saving`, `save-failed`, `revision-conflict`, `publishing`, `publish-failed`, `list-loading` and `list-failed` were not captured from the running application: they need a held or failing request and are asserted in Vitest only.

**Documents (7.3):** `docs/herald-visual-direction.md` §9.3 (the UJ-02 setup row now points to the tournament setup captures and lists what supersedes them), `docs/roadmap.md` (current state, 11 November 2026), `README.md`, `CLAUDE.md` status and `openspec/config.yaml` say the slice is implemented and awaits archival.

**Acceptance review against the specs:**

| Requirement | Evidence |
|---|---|
| An owner creates a draft tournament; configuration values validated on every save | Domain tests; `TournamentSetupTests`; journey 10 |
| Publication requires a complete configuration | Domain tests; `TournamentSetupTests`; review spec; journey 10 |
| A published tournament stays editable and complete | Domain tests; `TournamentSetupTests`; form spec (published individual and team) |
| Writes state the revision they were based on | `TournamentSetupTests`; form spec (conflict, repeat of a creation); review spec (stale review); journey 11 |
| An owner lists and reads the organisation's tournaments | `TournamentSetupTests` (list, isolation, generic 404, public document) |
| The admin application lists tournaments | List spec (empty, populated, loading, failed with retry) |
| The configuration form keeps input and explains errors | Form spec (18 tests); journeys 10 and 11 |
| An owner reviews a tournament before publishing it | Review spec (7 tests); journey 10 |
| The critical journeys are covered (10 and 11) | `e2e/journeys/tournaments.spec.ts` |

One departure from D-6 stands for the maintainer's decision: the form does not mirror the cross-field rules client-side (see "Admin application" above).
