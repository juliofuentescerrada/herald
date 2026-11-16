## Context

See proposal.md (Why). Competition keeps the schedule and matches and a results revision that increases with every effective change; it publishes `TournamentResultsChanged` snapshots. Standings keeps the highest snapshot and ranks it. Tournaments owns the lifecycle labels (`CompetitionState` preparing or running).

## Goals / Non-Goals

**Goals:**

- Only standings the owner reviewed, and that are current, become final; a later change is refused, not overwritten.

**Non-Goals:**

- Archive, public final page, cross-tournament history.

## Decisions

### D-1 Competition checks the barrier

`FinaliseCompetition(tournament, reviewedRevision, expectedScheduleRevision)` is handled by Competition in one transaction: the competition is running; every match is resolved; `reviewedRevision` equals the current results revision. The owner obtains `reviewedRevision` from the standings they read, which carry the revision Standings applied; when Standings is behind, the page shows "updating" and offers no finalisation, so a reviewed revision always equals the applied one. If a result arrived meanwhile, the current revision is higher and the command fails with `review-stale`, returning the current revision. Competition then sets the state finalised, records final revision *n* (1, 2, …) with the results revision, actor and time, and publishes `CompetitionFinalised`.

### D-2 Writes after finalisation

`RecordResult`, `RecordLineup`, `StartMatch`, the departures and `CorrectResult` check the schedule's state and reject with `competition-finalised`. The check reads the same row the finalisation writes, so a write that races finalisation either commits first (and makes the review stale) or is rejected.

### D-3 Reopening

`ReopenCompetition(reason ≤ 500, expectedScheduleRevision)`: finalised → running; the final revision stays in the list with its reason for reopening; `CompetitionReopened` is published. Registration and rosters are untouched (no event reaches them). A later finalisation adds final revision *n+1*.

### D-4 Consumers

Standings marks its table final at the event's results revision and keeps the list of final revisions; on `CompetitionReopened` it returns to provisional and keeps the list. Tournaments sets `CompetitionState.Finalised` (and back to running), shown in the lifecycle labels. Both are idempotent on the final revision number (ADR 0016).

### D-5 No active entrant

Standings, when every entrant is withdrawn or disqualified, shows the notice "No active entrant: no champion is declared" with the final table; nothing else differs.

### D-6 Screens

Standings page, running and fully resolved: a "Review and finalise" panel above the table with "Results revision 14 · standings revision 14 · you are reviewing revision 14" and "Finalise" (primary); not fully resolved: the panel lists "2 matches unresolved" with links and no button; updating: "Standings are updating" with no button. Stale: a danger notice "Standings changed since your review (now revision 15)" with "Review again". Final: "Final" status label beside the title, the panel replaced by "Final revision 1 · results revision 14 · finalised by … at …" and "Reopen" (secondary); reopening asks for a required reason in a confirmation dialog. "Final revisions" disclosure after the table.

## Visual input

Prototypes: `prototypes/frontend/correct-close-open-states.html`.

| Screen | States (`?state=`) |
|---|---|
| Standings page | `finalise-ready`, `finalise-unresolved`, `finalise-updating`, `finalise-stale`, `finalising`, `final`, `final-no-champion`, `reopen-confirm`, `reopened` |
| Match page | `correct-finalised` |

Visual choices (G-/RU-): the three revisions are text, so the barrier is explainable; "Finalise" is the page's single primary action only when it can succeed; reopening is not destructive but is reasoned, so it uses a confirmation with a reason field, not the danger tone.

## Assumptions for review

- **A-1** Finalisation asks no separate confirmation: the review panel is the confirmation.
- **A-2** The reason for reopening is private; the public page shows only that the final standings were revised.

## Risks / Trade-offs

- [Standings lag] → finalisation is offered only on applied standings; Competition's check is authoritative and the event carries the final results revision, so Standings never marks an older table final.
