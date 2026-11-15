## Status

**Proposed in H1 batch 2's proposals pull request, 15 November 2026.** The rules come from the batch's decision session of the same day, recorded in the functional discovery (§8.1, §9.2, §10.2.1, F-08; §15 rows D-05, D-23 and D-25). It depends on `h1-exceptional-outcomes` and, for its standings flags, `h1-standings`. Merging the proposals pull request approves this change (ADR 0018); task 1.1 records that approval.

**Review answers, 15 November 2026 (#63):** the maintainer accepted Q1 to Q3 (Competition records departures after start, §5.1's round completion, a disqualification resolves its match in play as a concession after play) and the reasons of A-2 as proposed, and the prototypes as they are.

## Why

Matches can be prepared, started and resolved one by one, but the owner cannot see a round's progress, and nobody can leave a running competition: after start, the entries page is read-only and says a departure is a competitive withdrawal. D-05 and D-23, confirmed on 15 November 2026, fix what withdrawal, disqualification, a player's withdrawal and a player's sanction do. AT-05 and AT-06 test them.

## What Changes

- **Rounds (§5.1, F-08):** each round is not started, running from its first started or resolved match, or completed when every match in it is resolved, including a round resolved entirely administratively. Rests need no resolution. A later round may run before an earlier one completes.
- **Operations summary (F-08):** the Schedule page of a running competition opens with the matches scheduled, in play and resolved, each round's state, and the matches that need attention: a team match whose lineup is blocked by an unavailable player, with the player and the side.
- **Entrant withdrawal and disqualification (D-05, confirmed 15 Nov 2026):** the owner withdraws or disqualifies an entrant of a running competition with a required reason, private to the organisation. Played results stay. Each of its scheduled matches against an active entrant is resolved at once as a single absence (opponent 3); a match in play is resolved as a concession after play (§8.1); a scheduled match against an entrant already withdrawn or disqualified becomes a double absence, and the earlier single absence of that pair, if any, is revised once to a double absence keeping its predecessor. The result is the same whichever withdraws first. Withdrawal and disqualification cannot be undone in H1.
- **No active entrant (D-25):** when the last active entrant departs, every remaining match is resolved by the rules above; nothing else happens until finalisation (batch 3), which declares no active champion.
- **Player withdrawal and sanction (D-23, §10.2.1, confirmed 15 Nov 2026):** on a team's frozen roster the owner records a player's withdrawal from the tournament, which is final, or a sanction with a reason, which lasts until the owner lifts it. Both keep the player on the roster and their appearances, block them from future lineups, and block the start of a scheduled match whose current lineup includes them, naming the player; the owner revises the lineup from other eligible members. A locked or played lineup never changes. If too few eligible players remain, the match waits for the owner's explicit outcome (§8.1); the team is never withdrawn automatically. No player is added after the freeze.
- **Standings:** withdrawn and disqualified entrants keep their points and position and are flagged.
- **Coordination (D-08):** after start, competitive departure is Competition's: Registration's entry stays admitted and unchanged, and Competition records the departure on its entrant and its frozen-roster player (Q1).
- **Admin application:** the Schedule page gains the operations summary and an Entrants panel with each entrant's status and "Withdraw" and "Disqualify"; each team opens its frozen roster with "Withdraw player", "Sanction" and "Lift sanction"; the Match page names unavailable players; Standings shows the flags.
- **Notifiable facts (ADR 0017):** none in H1; F-10's change log (batch 3) records withdrawals.
- One end-to-end journey (23): an owner withdraws a player during the competition with a reason, sees the player's unplayed matches resolved as absences and the player flagged in the standings, and sees round 1 completed in the operations summary.

Out of scope: reinstatement and undoing a departure, substitutions within a match (D-19), team sanctions other than disqualification, timers and alerts, the change log (batch 3), corrections (batch 3).

## Decision rows

| Row | Status | Used for |
|---|---|---|
| D-05 Withdrawal/disqualification | Confirmed for H1 15 Nov 2026 | Automatic absences, double absence in either order, private reason |
| D-23 Frozen-roster eligibility | Confirmed for H1 15 Nov 2026 | Player withdrawal and sanction until lifted |
| D-25 Terminal outcomes | Confirmed 15 Nov 2026 | Concession after play on an in-play withdrawal; zero active entrants |
| D-08 Lifecycle ownership | Confirmed ownership; departure after start specified here | Competition records competitive departure |

§5.1's "Resolve a pairing" row (round completion) was confirmed as written on 15 November 2026 (#63).

## Open questions for the review

- **Q1** After start, competitive departure is recorded by Competition and Registration's entry stays admitted. Confirm, or have Registration record it and tell Competition.
- **Q2** Confirm §5.1's "Resolve a pairing" row: a round becomes completed when every match in it is resolved, including administratively.
- **Q3** A disqualified entrant's match in play is resolved as a concession after play, as a withdrawal's is. Confirm, or leave it for the owner's explicit outcome.

## Screens

Prototypes in `prototypes/frontend/play-and-score-states.html` (design.md, Visual input):

- **Schedule page (modified):** operations summary with rounds running and completed and a blocked match; Entrants panel; withdraw and disqualify confirmations with reason; withdrawn and disqualified entrants and their resolved matches.
- **Frozen roster dialog (modified):** withdraw player, sanction with reason, sanctioned, lift sanction.
- **Match page (modified):** start blocked by an unavailable player; too few eligible players.
- **Standings page (modified):** withdrawn and disqualified flags.

## Capabilities

### New Capabilities

- `round-operations`: round states, the operations summary, entrant and player departures.

### Modified Capabilities

- `match-lineups`: unavailable players block lineups and start.
- `standings`: departure flags.
- `end-to-end-journeys`: journey 23.

## Impact

- `Herald.Competition`: round state on the schedule; entrant status and player availability; features `WithdrawEntrant`, `DisqualifyEntrant`, `WithdrawPlayer`, `SanctionPlayer`, `LiftSanction`; automatic resolutions; migration.
- `Herald.Contracts`: `TournamentResultsChanged` gains optional entrant status (read as active in older messages).
- `Herald.Standings`: flags.
- Admin OpenAPI document and client; Wolverine's generated code; admin `schedule`, `matches` and `standings` features.
- `e2e/`: journey 23 and its test script; `tools/Herald.Seed`: a running team tournament with a sanctioned player and a running individual one with a withdrawn player. Docs: visual direction §9.3.
