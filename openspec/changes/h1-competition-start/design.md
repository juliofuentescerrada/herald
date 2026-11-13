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

Visual choices for review: the Competition panel follows the Registration panel and uses the same composition; readiness is a checklist of conditions, each with a status label and a link to where it is fixed; "Start competition" is the panel's primary action, disabled with the first blocker as its description; start asks for confirmation because it cannot be undone.

## Assumptions for review

- **A-1** Start asks for a confirmation stating what it fixes (field, schedule, rosters) and that it cannot be undone in H1.
- **A-2** The crossed withdrawal in D-4 allows one republication after start; otherwise a schedule cannot be published after start.
- **A-3** The planned start date neither starts nor blocks the competition, as the registration dates do not open or close registration.

## Risks / Trade-offs

- [Projections lag] → Start re-checks readiness from the projections, and crossed changes are reported (D-4). A start decided on a stale projection is visible, not hidden.
- [Unknown counts from older messages] → they block start until Registration reports again; any field write republishes them.
