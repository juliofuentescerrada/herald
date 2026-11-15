## Context

See proposal.md (Why). After the batch's earlier changes, Competition keeps `Match` aggregates with lineups and one resolution of any §8.1 cause, the frozen rosters and the started schedule; it publishes `TournamentResultsChanged` to Standings.

## Goals / Non-Goals

**Goals:**

- The owner sees where the competition stands and resolves departures without hand-editing matches.

**Non-Goals:**

- Undoing departures; team sanctions short of disqualification; change log and corrections (batch 3).

## Decisions

### D-1 Round state is derived

A round's state is computed from its matches on read: none started or resolved → not started; all resolved → completed; otherwise running. Nothing is stored, so no write can leave it stale.

### D-2 Departure is one write across matches

`WithdrawEntrant` and `DisqualifyEntrant` (reason ≤ 500 characters, required) set the entrant's status and, in the same transaction, resolve its unresolved matches:

| Match state | Opponent | Resolution |
|---|---|---|
| Scheduled | active | single absence of the departing entrant |
| Scheduled | departed | double absence |
| In play | any | concession after play by the departing entrant (Q3) |

When the second entrant of a pair departs and their match was resolved as a single absence by the first departure, that resolution is revised once to a double absence, keeping the predecessor with who, when and why. A played resolution is never revised. All matches touched get the departure's operation identity, so a repeat changes nothing. The tournament's results revision increases once.

### D-3 Player availability on the frozen roster

Competition's frozen-roster projection gains per player: withdrawn (who, when, reason optional), sanction (reason required, who, when, lifted by and when). `RecordLineup` rejects an unavailable player; `StartMatch` re-checks the current lineups and rejects naming each unavailable player. Locked lineups and appearances are untouched.

### D-4 Ownership after start

Registration fixed the field at start; Competition owns what happens in play, so it records the departures. Registration's entries stay admitted, and the entries page keeps its batch 1 notice pointing to the Schedule page. Standings learns the status from the results snapshot (optional `Status` per entrant: active, withdrawn, disqualified).

### D-5 Screens

Schedule page of a running competition, top to bottom: the operations summary (counts as status labels, each round with its state badge, "Needs attention" list), the rounds, then the Entrants panel (each entrant with a status badge and, for active ones, "Withdraw" and "Disqualify" as secondary actions; teams also "Frozen roster"), then the publication history. Departures ask for confirmation with a required reason field and state what will be resolved ("3 unplayed matches will be resolved as absences"). The frozen roster dialog lists players with "Available", "Withdrawn" or "Sanctioned" badges and the actions; lifting asks no reason. Standings rows add a "Withdrawn" or "Disqualified" label after the name.

## Visual input

Prototypes: `prototypes/frontend/play-and-score-states.html`.

| Screen | States (`?state=`) |
|---|---|
| Schedule page | `operations-running`, `operations-attention`, `round-completed`, `withdraw-confirm`, `withdrawn`, `disqualify-confirm`, `disqualified`, `all-departed` |
| Frozen roster dialog | `roster-running`, `sanction-confirm`, `player-sanctioned`, `player-withdrawn` |
| Match page | `start-blocked-unavailable`, `too-few-eligible` |
| Standings page | `standings-flags` |

Visual choices (G-/RU-): departures are destructive and final, so their confirmation uses the danger tone and names the consequence; the operations summary leads the page because it answers "what next?"; "Needs attention" links to each match; status in words with icon, never colour alone.

## Assumptions for review

- **A-1** Departures cannot be undone in H1 (§10.2.1 leaves reinstatement out); a mistaken one waits for batch 3's corrections.
- **A-2** A player's withdrawal takes an optional reason; a sanction requires one (§10.2.1: "record scope, reason and effective time"); the sanction's scope in H1 is the whole tournament until lifted.

## Risks / Trade-offs

- [One departure touches many matches] → one transaction, one operation identity, one results revision; tests cover either withdrawal order.

## Implementation record

### Full run (task 6.2), 15 November 2026

