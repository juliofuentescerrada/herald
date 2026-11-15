## Context

See proposal.md (Why). After batch 1, Competition keeps the eligible field, the schedule's draft and publications and the revision the competition started on; Registration keeps each admitted team's frozen roster revision; Tournaments keeps the profile, including `ActivePlayersPerSide`. A published `Pairing` (today's record `Match`) has a round and two entrants but no identity or state.

## Goals / Non-Goals

**Goals:**

- Each pairing of a running competition is a match that can be opened, prepared and started.
- A team match starts only with two valid lineups, which start locks.

**Non-Goals:**

- Results and terminal outcomes (`h1-operator-results`, `h1-exceptional-outcomes`); player unavailability (`h1-round-operations`); representatives (H2).

## Decisions

### D-1 Matches are created from the started revision

On `TournamentCompetitionStarted`, Competition creates one `Match` aggregate per pairing of the revision the competition started on, with a new identifier, the round, the two entrants and state `Scheduled`. Rests are not matches. The round-robin record `Match` is renamed `Pairing` so that the aggregate takes the name. If the start crossed a withdrawal (`h1-competition-start` D-4), matches are created when the republished revision is fixed. Creating them twice for one start changes nothing.

### D-2 A lineup is a revisioned list on the match

`Match` keeps, per side, a list of lineup revisions (players, who, when). `RecordLineup(side, players, expectedRevision, actor, at)` accepts only while the match is scheduled and validates: exactly `ActivePlayersPerSide` players, distinct, all members of that side's frozen roster. A lineup that fails is rejected naming the problem; nothing partial is stored. The current revision is the last one; earlier ones remain as history.

### D-3 Start validates and locks

`Start(expectedRevision, actor, at)` rejects unless the competition is running and the match is scheduled. For a team match it also requires both current lineups to be valid and no player in both; it then records the locked lineup revision of each side with the start. An individual match starts with no lineup check. Repeating the start returns the started match (same operation identity); a stale revision is a conflict with the current match.

### D-4 Competition learns frozen rosters and the active count

Registration publishes `TournamentFrozenRostersChanged` v1 (organisation, tournament, revision, teams: entry, frozen revision, members: guest player, name) when it processes the start, as a snapshot (ADR 0016). Tournaments adds optional `ActivePlayersPerSide` to `TournamentCompetitionStarted` (null for individual tournaments). Competition keeps both as local projections. A team match whose rosters have not arrived reports "Waiting for the frozen rosters" and cannot record lineups yet.

### D-5 Screens

The Schedule page of a running competition keeps its rounds; each match row adds a state badge ("Scheduled", "In play") and opens the Match page. The Match page shows the round, the two entrants and, for teams, one Lineups panel per side: the frozen roster as a list of checkboxes with the selected count against the required count, "Save lineup", and the revision history after the actionable groups. "Start match" is the page's primary action, disabled with the first blocker. After start, the lineups show as locked with who and when.

## Visual input

Prototypes: `prototypes/frontend/play-and-score-states.html`, shared by the batch's five changes. Review material; it approves no product default.

| Screen | States (`?state=`) |
|---|---|
| Schedule page | `schedule-running-matches` |
| Match page, individual | `match-individual-scheduled`, `match-individual-in-play` |
| Match page, team | `lineup-empty`, `lineup-incomplete`, `lineup-ready`, `start-match-confirm`, `match-starting`, `match-team-in-play`, `lineup-conflict`, `match-load-failed` |

Visual choices (style guide G-/RU-): the Lineups panels stack (one column, §7.2), each with the side's name and a count badge ("4 of 5 selected", danger; "5 of 5", success); selection uses checkboxes (`docs/ui/components.md`: multiple choice from a short list), not toggles; "Save lineup" is the panel's action and "Start match" the page's primary action; start asks for confirmation because it locks both lineups; history is read-only and last. Icons: the existing status icons only.

## Assumptions for review

- **A-1** Lineups can be recorded for any scheduled match at any time after start, in any round (Q2).
- **A-2** Starting a match asks for confirmation for team matches (it locks lineups); an individual match starts without one.
- **A-3** A player may appear in lineups of several matches; H1 assigns no times, so TM-11's simultaneous-conflict warning has nothing to compare yet.

## Risks / Trade-offs

- [Rosters arrive after the start] → the Match page says it is waiting; nothing can be recorded on an unknown roster.
- [Renaming the round-robin record] → a mechanical rename in Competition; persisted pairings keep their JSON shape.
