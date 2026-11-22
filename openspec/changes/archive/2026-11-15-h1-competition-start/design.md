## Context

See proposal.md (Why). After `h1-round-robin-pairings`, Registration publishes the eligible field to Competition and its counts to Tournaments; Competition publishes the schedule's state to Tournaments; Tournaments sends Registration its entry terms, including `FieldLocked`. Tournaments owns the lifecycle (D-08), so it decides start, from its own projections.

## Goals / Non-Goals

**Goals:**

- The owner reads why a tournament can or cannot start and starts it.
- Start fixes the field, the schedule and the team rosters in every module, and a crossed change is visible.

**Non-Goals:**

- Match start and lineups (batch 2); withdrawal and sanctions after start (batch 2); cancellation (batch 3).

## Decisions

### D-1 Start lives on `Tournament`

`Tournament` gains a competition state (`Preparing`, `Running`), `StartedBy`, `StartedAt`, and the eligible revision and schedule revision it started on. `Start(expectedRevision, readiness, actor, at)` rejects with the list of unmet conditions; repeating returns the same tournament. Domain event `CompetitionStarted`.

### D-2 Readiness is computed by Tournaments from its projections

Conditions, each reported with its state: registration closed; pending = 0 (mandatory check-in); eligible ≥ 2; a schedule revision published whose eligible revision equals the projected eligible revision; for teams, rosters outside bounds = 0. `TournamentFieldChanged` gains optional `EligibleRevision`, `Eligible`, `Pending` and `RostersOutsideBounds` (absent reads as unknown, which blocks start until Registration reports again). The tournament's details expose the readiness list; the owner sees it before pressing Start, and Start re-checks it.

### D-3 Registration and Competition follow start

Tournaments republishes the entry terms with `CompetitionStarted` and publishes `TournamentCompetitionStarted` v1 (organisation, tournament, revision, eligible revision, schedule revision, who, when), consumed by Competition only. Registration records each admitted team's roster revision as frozen and rejects roster edits, admission, cancellation and check-in changes after start. Competition rejects withdrawing and regenerating.

### D-4 Crossed changes after start

The projections can lag a write that Registration or Competition accepted just before learning of the start:

- a roster edit: the frozen revision is the one current when Registration processes the start; if it differs from the one readiness saw, or leaves a roster outside its bounds, the roster and the Competition panel report it;
- a field change: already blocked by the published schedule's lock;
- a withdrawal in Competition: Competition reports "the competition started on revision N, which was withdrawn" and allows publishing the current draft once (A-2).

Nothing is repaired automatically (D-08).

### D-5 Read-only surfaces

Once running, the entries page, roster dialog and Schedule page keep their content and disable writes with "The competition has started." The tournament list and page show "Running" in place of "Preparing".

## Visual input

Prototypes: `prototypes/frontend/start-and-pair-states.html`, shared with `h1-round-robin-pairings`. Review material; it approves no product default.

| Screen | States (`?state=`) |
|---|---|
| Configuration page, Competition panel | `start-blocked` (registration open, two pending, no schedule), `start-blocked-rosters` (team: one roster below minimum, a same-name warning), `start-ready`, `start-confirm`, `starting`, `started`, `start-conflict`, `start-crossed` (roster changed during start) |
| Entries page and roster dialog | `entries-running` (read-only with reason, frozen roster) |
| Schedule page | `schedule-running` (no withdraw) |

Visual choices: the Competition panel follows the Registration panel and uses the same composition; "Start competition" is the panel's primary action; start asks for confirmation because it cannot be undone.