`scripts/check all` passed: rules, spec coverage, rules tests, .NET restore, format, build, Wolverine codegen drift, all .NET tests (560, PostgreSQL through Testcontainers), web install, OpenAPI client drift, lint, boundaries, Vitest (281 admin tests), SSR isolation and build. The e2e suite passed with journey 23 (23 journeys), and `pnpm test:scripts` passed all 12 scripts, `seeded-round-operations` included.

Implementation notes:

- Departures and player availability live on the `Schedule` aggregate as two documents (`Departures`, `Players`), kept apart from the frozen rosters that Registration's reports replace; migration `AddDepartures`. Every player write and departure goes through the schedule's revision.
- Only a single absence that the opponent's departure set (same operation identity) is revised to a double absence; a single absence the owner recorded stays.
- A blocked start keeps the side's rule once (`first-lineup-unavailable`) and the rejection adds one `player-{id}`/`unavailable` rule per unavailable starter, naming them (D-3); the match view lists the unavailable players, and the page names the side's unavailable starters from them.
- `Departure`, `PlayerWithdrawal` and `PlayerSanction` (and a sanction's lift) store the schedule revision they produced, the subject revision ADR 0017's fact events will carry.
- A roster below the lineup size once withdrawn and sanctioned players are left out adds the start blocker `first-roster-too-few-eligible` (or `second-`).
- ADR 0017's inventory gains `Departure`, `PlayerWithdrawal` and `PlayerSanction` as notifiable facts recorded but not published, as the architecture test requires; the proposal's "none in H1" means none published.

### Visual comparison (task 6.3)

Captures: `seeded-round-operations` at 1440 px (steps 1 to 7) and 390 px (steps 8 and 9), against the prototype states at 1440 and 390 px.

| State | Difference from the prototype | Resolution |
|---|---|---|
| `operations-running`, `round-completed` | Rounds sit on one wrapping line with their badge instead of one row each; status labels carry no icon except departures, sanctions and "Blocked" | Kept: shorter at both widths. Icons follow `docs/ui/icons.md`, which has no reviewed mapping for round or match states (clock means registration not open) |
| `operations-attention` | Same content; "Blocked" uses `alert-triangle` (attention required) | Kept |
| All Schedule states | The operations summary comes first, then the existing summary heading and the "Running" notice, then the rounds, the Entrants panel and the history | Kept: the summary still leads the page (D-5); the existing heading and notice are batch 1's |
| `withdrawn`, `disqualified` | The entrant row shows the private reason ("Reason: Moved away") instead of "reason kept privately" | Kept: the admin page is the organisation's own, as the publication history shows its withdrawal reason |
| `withdraw-confirm`, `disqualify-confirm` | Same text and danger action; cancel reads "Keep as it is" | None |
| `roster-running`, `sanction-confirm`, `player-sanctioned`, `player-withdrawn` | The sanction and withdrawal forms open inside the roster dialog above the list; "Withdraw player" also asks first, with an optional reason, because it is final | Kept: A-2 gives the withdrawal an optional reason |
| `start-blocked-unavailable`, `too-few-eligible` | Unavailable players carry an "Unavailable" label in the lineup choice and cannot be added | None |
| `standings-flags` | Same | None |
| 390 px | The Entrants panel's actions first rendered as a staggered column | Fixed: they stack full width like the app's other narrow actions. The schedule's existing running rows (batch 1) show the same stagger; left to their owner |

### herald-reviewer review (task 6.4)

| Finding | Resolution |
|---|---|
| Departures and player changes stored no revision (ADR 0007, ADR 0017) | Fixed: each stores the schedule revision after the change; ADR 0017's rows name it |
| A blocked start did not name the player and repeated the side's rule | Fixed: the side's rule once, plus a rule per unavailable starter |
| Match queries not refreshed after a departure or player change | Fixed: the Entrants panel invalidates the tournament's match queries |
| "Withdrawal in play" tested on a match outside the schedule | Fixed: a team match in play withdrawn through `Schedule.Depart` |
| "A disqualification" tested with individual entrants only | Fixed: a team disqualification test carries the marker |
| A sanctioned player could not be withdrawn from the roster dialog | Fixed: "Withdraw player" is offered to available and sanctioned players |
| Player actions remain allowed on a departed team | Open: not settled by the change or §15; asked of the maintainer in the pull request |
