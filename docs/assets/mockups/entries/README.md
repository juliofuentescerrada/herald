# H1 entries mockups

11 November 2026 · **Proposals pending maintainer review** for `h1-entries`. These deterministic captures are review material and **approve no product default**. They implement no production behaviour and do not approve the OpenSpec change. All data is fictional.

Open [entries-states.html](../../../../prototypes/frontend/entries-states.html) directly from the file system, without a build step or network. Select **Review states** or `?state=`. An unknown state falls back to `entries-empty-open`. Optional `&kind=team` reviews add/duplicate panels using team terminology; the 44 required captures use the named fixtures below.

| State | Query value | Desktop 1440 px | Mobile 390 px |
| --- | --- | --- | --- |
| [Empty individual field, registration open](../../../../prototypes/frontend/entries-states.html?state=entries-empty-open) | `entries-empty-open` | [Desktop](entries-entries-empty-open-desktop.png) | [Mobile](entries-entries-empty-open-mobile.png) |
| [Registration not open](../../../../prototypes/frontend/entries-states.html?state=entries-not-open) | `entries-not-open` | [Desktop](entries-entries-not-open-desktop.png) | [Mobile](entries-entries-not-open-mobile.png) |
| [Automatic admission, full field](../../../../prototypes/frontend/entries-states.html?state=entries-automatic-full) | `entries-automatic-full` | [Desktop](entries-entries-automatic-full-desktop.png) | [Mobile](entries-entries-automatic-full-mobile.png) |
| [Manual admission, teams](../../../../prototypes/frontend/entries-states.html?state=entries-manual-team) | `entries-manual-team` | [Desktop](entries-entries-manual-team-desktop.png) | [Mobile](entries-entries-manual-team-mobile.png) |
| [Registration closed, admission available](../../../../prototypes/frontend/entries-states.html?state=entries-closed) | `entries-closed` | [Desktop](entries-entries-closed-desktop.png) | [Mobile](entries-entries-closed-mobile.png) |
| [Choose an existing guest](../../../../prototypes/frontend/entries-states.html?state=add-existing) | `add-existing` | [Desktop](entries-add-existing-desktop.png) | [Mobile](entries-add-existing-mobile.png) |
| [Create a new guest](../../../../prototypes/frontend/entries-states.html?state=add-new) | `add-new` | [Desktop](entries-add-new-desktop.png) | [Mobile](entries-add-new-mobile.png) |
| [Possible duplicate guest](../../../../prototypes/frontend/entries-states.html?state=add-duplicate) | `add-duplicate` | [Desktop](entries-add-duplicate-desktop.png) | [Mobile](entries-add-duplicate-mobile.png) |
| [Adding, repeat prevented](../../../../prototypes/frontend/entries-states.html?state=adding) | `adding` | [Desktop](entries-adding-desktop.png) | [Mobile](entries-adding-mobile.png) |
| [Add failed, retained input](../../../../prototypes/frontend/entries-states.html?state=add-failed) | `add-failed` | [Desktop](entries-add-failed-desktop.png) | [Mobile](entries-add-failed-mobile.png) |
| [Admission unavailable, no free slot](../../../../prototypes/frontend/entries-states.html?state=admit-unavailable) | `admit-unavailable` | [Desktop](entries-admit-unavailable-desktop.png) | [Mobile](entries-admit-unavailable-mobile.png) |
| [Admit out of capacity-queue order](../../../../prototypes/frontend/entries-states.html?state=admit-out-of-order) | `admit-out-of-order` | [Desktop](entries-admit-out-of-order-desktop.png) | [Mobile](entries-admit-out-of-order-mobile.png) |
| [Cancel and admit first waiting entry](../../../../prototypes/frontend/entries-states.html?state=cancel-confirm) | `cancel-confirm` | [Desktop](entries-cancel-confirm-desktop.png) | [Mobile](entries-cancel-confirm-mobile.png) |
| [Cancel after registration closure](../../../../prototypes/frontend/entries-states.html?state=cancel-confirm-closed) | `cancel-confirm-closed` | [Desktop](entries-cancel-confirm-closed-desktop.png) | [Mobile](entries-cancel-confirm-closed-mobile.png) |
| [Entry revision conflict](../../../../prototypes/frontend/entries-states.html?state=conflict) | `conflict` | [Desktop](entries-conflict-desktop.png) | [Mobile](entries-conflict-mobile.png) |
| [Field over capacity](../../../../prototypes/frontend/entries-states.html?state=over-capacity) | `over-capacity` | [Desktop](entries-over-capacity-desktop.png) | [Mobile](entries-over-capacity-mobile.png) |
| [Loading entries](../../../../prototypes/frontend/entries-states.html?state=loading) | `loading` | [Desktop](entries-loading-desktop.png) | [Mobile](entries-loading-mobile.png) |
| [Entries load failed](../../../../prototypes/frontend/entries-states.html?state=failed) | `failed` | [Desktop](entries-failed-desktop.png) | [Mobile](entries-failed-mobile.png) |
| [Published configuration, entries link](../../../../prototypes/frontend/entries-states.html?state=entries-link) | `entries-link` | [Desktop](entries-entries-link-desktop.png) | [Mobile](entries-entries-link-mobile.png) |
| [Configuration locked by entries](../../../../prototypes/frontend/entries-states.html?state=fields-locked) | `fields-locked` | [Desktop](entries-fields-locked-desktop.png) | [Mobile](entries-fields-locked-mobile.png) |
| [Capacity save rejected](../../../../prototypes/frontend/entries-states.html?state=capacity-rejected) | `capacity-rejected` | [Desktop](entries-capacity-rejected-desktop.png) | [Mobile](entries-capacity-rejected-mobile.png) |
| [Tournament list with entries and draft](../../../../prototypes/frontend/entries-states.html?state=list-with-entries) | `list-with-entries` | [Desktop](entries-list-with-entries-desktop.png) | [Mobile](entries-list-with-entries-mobile.png) |

