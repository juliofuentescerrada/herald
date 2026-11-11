## Context

`h1-entries` lets the owner enter guest teams in a team tournament, but a team is a name only (its A-5). Registration owns the `Field` aggregate of each tournament (its projected entry terms and its entries) and the organisation's `Guest`s (players and teams). Tournaments stores the roster bounds (minimum and maximum roster size, active players per side) and validates them, but does not publish them: `TournamentEntryTermsChanged` (v1) carries registration state, capacity, entry kind and admission only. Competition start, pairings and matches do not exist.

The maintainer decided on 11 November 2026, after the exploration of the same day, to take every recommendation below as the rules of this slice:

- **R-1 Scope:** the tournament roster only. Match lineups and their lock (TM-06/07) need matches and go with the slice that starts matches.
- **R-2 Operator:** the organisation's owner manages rosters (H1 operator); no captain or representative (TM-04 is H2).
- **R-3 Freeze at start:** a roster is frozen when the competition starts (TM-05 "no later than tournament start"); no separate roster deadline is configured. Until start exists, rosters stay editable; the start slice fixes the current roster revision.
- **R-4 Members are guest players:** the organisation's existing guest players, created with the existing possible-duplicate warning (EN-11, D-22).
- **R-5 Exclusivity:** by guest identity within the tournament, counting active (waiting or admitted) entries only. Same normalised name on different guests is flagged, not blocked (TM-03 "ambiguous identity is flagged for review").
- **R-6 Waiting entries:** any active team entry has a roster, so a promoted team arrives ready.
- **R-7 Incomplete allowed:** a roster below the minimum is shown as incomplete; it will block start, not admission (F-04 "admission eligibility … does not require a complete roster").
- **R-8 History:** each roster has a revision; every addition and removal is recorded with who and when (ADR 0007).
- **R-9 Bounds change:** the bounds stay editable after rosters exist; rosters outside them are reported and never trimmed (as EN-12). The bounds reach Registration as optional members of the v1 terms contract.
- **R-10 Removal:** removing a member before the freeze needs no reason and no confirmation beyond the action itself; it is recorded.

## Goals / Non-Goals

**Goals:**

- The owner records the identifiable players of each team entry, within the tournament's bounds and exclusive within the tournament, from the admin application and through the Admin API.
- Readiness of each team's roster is visible, ready for the start slice to use.
- A backwards-compatible extension of an integration contract, the first one.

**Non-Goals:**

- Competition start and the freeze itself; lineups, lineup lock and active players per side checks (TM-06/07, D-18).
- Check-in (F-05); captains and representatives (TM-04, H2); self-service.
- Departures, sanctions and pre-start lineup revisions after the freeze (D-23).
- A configurable roster deadline and its postponement rules (AT-11).
- Rosters on public pages (D-09 keeps them private); an organisation players page; editing guest names.
- A fact event for roster changes (ADR 0017: published once a consumer exists).

## Visual input

Screens: the tournament entries page (modified: team rows) and the roster drawer (new).

**Supplied 11 November 2026:** `docs/assets/mockups/team-rosters/` (README with its visual decisions, `manifest.json`, 38 captures at 1440 and 390 px) from `prototypes/frontend/team-rosters-states.html`, generated with `.prompts/h1-team-rosters-mockups.md` under the current layout rules (visual direction §4, §5, §7.2). Review material: they approve no product default. Visual decisions the documents did not settle, taken from the mockups' README:

- Adding is a step inside the roster drawer (no second modal), with "Back to roster"; team name, bounds and readiness stay visible.
- Readiness uses warning-tone text for incomplete and above maximum, neutral text within bounds, with no extra "complete" word.
- A full or above-maximum roster shows "Add player" disabled followed by its reason in words.
- A removal in progress reads "Removing…" on that member; every write and leave control is disabled meanwhile.
- The possible-duplicate notice sits inside the affected member row.
- History lists additions and removals oldest first, with actor and written date-time; collapsed in every other state.
- Awaiting terms shows the members without bounds; conflict keeps the last list and disables writes until "Reload latest"; loading and failed show no members or count.

| Screen | States |
|---|---|
| Entries page, team tournament | `team-readiness`: rows with incomplete, complete and above-maximum rosters, waiting and cancelled teams included |
| Roster drawer | `roster-empty`, `roster-incomplete`, `roster-complete`, `roster-full` (adding unavailable with its reason), `roster-above-maximum`, `add-existing` (search with one player unavailable "On Team A"), `add-new`, `add-duplicate` (existing warning), `adding`, `add-failed`, `remove` (a removal in progress), `possible-duplicate-member` (flag between teams), `history-expanded`, `cancelled-read-only`, `awaiting-terms`, `conflict`, `loading`, `failed` |

## Decisions

### D-1 Rosters live in the `Field` aggregate

`Entry` gains its roster: the members (`GuestId`, added by/at), a roster revision and its history (`RosterChange`: guest, added or removed, by, at, resulting revision). Exclusivity (R-5) spans every active entry of the tournament, so it is decided in `Field` under its one concurrency token, as admission is (EN-9): two owners' tabs cannot put one player in two teams. The roster is part of the entry, not a separate aggregate.

