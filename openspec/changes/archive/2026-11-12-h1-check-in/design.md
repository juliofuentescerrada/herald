## Context

See proposal.md (Why). Registration owns the `Field` aggregate of each tournament: its projected entry terms and its entries, each with admission state, entry revision and, for teams, a roster with its own revision and history (`h1-team-rosters`). Registration shares its field counts with Tournaments through `TournamentFieldChanged` (v1: admitted, waiting), which Tournaments keeps to lock entry kind and admission and to bound the capacity (EN-10). The check-in policy (`Optional` or `Mandatory`) is already part of the tournament configuration and required for publication, with no effect yet. Competition start does not exist.

The maintainer decided on 12 November 2026, after the exploration of the same day:

- **R-1 No window:** H1 has no check-in window, configured or announced. The operator records check-in at any time before competition start, whatever the registration state (closing registration does not change check-in, §5.1 row 3).
- **R-2 No absent state:** pending and confirmed only. "Absent" adds nothing until the director's absence review, which belongs to the start slice (F-05: "the director reviews absences and explicitly frees slots before starting").
- **R-3 Undo with history:** a confirmed check-in can be undone before start; every confirmation and undo is recorded with who and when (ADR 0007).
- **R-4 Admitted entries only:** see A-1, which keeps the maintainer's doubt open for review.
- **R-5 Optional records and informs:** an optional policy records check-in like a mandatory one and shows it as information.
- **R-6 Mandatory has no effect yet:** combined start readiness (admitted, checked in, eligible roster) waits for the competition-start slice.
- **R-7 Policy locked by check-ins:** Tournaments rejects a change of the check-in policy while confirmed check-ins exist, not merely while entries exist: switching to mandatory after admitting, before anyone has checked in, is a reasonable correction.
- **R-8 Not a notifiable fact:** F-10 lists check-in in neither the H1 change log nor the H2 notices; no fact event and no row in ADR 0017's inventory.
- **R-9 UX:** on the existing entries page; status label beside the name, check in or undo on the right, toast with no dialog, last change as row meta only (no history section), summary with policy and count; teams keep check-in apart from roster readiness (TM-09); no bulk action, filter or search.

## Goals / Non-Goals

**Goals:**

- The owner records which admitted entries are present, from the admin application and through the Admin API, with a durable history.
- The checked-in count reaches Tournaments through the existing field counts contract, extended compatibly.

**Non-Goals:**

- Start readiness, the absence review and freeing slots; pairings excluding pending entries (F-05 acceptance belongs to the start slice).
- Player attendance within a team (TM-09) and lineups.
- Sending the check-in policy to Registration: the entries page reads it from the tournament configuration it already loads; the start slice adds it to the entry terms when Registration needs it.
- A check-in history view beyond the row's last change.

## Visual input

Screens: the tournament entries page (modified: admitted rows, summary, cancelled rows) and the tournament configuration form (modified: the check-in policy locked).

**Supplied 12 November 2026:** `docs/assets/mockups/check-in/` (README with its visual decisions, `manifest.json`, 22 captures at 1440 and 390 px) from `prototypes/frontend/check-in-states.html`, generated with `.prompts/h1-check-in-mockups.md` under the current layout rules (visual direction §4, §5, §7.2). Review material: they approve no product default. Visual decisions the documents did not settle, taken from the mockups' README:

- Pending uses the neutral `StatusLabel`, confirmed its success tone, both in words beside the name.
- The check-in action is secondary and precedes "Cancel entry"; on team rows "Roster" comes first. On mobile the row actions stack in that order.
- While a check-in is in progress, that row's whole action group is disabled with progress text ("Checking in…"); other rows and "Add player" stay usable.
- A failure is said under the row's meta; the retry is the unchanged "Check in" action. No error toast.
- A conflict uses the existing page notice with the current field and "Reload latest", blocking row writes until reloaded.
- An expanded Cancelled group shows a checked-in entry's last confirmation, labelled and timed, read-only.
- The configuration form disables the check-in policy with the help text "Entries have checked in. Undo every check-in to change it.", placed as the entry-kind and admission locks.

