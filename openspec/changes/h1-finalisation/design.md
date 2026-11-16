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

## Implementation record

### Decisions taken while implementing

- **I-1 Two consumers of one fact.** `CompetitionFinalised` and `CompetitionReopened` are the first integration events two modules consume. Each module routes them to its own durable local queue and pins its handler there with Wolverine's `[StickyHandler]`, so each queue runs only its module's handler in its module's transaction; `IntegrationEventRoutingTests` checks both routes.
- **I-2 Standings' row version.** Standings stores the final revisions with the results; a finalisation and its reopening handled at once must not overwrite each other, so the results row uses PostgreSQL's `xmin` as a row version (no column is added) and the handler retries. Tournaments keeps a `shortcut:` instead: Competition publishes a reopening only after its finalisation committed.
- **I-3 Competition decides what the page shows.** The Standings page reads the finalised state, the final revisions and the results revision from Competition's schedule, which every write answers with; "updating" now compares Competition's results revision with the standings revision, so a correction (which does not change the resolved count) also reads as updating. Standings' `final` is set only once it has applied the final results revision.
- **I-4 Actors' names.** Final revisions keep the finalising and reopening actors' names at the time, as corrections do, for "Finalised by …".
- **I-5 Started includes finalised.** Every admin check of "running" that meant "started" (registration, configuration locks, the start panel) now reads "not preparing"; the lifecycle label "Finalised" has no icon, as no icon meaning is reviewed for it (`docs/ui/icons.md`).

### Full run (task 6.2), 16 November 2026

- `scripts/check all`: all checks passed (rules, spec coverage, format, build, Wolverine codegen current, 643 .NET tests, OpenAPI client current, lint, boundaries, 305 Vitest tests, SSR isolation, build).
- End-to-end suite: 26 journeys passed, journey 25 included.
- Test script `e2e/scripts/seeded-finalisation.spec.ts`: 2 scripts passed.

### Comparison with the prototypes (task 6.3)

Captured at 1440 and 390 px by the test script (`test-results/screens/seeded-finalisation/`), compared with `prototypes/frontend/correct-close-open-states.html`:

| State | Difference | Resolution |
|---|---|---|
| `finalise-ready`, `reopened` | Same panel, text and revisions; the revisions are the seed's | None |
| `finalise-unresolved` | Lists every unresolved match with its state; the links first rendered in the browser's link colour | Links use the primary text colour, as elsewhere |
| `finalise-updating` | Same notice; the title shows "Updating", as the provisional page already did | Kept (h1-standings) |
| `finalise-stale` | Same notice and "Review again"; the title also reads "Updating", since Competition's results are ahead of the standings at that moment | Kept: it is true, and it clears with "Review again" |
| `finalising` | Same status text; the button keeps the shared loading state | None |
| `final` | "Final" label, final summary with "Reopen" on the right, "Final revisions" closed after the table | None |
| `final-no-champion` | Same notice, below the final summary | None |
| `reopen-confirm` | Same text and reason field; the cancel action reads "Keep it final" | Wording follows the other confirmations ("Keep as it is") |
| `correct-finalised` | Same information notice and "Go to standings" in the Result panel; lifecycle labels show "Finalised" | None |