Domain events: `RosterMemberAdded`, `RosterMemberRemoved` (tournament, entry, guest, roster revision, actor, time).

*Alternative considered:* a `Roster` aggregate per entry with a uniqueness index on (tournament, guest) for exclusivity. Rejected: the index cannot express "active entries only" without copying entry state into the roster table, and the field is small (≤ 256 admitted plus waiting, ≤ 50 members each).

*Alternative considered:* team membership on the guest team, copied at freeze. Rejected: TM-02 separates general membership from the tournament roster, and H1 has no persistent team directory.

### D-2 The roster revision is separate from the entry revision

Admission and cancellation state the entry revision; roster writes state the roster revision. A roster change does not conflict with an admission made in another tab, and the reverse. Cancelling an entry fixes its roster (no further writes) but does not change its roster revision.

### D-3 Contract extension, still version 1

`TournamentEntryTermsChanged` gains `int? MinimumRosterSize = null, int? MaximumRosterSize = null` at the end of the record. A message serialised before the change deserialises with nulls; the field then reports its rosters as awaiting terms and rejects roster writes (spec "Registration knows the tournament's roster bounds") until Tournaments publishes again. Adding optional members is backwards compatible for both sides (ADR 0008, ADR 0016), so no version 2 is created. Active players per side is not sent: lineups use it, in a later slice.

### D-4 Readiness is derived, not stored

`incomplete`, `complete`, `aboveMaximum` and `awaitingTerms` are computed from the member count and the known bounds at read time. Storing them would need updating every roster when the bounds change.

### D-5 API (Admin group)

| Operation | Method and path (under `/api/organisations/{organisationId}/tournaments/{tournamentId}/entries/{entryId}`) |
|---|---|
| `addRosterMember` | `PUT /roster/members/{guestId}` (expected roster revision) |
| `removeRosterMember` | `DELETE /roster/members/{guestId}` (expected roster revision) |
| `getRoster` | `GET /roster` (members with added time, revision, bounds, readiness, possible-duplicate flags, history) |

