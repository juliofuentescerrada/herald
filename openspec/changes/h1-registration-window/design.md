## Context

`h1-tournament-setup` gave Herald tournaments an owner drafts, configures and publishes. The `Tournament` aggregate holds its configuration, publication, revision and who/when; registration and competition are constants in the read model (`notOpen`, `preparation`) because nothing could change them. Registration opening and closure are stored as local date-times and were not required for publication (R-3 of that change: "required when registration opens").

The maintainer decided on 11 November 2026:

- **Scope:** the registration window only: open, close, reopen. Entries, guests, admission and capacity are the next slice.
- **Manual action:** the owner opens and closes with an explicit action. The announced dates are required to open, but the clock neither changes the state nor blocks the action.

**Approved for implementation by the maintainer on 11 November 2026** (gate 1.1): rows 2 and 3 of §5.1 (D-27) as applied here, the rules RW-1 to RW-6, the assumptions A-1 to A-4 and the corrections W-1 to W-3 below, with the mockups supplied the same day (Visual input).

Confirmed rules:

- **RW-1** Only a published tournament's registration can be opened; competition is always in preparation in this slice, so §5.1's "during preparation" holds by construction.
- **RW-2** Opening and reopening require the registration opening and closure dates. Their order and their relation to the planned start are already guaranteed by every save.
- **RW-3** Closing is allowed from open only, with any number of entries (none exist). It changes nothing else: no freeze, no pairing, no start (§5.1, row 3).
- **RW-4** Reopening a closed registration is the same transition as opening, with the same preconditions. §5.1's "previously published pairings first withdrawn" has nothing to check: no pairing exists.
- **RW-5** While registration is open, every save must keep both registration dates (R-5 of the previous change, extended). Not required while closed or not open: reopening checks again.
- **RW-6** A transition already in effect is a repeat and returns the current tournament; otherwise a stale revision is a conflict.

## Goals / Non-Goals

**Goals:**

- The registration fact of §5 becomes real state with its three values and the two transitions of §5.1, owned by Tournaments (D-08: Tournaments owns lifecycle).
- The owner sees why registration cannot be opened before trying.
- No new infrastructure: no scheduler, no clock dependency, no second module.

**Non-Goals:**

- Entries, guests, admission, waiting list, capacity enforcement; the Registration module and any integration event.
- Opening or closing by the clock; warnings that compare the announced dates with the current time.
- Announcements (D-26), pairings, cancellation, archival, the public page, pilot API access.
- A history of window changes (see A-1).

## Visual input

Screens modified: the published tournament page (a new registration area; the registration label) and the tournament list (the registration label). The draft form and the review page do not change. No screen is created.

References: [registration window state review](../../../prototypes/frontend/registration-window-states.html) and its [11 states in 22 desktop/mobile captures](../../../docs/assets/mockups/registration-window/README.md), produced by the maintainer on 11 November 2026 from `.prompts/h1-registration-window-mockups.md`. The visual input is complete.

States covered (each desktop and mobile):

| Screen | States |
|---|---|
| Published tournament, registration area | `not-open-ready`, `not-open-missing-dates`, `unsaved-changes`, `opening`, `open`, `open-failed`, `closing`, `closed`, `conflict`, `open-date-removed` (a save rejected while open) |
| Tournament list | `list-registration-states` (not open, open and closed rows) |

What the captures settle, adopted here: one bordered registration area as wide as the form, above the published notice; the state in words, the announced opening and closure in two columns (stacked on narrow widths) and the reference time zone; the sentence that the dates are an announcement; missing dates as "Set registration opening" and "Set registration closure" links to their fields; the last change as a plain sentence under the announcement; no spinner or timer while a change is in progress; after a failure the action keeps its name; a conflict from a registration action is shown inside the area with "Reload latest", and the action stays unavailable until then. The team header does not change the area (`?state=open&kind=team`), so no team capture exists.

