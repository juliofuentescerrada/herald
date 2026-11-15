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