Maintainer feedback of 14 November 2026 (#55), applied to the prototypes:

- Under the panel's heading, a status badge gives the panel's state: the first unmet condition ("Registration is still open"), "Ready to start", "Starting" or "Running"; a disabled "Start competition" is described by it.
- The readiness checklist puts the condition and its explanation on the left and its state on the right, as a badge with tone and icon ("Met" success, "Not met" danger), rows separated by a rule.

## Assumptions for review

Accepted by the maintainer on 14 November 2026 (#55).

- **A-1** Start asks for a confirmation stating what it fixes (field, schedule, rosters) and that it cannot be undone in H1.
- **A-2** The crossed withdrawal in D-4 allows one republication after start; otherwise a schedule cannot be published after start.
- **A-3** The planned start date neither starts nor blocks the competition, as the registration dates do not open or close registration.

## Risks / Trade-offs

- [Projections lag] → Start re-checks readiness from the projections, and crossed changes are reported (D-4). A start decided on a stale projection is visible, not hidden.
- [Unknown counts from older messages] → they block start until Registration reports again; any field write republishes them.

## Implementation notes

Deviations from the plan above, each kept small:

- **Readiness names, not counts (D-2).** `TournamentFieldChanged` carries `RostersOutsideBounds` as the list of admitted teams outside their bounds (entry, team name, members) and adds `SharedMemberNames` (name, team names), so the panel can name the team and the bound and show the same-name warning, as the scenarios require. Both are optional and read as unknown in older messages.
- **No starter's name.** Tournaments stores who started but cannot name them (W-1, as for registration): the panel says "Started 21 November 2026, 10:05 · Europe/Madrid", without "by Alex Morgan".
- **Crossed roster report (D-4).** After start, Registration's counts report frozen rosters outside their bounds; the Competition panel and the roster dialog report them. A frozen revision that differs from the one readiness saw but stays within bounds is not reported: readiness does not record per-team revisions.
- **Crossed withdrawal (A-2).** Competition records the revision the start was decided on; when that revision was already withdrawn, the schedule says so and publishing the draft remains possible. Generating and withdrawing are rejected after start, so the republication happens at most once.
- **A rejected start (400) reads as a conflict** on the panel: a condition the owner saw as met no longer holds, so the readiness on screen is out of date and is reloaded.
- **Once running, Registration offers no action** (no "Reopen registration"), as in the prototype's `started` state.
- **Stale writes return the current tournament.** Every tournament 409 now carries `tournament` beside `currentRevision` (additive).

## Verification

14 November 2026, on the slice branch:

- `scripts/check all`: every step passed (rules, spec coverage, format, build, codegen, .NET tests, OpenAPI client, lint, boundaries, Vitest, SSR isolation, build).
- End-to-end suite: 18 journeys passed, journey 18 included; test scripts: 5 passed, `seeded-start` included.
- `node scripts/spec-coverage.mjs`: every scenario this change adds has a marker.

## Visual comparison

Captured by the `seeded-start` test script at the default desktop width and at 390 px, against `start-and-pair-states.html` (`start-blocked-rosters`, `start-ready`, `start-confirm`, `started`, `entries-running`):

- Panel composition, badge under the heading, checklist with the state badge on the right and rules between rows: as the prototype.
- The badge's blocker sentence wrapped past the panel at 390 px; it now wraps inside it (`white-space: normal` for this badge only).
- The tournament has no Configuration/Entries/Schedule tabs (as in `h1-round-robin-pairings`): the panel's "Open entries" and "Open schedule" links and the page's "View entries"/"View schedule" serve instead.
- Not verified: 200 % zoom and a keyboard-only pass.

## Review notes

herald-reviewer reviewed the slice's diff on 14 November 2026. Findings and how each was resolved:

1. **A running tournament's configuration could change what decides its entries** (blocking): `Change` now rejects capacity, entry kind, admission, check-in and roster sizes with `competition-started` once running; the title and other facts stay editable. Domain tests.
2. **Registration could reopen on a running tournament** (blocking): `OpenRegistration` rejects with `registration/competition-started` before the schedule check, and `Field.Enter` honours the field lock. Domain test.
3. **The spec said the panel shows who started**: the scenario now says when and the schedule revision, matching W-1; the requirement lists the configuration and reopening rejections.
4. **No backend test for a crossed roster edit**: a Registration domain test removes a member, then applies the start, and checks the frozen revision and `RostersOutsideBounds`; it carries the scenario's marker.
5. **Roster rejections after start named the wrong reason**: the frozen check comes right after the repeat and stale checks; admitting and confirming a check-in after start are tested.
6. **A waiting team's roster dialog offered edits after start**: the dialog is read-only for every team once the field reports the start. Vitest.
7. **"Fixed at start: N entrants" used today's count**: the panel says "the eligible field" instead.
8. **The API readiness test did not exercise pending entries**: its marker was removed; the domain and Vitest tests carry the scenario.

## Test round

The maintainer's local test round of 15 November 2026 (#61) validated the test script. At their request, a running competition's entry actions (check-in, cancel, admit, add) are hidden instead of disabled: the state is final, and the "Running · entries are read-only" notice says why once. The rule is in `docs/ui/style-guide.md` (disable with a reason while the person can lift the lock; hide when the state is final). The roster drawer's stacked actions and the tournament header's density are left to a separate UI change.