Corrections to apply when implementing (the captures are not regenerated for them):

| # | Capture | Correction |
|---|---|---|
| W-1 | `open`, `closed` | The last change reads "Opened 11 November 2026, 09:30 · Europe/Madrid" (or "Closed …"), without the person's name: Tournaments stores an opaque person identifier and cannot name it without Organisations. The person is recorded; showing it waits for a slice that gives modules a way to name people |
| W-2 | all tournament states | The shell, the form's help texts and the written date-times are the implemented ones (visual direction §9.3, UJ-02 setup row), not the captures' wording such as "Published configuration remains editable." under the first section |
| W-3 | `list-registration-states` | Rows keep their "Capacity · 16 teams" line, which the capture omits |

Adopted from the captures, replacing implemented wording: the published notice reads "Competition is preparing. Saving configuration does not change registration.", because the current "Registration is still not open…" becomes false once registration opens.

## Decisions

### D-1 The window is state of the Tournament aggregate

`Tournament` gains `Registration` (`RegistrationWindow`: `NotOpen`, `Open`, `Closed`), `RegistrationChangedBy`/`RegistrationChangedAt` (null until the first opening) and two methods, `OpenRegistration` and `CloseRegistration`, returning the existing `WriteResult`. `Change` gains RW-5 next to the published-stays-complete check. `TournamentConfiguration.MissingForRegistration()` returns the absent registration dates, like `MissingForPublication()`. Domain events `TournamentRegistrationOpened` and `TournamentRegistrationClosed`.

"Not open" and "closed" stay distinct, as §5 lists them: closed means it was open, which the next slice's entrants will care about. Reopening is `OpenRegistration` from `Closed`; the application words it "Reopen".

*Alternative considered:* a window aggregate in `Herald.Registration`. Rejected: D-08 gives lifecycle to Tournaments and admission to Registration; the window is lifecycle, and Registration would need tournament facts it cannot read yet. The next slice defines what Registration learns and how (an integration event through the outbox, ADR 0008).

*Alternative considered:* one `SetRegistration(state)` method. Rejected: the two transitions have different preconditions and names in §5.1; two small methods read as the table does.

### D-2 No clock

Nothing compares the announced dates with the current time: not the transitions, not the read model, not the application. The dates are stored as local date-times next to the zone (D-2 of the previous change) and shown beside the action as the announcement. This keeps the instant conversion postponed to the slice that acts at an instant.

*Alternative considered:* rejecting an opening after the announced closure. Rejected by the maintainer's choice of a plain manual action; the owner can correct the dates first, and a clock rule would need the zone conversion and a testable clock for one refusal.

### D-3 API

Admin group, under the existing membership step:

| Operation | Route | Notes |
|---|---|---|
| `openRegistration` | `POST /api/organisations/{organisationId}/tournaments/{tournamentId}/registration/opening` | `expectedRevision`; 200 with the tournament |
| `closeRegistration` | `POST …/registration/closure` | `expectedRevision`; 200 with the tournament |

Missing dates, a draft and closing a never-opened registration are 400 validation problems: the dates keyed by field with `required`; the state refusals keyed by `registration` with `not-published` and `not-open`. A stale revision is the existing 409 with `currentRevision`. Both answer with `TournamentDetails`, whose `registration` becomes the enumeration as a camel-case string (`notOpen`, the value clients already receive, `open`, `closed`) and which gains `missingForRegistration` and `registrationChangedAt` (the instant of the last opening or closing; the person is stored and not returned, W-1). `TournamentSummary.registration` becomes the same enumeration. Additive for the one client that exists.

One feature per use case, one file each, reusing `TournamentResults.SavedAsync`.

### D-4 Persistence

Migration `AddRegistrationWindow`: `Registration` (text, as `Publication` is stored; existing rows receive `NotOpen`), `RegistrationChangedBy` and `RegistrationChangedAt` (nullable) on `tournaments."Tournaments"`. The revision stays the concurrency token, so an opening and a save cannot both succeed from the same revision.