## Provenance

Sources: the [task brief](../../../../.prompts/h1-entries-mockups.md), [proposal](../../../../openspec/changes/h1-entries/proposal.md), [design rules EN-1–12 and assumptions A-1–9](../../../../openspec/changes/h1-entries/design.md), [guest-entry specification](../../../../openspec/changes/h1-entries/specs/guest-entries/spec.md), [setup delta](../../../../openspec/changes/h1-entries/specs/tournament-setup/spec.md), [functional discovery F-04, RI-01–07, D-06 and D-22](../../../herald-functional-discovery.md), and [visual direction §9.3](../../../herald-visual-direction.md).

The prototype reuses `style.css`, `access-states.css`, `tournament-setup-states.css` and `registration-window-states.css`. The scoped extension adds no new colour, type family, radius or spacing step. Organisation, account and tournament names come from the setup/registration fixtures; guest names are invented generic examples. The implemented tournament form, shell and `registration-area.ts` take precedence over the old setup captures: two rail destinations; no draft sentence on a published tournament; written date-times; danger field borders, icons and “Error:”; informational publication notice; last registration change without a person; registration action retains its width on mobile. The registration area has its own action above configuration, whose primary action remains Save changes.

The [manifest](manifest.json) records 44 PNGs, source file URLs, viewport dimensions, full-page capture, SHA-256 hashes and per-capture checks. Capture method matches tournament setup: Playwright with installed Google Chrome, headless, direct `file://`, device scale 1, locale en-GB, browser time zone Europe/Madrid, local assets and the system sans-serif fallback. Viewports are **1440 × 1000** and **390 × 844**. Full-page PNG height can exceed viewport height. Native date-input presentation depends on the browser.

Reproduce from the repository root with the existing e2e dependencies and Chrome installed:

```sh
node prototypes/frontend/tools/capture-entries.cjs
```

## Interaction and verification

Each state is an independent snapshot. State links select fixtures; they do not carry entered data or execute commands. Buttons explain the intended action in a status region. Existing-guest search displays a deterministic result rather than querying a directory. Creating a guest, retrying, admitting and reloading do not mutate the field or claim success. The busy state prevents repeat submission. A private reason must contain text before the out-of-order confirmation becomes available. Row cancellation opens a contextual in-page confirmation; Keep entry restores focus. Dedicated cancellation snapshots show the automatic-promotion and closed-window consequences. Team manual-admission cancellation explains that nothing is admitted automatically.

Every capture is checked for JavaScript errors, HTTP requests, horizontal overflow, visible rail, unlabelled controls, duplicate IDs and interaction target heights below 44 px. Additional checks exercise capacity-summary focus, configuration edits blocking registration changes, retry input retention, a visible 3 px keyboard-focus outline, required private reason and busy submission prevention. All captures are inspected through labelled contact sheets, with full-size samples for detailed review. This is static visual evidence; it does not verify persistence, authority, screen-reader output, server concurrency, integration delivery or real reconciliation.

The design detector's Inter warning is accepted under the existing typography contract. Its repeating-gradient advisory comes from unused legacy rules imported through `style.css`; the new surfaces render no striped decoration.

## Independent review

The full review inspected all 44 captures through contact sheets and representative full-resolution samples. It found one material fixture issue: the searched guest was already admitted. The corrected existing/duplicate examples use Quinn Ash, who has no active entry in the field. A verdict pass inspected all four corrected desktop/mobile captures and scored that finding **resolved — ship at the scope of this finding**. No material clipping or responsive hierarchy defects were found in the full review's inspected evidence. The ordinary-extension check confirmed reuse of incumbent tokens; no design-authority change was required. This assessment is limited to documentation mockups pending maintainer review.

## Visual decisions not settled by the sources

- **All entries states:** stacked operational rows in three separate groups, with counts in section headings. Waiting order uses visible ordinals and written dates. The desktop layout keeps actions next to each row; mobile stacks them. No pagination, guest editing or organisation guest directory is invented.
- **add-existing / add-new / add-duplicate / adding / add-failed:** an in-page panel above the groups preserves tournament context. Existing/new links choose independent fixtures. Possible matches show a local guest reference to distinguish same-name guests. The fixture shows one match; the same result list accepts multiple matches. Duplicate review gives the existing guest the primary action and keeps creation anyway secondary.
- **admit-out-of-order:** an in-page confirmation with a required private textarea. The example has 7 of 8 admitted and registration closed, so one slot remains available without automatic promotion. Manual pending entries do not require an exception reason.
- **cancel-confirm / cancel-confirm-closed:** in-page confirmation rather than an overlay. It names Robin Vale and, while open with automatic admission, Ellis Stone as the next admission. Cancellation is final for that entry; re-entry joins the back of the queue. Other rows use contextual confirmation without changing the snapshot.
- **entries-link / fields-locked / capacity-rejected:** the entries link has its own quiet summary between the publication notice and configuration. All three fixtures already have active entries, so all retain both locks. The rejected value 2 stays in the field while the stored admitted count remains 3. Rosters and check-in are deliberately outside the drawn slice.
- **conflict / over-capacity / loading / failed:** persistent feedback before the field. The over-capacity fixture retains all 9 admitted entries at capacity 8 and blocks adding/admitting; cancellation remains available. Loading and failed states show no entry rows or counts. Count/terms freshness uses an explicit fictional timestamp, not a live clock.
- **list-with-entries:** the existing stacked list composition gains counts and a secondary Entries action beside Edit configuration. A draft retains capacity and Continue draft, with no entry counts or Entries action.

These choices are proposals for review, not approved defaults. No functional source, visual contract or OpenSpec file is changed by this work.