| Screen | States |
|---|---|
| Entries page, individual tournament | `check-in-mandatory`, `check-in-optional`, `no-admitted` (policy without a count), `checking-in`, `checked-in-toast`, `undo`, `check-in-failed`, `check-in-conflict`, `cancelled-checked-in` |
| Entries page, team tournament | `team-check-in`: one team checked in with an incomplete roster, one pending with a complete roster |
| Configuration form | `check-in-locked` |

The configuration page's Entries panel in `check-in-locked` keeps its current text ("4 of 4 individual entries admitted · 1 waiting") and does not show the checked-in count; D-4's count on Tournaments' details serves the lock, not that panel.

## Decisions

### D-1 Check-in lives on `Entry`, decided in `Field`

`Entry` gains its check-in state (pending or confirmed, defined only while admitted or kept after cancellation), a check-in revision starting at 0 and a history of `CheckInChange` (confirmed or undone, check-in revision produced, by, at). `Field` decides the writes, as it does admission, because it already loads the entry with its state and terms and publishes the counts in the same transaction. Domain events: `EntryCheckedIn`, `EntryCheckInUndone`.

*Alternative considered:* a separate `CheckIn` aggregate per entry. Rejected: it would need the entry's admission state copied in to refuse waiting or cancelled entries, and its own counts published separately.

### D-2 Its own revision, as the roster

Check-in writes state the check-in revision, not the entry revision, so an admission or cancellation in another tab does not conflict with a check-in and the reverse (as roster writes, `h1-team-rosters` D-2). A check-in or undo that already matches the current state is a repeat answered with the current entry, checked before the revision, as admission does.

*Alternative considered:* idempotent "set state" writes with no expected revision. Rejected: §5.1 requires every mutation to check the expected revision, and two tabs undoing and confirming would silently overwrite each other.

### D-3 Contract extension, still version 1

`TournamentFieldChanged` gains `int CheckedIn = 0` at the end of the record: confirmed check-ins among admitted entries. A message written before the change reads as 0, which locks nothing (R-7). Optional members are backwards compatible (ADR 0008, ADR 0016), so no version 2. Tournaments' `EntryCounts` gains the count and `LockedByEntries` the rule `checkIn`/`locked-by-check-ins`. Every check-in write increments the field revision and publishes the counts, as admission does.

### D-4 API (Admin group)

| Operation | Method and path (under `/api/organisations/{organisationId}/tournaments/{tournamentId}/entries/{entryId}`) |
|---|---|
| `checkIn` | `PUT /check-in` (expected check-in revision) |
| `undoCheckIn` | `DELETE /check-in` (expected check-in revision) |

Both return the field, as admission and cancellation do. `getField` gains per entry `checkIn` (`pending`, `confirmed` or absent for an entry never admitted), `checkInRevision` and `checkInChangedAt`, and the field gains `checkedIn`. The actor is recorded in the history but not returned: H1 has one owner per organisation, so the row meta shows only the time. Errors: 400 rule codes `entry-not-admitted` (waiting) and `entry-cancelled`; 404 generic; 409 conflict of type `check-in-revision-conflict` with the current check-in revision. Tournaments' details gain the checked-in count, which the configuration form uses for the lock.

### D-5 Admin application