### D-5 Admin application

In the `tournaments` feature, inside `TournamentFormPage` when published: a registration area above the configuration form, its own operation area with its one primary action. It reads `stored()`: state, announced dates through `dateTimeText`, `missingForRegistration`, the last change written in the reference time zone (`Intl.DateTimeFormat` with the tournament's zone), and the form's `dirty()`. The action calls the mutation with the stored revision; its answer goes through the existing `accept`, which also invalidates the list. A failure or a conflict of a registration action is shown inside the area, as the captures do; "Reload latest" is the page's existing one. `lifecycleLabels` words the three registration values. No new route, component library control or package.

If the area makes `TournamentFormPage` hard to read, it becomes a presentational component in the same feature folder; that is decided while implementing, not here.

### D-6 Tests

- Domain: each precondition and effect of RW-1 to RW-6, revision increments, repeats, who/when.
- API against PostgreSQL: the scenarios of `registration-window` and the two modified `tournament-setup` requirements, including another owner's generic 404 and the public document still without tournament operations.
- Vitest: one test per state in Visual input, `axe-core`.
- End-to-end: journey 12.

## Assumptions

All accepted by the maintainer on 11 November 2026.

| # | Assumption | Why |
|---|---|---|
| A-1 | Only the last window change (person and time) is kept, not a history of openings and closings | No entrant exists whom a change could affect; ADR 0007's history starts with the first change that does, in the entries slice, which can add it with the announcement it needs |
| A-2 | No integration event is published for opening or closing | D-08 as noted on 10 November 2026: defined when Registration consumes it; an unconsumed contract would be guessed |
| A-3 | Entry kind and capacity stay editable while registration is open | No entry exists; the entries slice adds "capacity cannot fall below admitted entries" and the entry-kind rule of F-02 |
| A-4 | No confirmation step before opening or closing | Both are reversible with one action and affect nobody yet; publication, which is not reversible, has its review page |

## Risks / Trade-offs

- [The slice delivers state nobody consumes yet: "Registration open" with no way to enter] → Accepted with the scope decision; the status documents say entries do not exist, and the next slice is entries.
- [A manual action can leave registration open past its announced closure] → That is the chosen behaviour; the announced dates are shown beside the state so the mismatch is visible to the owner. A clock rule or automation can be added by a later change without undoing this one.
- [Who/when without history loses earlier openings] → A-1; revisit in the entries slice.
- [`registration` changes type in the OpenAPI document from string to enumeration] → Same wire values; the only client is regenerated in the same change.

## Migration Plan

One additive migration with a default, so existing tournaments read as not open. Rollback is dropping the three columns. Wolverine's generated code, the admin OpenAPI document and the client are regenerated and committed with the change.

## Open Questions

None. Gate 1.1 was passed on 11 November 2026.

## Implementation record

### Domain and migration (tasks 2.1, 2.2 and 3.1, 11 November 2026)

`Tournament` has `Registration` (`RegistrationWindow`), `RegistrationChangedBy`/`At`, `OpenRegistration` and `CloseRegistration`; `Change` requires the registration dates while registration is open; `TournamentConfiguration.MissingForRegistration()` names the absent dates. Refusals that are not missing values are keyed by `registration`: `not-published` for a draft, `not-open` for closing a registration that was never opened. As in `Publish`, a transition already in effect is a repeat before the revision is looked at.

The migration `AddRegistrationWindow` was done with the domain rather than in block 3: once the aggregate has new state, the host refuses to start with pending model changes, so the domain alone would have left the host's tests failing. The state is stored as text, like `Publication` (D-4 said an integer); the migration gives existing rows `NotOpen`.

`tests/Herald.Tournaments.Tests`: 60 tests (15 new in `TournamentRegistrationTests`). All 189 .NET tests pass; format check clean.