`getField` gains per team entry `rosterSize`, `rosterRevision` and `rosterReadiness`, so the page needs one request; the drawer reads `getRoster`. `findGuests` gains, when called with a tournament, the active team each player is on, so the drawer can show "On Team A" before the owner tries. Errors: 400 rule codes `roster-full`, `not-a-player`, `not-team-tournament`, `entry-cancelled`, `awaiting-terms`, `on-another-team` (with the other entry's identifier and name); 404 generic; 409 conflict with the current roster.

### D-6 Admin application

The `entries` feature gains the readiness text on team rows and the `Roster` action, which opens a `ui` `Drawer` with the roster. Adding reuses the existing guest search and creation of the add-entry drawer (same feature, shared within it). Writes invalidate the roster and the field. A completed addition or removal shows in the drawer's list and the row's readiness, with no toast: the drawer stays open for the next member, and a toast per member would stack up while building a roster (visual direction §5 allows a toast for the person's own outcome but caps the stack at three).

### D-7 Durable history

Every addition and removal is a `RosterChange` row, written with the effective change (ADR 0007). The start slice will record which roster revision it froze; the history then answers which players were eligible.

### D-8 Notifiable facts

None is introduced for participants in H1: F-10 lists roster *rejection* as a notice, which is immediate feedback to the acting operator here. Roster changes are persisted (D-7), so a later representative-facing notice (H2) needs no migration; ADR 0017's inventory gains a row "Roster member added or removed — Registration — `h1-team-rosters`: `RosterChange` — Not yet".

### D-9 Tests

- Domain (no mocks): every rule of `team-rosters`, exclusivity across entries, cancellation releasing members, bounds lowered, repeats and conflicts.
- Use cases and API against PostgreSQL: the spec scenarios, organisation isolation, the terms message with and without bounds.
- Vitest with `axe-core` for each Visual input state; end-to-end journey 15.

## Assumptions

| # | Assumption | Why |
|---|---|---|
| A-1 | Rosters can be edited while registration is not open or closed, until start | Closing registration does not freeze the field (CP-03); only start freezes rosters (R-3) |
| A-2 | No captain is marked among members in this slice | TM-04 authority is H2; H1's operator acts for every team |
| A-3 | The members' order is the order they were added; no shirt numbers, roles or seats | Nothing in H1 uses them; seats belong to composite encounters (H6) |
| A-4 | The roster history is shown in the drawer after the members, collapsed | Read-only history after the actionable groups (visual direction §7.2) |
| A-5 | A guest player who has an individual entry in another tournament can be on a roster here | TM-03 limits exclusivity to one tournament |

## Risks / Trade-offs

- [Tournaments published before this change carry no bounds] → Their rosters report "awaiting the tournament's terms" until the next save, closing or reopening republishes the terms; no deployment exists yet (M4), so no backfill is written.
- [The field aggregate grows with members] → At most 256 × 50 members per tournament; loaded with the field. Measured in the implementation record if it shows in the tests.
- [First change to a published contract] → An old-message test proves a v1 message without bounds still deserialises and is handled.

## Migration Plan

Registration: migration `AddRosters` (roster members and roster changes, roster revision on entries). No Tournaments migration. Rollback: drop the new tables and the column. Wolverine's code, the admin OpenAPI document and the client are regenerated.

## Open Questions

- None. The maintainer approved the implementation on 11 November 2026 (gate 1.1).

## Implementation record

**Full run (7.1).** `dotnet format --verify-no-changes` clean; build with no warnings; 300 .NET tests pass; `codegen write` and `pnpm api:generate` leave no difference; web lint, the boundary fixtures (15 planted, 15 reported), `test:all` (admin 187, public 13, catalogue 7, ui 31, api-client 9), the SSR isolation check and `build:all` pass; the e2e suite passes (15 journeys). The roster drawer's rules moved from `entries-page.css` to `roster-drawer.css` (the drawer loads both) to keep the page's stylesheet under its 4 kB budget. The admin initial bundle's budget warning (900 kB) predates this change: 944.6 kB at `aa39260`, 946.0 kB now, the difference being the generated client. A first e2e run, just after Docker Desktop started, timed out in five journeys across files, this change's untouched ones included; the immediate rerun passed all fifteen. The entries journeys take about 23 s of their 30 s timeout under four workers.

**Visual comparison (7.2).** A temporary Playwright spec (not committed) built a team tournament through the composed system (five teams, six players, one cancelled team, one waiting), forced the rarer states with `page.route` (larger rosters, a flagged member, missing bounds, a slow or failed request, a 409) and captured all 19 states at 1440 × 1000 and 390 × 844, full page; each was compared side by side with its mockup. Corrected after the comparison: while a member is being removed, "Add player" stays disabled without a second reason, since the removal's status already says why (the drawer showed two near-identical "please wait" lines); with no bounds known, the bounds line reads "Roster sizes not available" instead of repeating the readiness line's "waiting for the tournament's roster sizes". Kept: a search result's action sits under its name, as in the entries add drawer (`h1-entries`); the bounds line carries no time zone, and member times are written without one; the empty roster says "No players yet." without a further sentence; loading is one status line; the mode buttons keep their natural width on desktop and stack on mobile; the above-maximum reason says how many members to remove; the drawer's first focus has no visible ring on its heading.

The maintainer ran the slice through Aspire on 11 November 2026, on desktop and on a phone through a tunnel to the admin development server, following a 17-step checklist (roster built to its minimum, exclusivity, duplicate warning and flag, full and lowered maximum, removal, conflict across tabs, cancelled team read only and its players released, mobile layout): no defects reported.

**Acceptance review (7.3)** against the change's specifications:

| Specification | Requirement | Evidence |
|---|---|---|
| `team-rosters` | An owner builds the roster of a team entry (waiting teams, guest teams refused, cancelled fixed, after closure, none for individuals) | `RosterTests`; `TeamRosterTests` (`A_full_roster_and_a_guest_team_are_rejected`, `A_cancelled_team_releases_its_players_and_its_roster_is_fixed`, `An_individual_tournament_has_no_rosters`); page spec; journey 15 |
| `team-rosters` | A roster respects the tournament's bounds (full, incomplete allowed, maximum lowered) | `RosterTests`; `TeamRosterTests` (`An_owner_builds_a_roster_to_its_minimum_and_the_field_reports_it_complete`, `A_lowered_maximum_reaches_the_field_and_keeps_every_member`); page specs for full and above maximum |
| `team-rosters` | A player belongs to one team per tournament (another team, released by cancellation, same name flagged) | `RosterTests`; `TeamRosterTests` (`A_player_on_another_teams_roster_is_refused_with_that_team`, `Two_simultaneous_additions_of_one_player_to_two_teams_leave_them_on_one`, `Different_guests_with_the_same_name_on_two_teams_are_flagged`); page specs; journey 15 |
| `team-rosters` | A roster keeps its history (revision conflict, removal recorded, another organisation) | `TeamRosterTests` (`A_removal_is_kept_in_the_history_and_an_older_revision_conflicts`, `Another_organisations_owner_gets_the_generic_not_found`); page specs for history and conflict |
| `team-rosters` | Registration knows the tournament's roster bounds (bounds reach the field, older message without them) | `TournamentEntryTermsChangedTests`; `TeamRosterTests` (`Rosters_wait_for_terms_with_roster_sizes`, lowered maximum from a Tournaments save); page spec for awaiting terms |
| `team-rosters` | The admin application shows and manages rosters | `entries-page.spec.ts` (20 roster tests, axe in four states); visual comparison (7.2); maintainer run; journey 15 |
| `end-to-end-journeys` | Journey 15 | `e2e/journeys/entries.spec.ts` |

Status documents updated: `docs/herald-visual-direction.md` §9.3 (team rosters row; rosters removed from the guest entries row's pending list), `docs/roadmap.md`, `README.md`, `CLAUDE.md` and `openspec/config.yaml`.