The `entries` feature adds to admitted rows the `StatusLabel` beside the name, the last change as row meta (`instantText` in the tournament's zone, as other row times) and the check-in action on the right. The action writes at once, invalidates the field and announces "Ana Ruiz checked in." or "Ana Ruiz's check-in undone." as a toast; a failure stays in place on the row (visual direction §5: toasts never carry errors); a 409 shows the existing conflict treatment. No dialog: the action is reversible and a confirmation would slow the desk. The summary line reads the policy from the tournament configuration the page already loads. The `tournaments` feature's configuration form disables the check-in policy with its reason, as it does entry kind and admission. Tournaments' details expose the count for that lock; the list and the Entries panel do not show it.

### D-6 Durable history and notifiable facts

Every confirmation and undo is a `CheckInChange` row written with the effective change (ADR 0007). The start slice will read the confirmed check-ins at start and may record them with the frozen field. No fact event and no ADR 0017 inventory row (R-8).

### D-7 Tests

- Domain (no mocks): check in, undo, repeats, conflicts, waiting and cancelled entries, promotion starting pending, cancellation keeping evidence, the count.
- Use cases and API against PostgreSQL: the `entrant-check-in` scenarios, organisation isolation, an old field counts message without `CheckedIn`, the policy lock through a Tournaments save after a check-in.
- Vitest with `axe-core` for each Visual input state; end-to-end journey 16.

## Assumptions

| # | Assumption | Why |
|---|---|---|
| A-1 | Only admitted entries check in; a waiting entry that turns up is admitted first, then checked in | The maintainer chose admitted only, with a doubt to review here: a desk may want to note a waiting entrant's arrival so promotion favours present people. Not doing it keeps check-in a single dimension of admitted entries; the start slice's absence review can revisit it |
| A-2 | Cancelling a checked-in entry needs no extra warning beyond the existing cancellation dialog | Cancellation is already confirmed and its evidence, check-in included, is kept |
| A-3 | The row meta shows the last change only ("Checked in 10:42 · Europe/Madrid"); an undo shows nothing once pending again | The maintainer chose row meta only; the full history stays in the API and the database |
| A-4 | The check-in policy is shown with the summary even when no entry is admitted ("Check-in mandatory") with no count | The owner sees the rule before the desk opens |

## Risks / Trade-offs

- [Every check-in publishes the field counts to Tournaments] → One small message per action, the same volume as admission; a 16-entry desk produces 16 messages.
- [The count is stale in Tournaments for a moment] → A policy change racing a first check-in may be accepted; it is reported by the next counts message like other crossed changes (D-08), never repaired silently. Acceptable before start.
- [No absent state] → The start slice may need one for its review; adding a state is additive to this model.

## Migration Plan

Registration: migration `AddCheckIn` (check-in state, revision and last change on entries; `CheckInChange` table). Tournaments: migration `AddCheckedInCount` (the kept count). Rollback: drop the table and columns. Wolverine's code, the admin OpenAPI document and the client are regenerated. No deployment exists yet (M4), so no backfill.

## Open Questions

- None. The maintainer approved the implementation, A-1 included, on 12 November 2026 (gate 1.1).

## Implementation record

**Covers markers (8.0).** Every `entrant-check-in` scenario and the modified `tournament-setup` scenarios carry a `covers` marker on the tests that prove them (Registration and Tournaments domain tests, the API tests and the admin Vitest specs); `Capacity below the admitted entries`, both entry kind scenarios and `The form explains the locked fields` left `docs/rules/uncovered-scenarios.txt`. These are the first Vitest markers: `it('…', { meta: { type: 'covers', description: '…' } }, …)`, the shape `spec-coverage.mjs` already reads, typed by `web/projects/admin/src/covers.d.ts` (augmenting Vitest's `TaskMeta`, excluded from the app build); the maintainer chose it over a `// covers:` comment form, which would have changed the script, on 12 November 2026. Journey 16 has no marker: the `end-to-end-journeys` requirement lists journeys without a scenario each.

**Seeded check-in.** The `tournaments-by-state` scenario checks in Autumn League's first entrant (`Admin.CheckInAsync`), so the seeded data shows a confirmed check-in and a locked check-in policy; the test script `e2e/scripts/seeded-check-in.spec.ts` checks in and undoes another entrant there.

**Full run (8.1).** `scripts/check all` passes: rules, spec coverage, `dotnet format --verify-no-changes`, build, `codegen write` and `pnpm api:generate` leave no difference, 334 .NET tests, web lint, the boundary fixtures (15 planted, 15 reported), `test:all` (admin 197, public 13, catalogue 7, ui 31, api-client 9), the SSR isolation check and `build:all`; the e2e suite passes (16 journeys) and so do both test scripts. The admin initial bundle's budget warning (900 kB) predates this change: 946.9 kB now.

**Visual comparison (8.2).** Each Visual input state was captured at 1440 and 390 px from the running application (real data entered through the UI; `page.route` holds a check-in for `checking-in` and fakes the 500 and the 409 for `check-in-failed` and `check-in-conflict`) and compared with `docs/assets/mockups/check-in/`. The rows, labels, summary, actions and their order, the stacked mobile actions, the team row and the locked policy match. Differences, none changing a decision:

- The house components replace the prototype's drawing: the row failure is the danger text with its icon (as roster failures), the in-progress action shows the button's spinner, and disabled row actions during a conflict use the button's disabled style rather than a grey fill.
- The expanded Cancelled row puts the "Checked in" label after "· Cancelled …" on the name line, where the mockup puts it beside the name with the cancellation time below; the facts and the read-only last confirmation are the same.
- `no-admitted` also shows the existing "No entries yet" panel above the empty groups, which the entries page already had (h1-entries).
- Data only: the captures use an online tournament ("Online" for "Madrid"), the real times, and undo Jamie Brook rather than Robin Vale; consecutive toasts stack.

The maintainer ran the slice through Aspire on 12 November 2026 with no differences to correct, and accepted these as adjustments: a mockup is a reference, not a copy to match (icons, which the mockups do not draw, come in a separate change).

**Acceptance review (8.3)** against the change's specifications:

| Specification | Requirement | Evidence |
|---|---|---|
| `entrant-check-in` | An owner checks in an admitted entry (admitted player, after closure, waiting and cancelled refused, team without a complete roster, promoted entry pending) | Registration `CheckInTests`; Host `CheckInTests` (`An_owner_checks_in_an_admitted_player`, `A_waiting_entry_cannot_check_in`, `A_cancelled_entry_cannot_check_in`, another organisation's generic 404) |
| `entrant-check-in` | An owner undoes a check-in (repeats return the current entry) | Registration `CheckInTests`; Host `An_owner_undoes_a_check_in_and_a_repeat_returns_the_field` |
| `entrant-check-in` | Check-in keeps its history (three changes recorded, stale revision conflicts, admission does not conflict, cancellation keeps evidence) | Registration `CheckInTests`; Host `A_stale_check_in_write_is_a_conflict`, `An_admission_in_another_tab_does_not_conflict_with_a_check_in`, `Cancelling_keeps_the_check_in_and_stops_counting_it` |
| `entrant-check-in` | The field reports how many admitted entries have checked in (count, older message) | Registration `Cancelling_keeps_the_evidence_and_stops_counting`; `TournamentFieldChangedTests` |
| `entrant-check-in` | The admin application shows and manages check-in | `entries-page.spec.ts` (check-in tests, axe); visual comparison (8.2); journey 16; test script `seeded-check-in`; maintainer run (12 November 2026) |
| `tournament-setup` | Entries constrain the tournament's configuration (check-in policy locked by confirmed check-ins, free without them, the form explains it) | `TournamentEntryRulesTests`; Host `The_check_in_policy_is_locked_by_a_check_in_from_registration_and_free_once_it_is_undone`; `tournament-form-page.spec.ts` |
| `end-to-end-journeys` | Journey 16 | `e2e/journeys/entries.spec.ts` |

Status documents updated: `docs/herald-visual-direction.md` §9.3 (check-in row), `docs/roadmap.md` and `README.md`. `CLAUDE.md` and `openspec/config.yaml` no longer carry status (they link to the roadmap), so they are unchanged.
