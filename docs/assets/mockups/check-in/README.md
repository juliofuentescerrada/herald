# H1 check-in mockups

Deterministic review material for `h1-check-in`. These captures approve no product default and do not implement check-in in the application.

Open [the prototype](../../../../prototypes/frontend/check-in-states.html) directly from the file system. Select a fixture with `?state=<name>` or the Review states menu. Unknown values fall back to `check-in-mandatory`. No build, server, network, account or persistence is used.

| State | 1440 px desktop | 390 px mobile |
| --- | --- | --- |
| `check-in-mandatory` | [Desktop](check-in-check-in-mandatory-desktop.png) | [Mobile](check-in-check-in-mandatory-mobile.png) |
| `check-in-optional` | [Desktop](check-in-check-in-optional-desktop.png) | [Mobile](check-in-check-in-optional-mobile.png) |
| `no-admitted` | [Desktop](check-in-no-admitted-desktop.png) | [Mobile](check-in-no-admitted-mobile.png) |
| `checking-in` | [Desktop](check-in-checking-in-desktop.png) | [Mobile](check-in-checking-in-mobile.png) |
| `checked-in-toast` | [Desktop](check-in-checked-in-toast-desktop.png) | [Mobile](check-in-checked-in-toast-mobile.png) |
| `undo` | [Desktop](check-in-undo-desktop.png) | [Mobile](check-in-undo-mobile.png) |
| `check-in-failed` | [Desktop](check-in-check-in-failed-desktop.png) | [Mobile](check-in-check-in-failed-mobile.png) |
| `check-in-conflict` | [Desktop](check-in-check-in-conflict-desktop.png) | [Mobile](check-in-check-in-conflict-mobile.png) |
| `cancelled-checked-in` | [Desktop](check-in-cancelled-checked-in-desktop.png) | [Mobile](check-in-cancelled-checked-in-mobile.png) |
| `team-check-in` | [Desktop](check-in-team-check-in-desktop.png) | [Mobile](check-in-team-check-in-mobile.png) |
| `check-in-locked` | [Desktop](check-in-check-in-locked-desktop.png) | [Mobile](check-in-check-in-locked-mobile.png) |

## Provenance and contract

Original Herald compositions, rendered from local HTML/CSS/JavaScript with Playwright and the installed headless Google Chrome. Fixed November 2026 data, `en-GB`, `Europe/Madrid`, device scale 1 and reduced motion. The browser uses the system sans-serif fallback when Inter is unavailable; no font is downloaded. Desktop viewports are 1440 × 1000; mobile viewports are 390 × 1100. The taller mobile review viewport keeps the fixed-bottom toast clear of the summary and Add player action without moving it over the count. Each full-page image, viewport, SHA-256 and automated checks are recorded in [manifest.json](manifest.json).

Sources, read before drawing:

- [Check-in proposal](../../../../openspec/changes/archive/2026-11-12-h1-check-in/proposal.md), [design](../../../../openspec/changes/archive/2026-11-12-h1-check-in/design.md) R-1–R-9, D-4/D-5 and A-1–A-4, [entrant check-in specification](../../../../openspec/changes/archive/2026-11-12-h1-check-in/specs/entrant-check-in/spec.md) and [configuration specification](../../../../openspec/changes/archive/2026-11-12-h1-check-in/specs/tournament-setup/spec.md).
- [Functional discovery](../../../herald-functional-discovery.md), F-05 and TM-09. The active change supplies the narrower operator-only scope: no window, start review, member attendance or representative flow is drawn.
- [Visual direction](../../../herald-visual-direction.md), especially §§4, 5, 7.2 and 9.3. Implemented refinements supersede old captures.
- Current [entries template](../../../../web/projects/admin/src/app/features/entries/entries-page.html) and styles; [configuration template](../../../../web/projects/admin/src/app/features/tournaments/tournament-form-page.html), field definitions and registration area; the ui Drawer, Dialog, Notice, Toast and StatusLabel components.
- [Earlier entries fixtures](../../../../prototypes/frontend/entries-states.js) and [team roster fixtures](../../../../prototypes/frontend/team-rosters-states.js) provide existing fictional names. Their capture patterns supply the local capture/check mechanism, rather than authority over the current application layout.

The prototype inherits `style.css`, `access-states.css`, ui tokens and the existing team-roster admin composition; its slice stylesheet introduces no palette, font, radius or spacing scale. The full-width shell, quiet account control, text navigation, title-adjacent lifecycle labels, summary, written date-times and stacked groups follow the implemented screens.

## Visual decisions for review

- All populated entries fixtures: pending check-in uses the existing neutral StatusLabel treatment; confirmation uses its success treatment. Both carry explicit words, beside the name. The check-in control is secondary and precedes Cancel entry; team rows keep Roster first. On mobile, row actions stack in this order.
- `checking-in`: Jamie Brook's entire row action group is disabled, with progress text; other rows and Add player remain usable. The fixture deliberately stays in progress.
- `checked-in-toast` and `undo`: use existing guest names Jamie Brook and Robin Vale instead of introducing names from the specification's illustrative scenarios. Capture toasts remain until dismissed so screenshots are repeatable. They use the implemented success surface, circle-check icon and X dismiss control, fixed at the bottom with reserved page padding; no capture-only positioning is used. Undo removes the old confirmation time, following A-3.
- `check-in-failed`: the retry is the unchanged secondary “Check in” control, with an explicit failure beneath that row's metadata. No error toast is used.
- `check-in-conflict`: the returned current field shows Jamie Brook confirmed and the count at 3 of 4; the existing persistent page notice blocks further row mutations until Reload latest. Reload accepts that current field without applying the failed request.
- `cancelled-checked-in`: Parker Snow is kept after Waiting in compact expanded read-only history. Its last confirmation is labelled and timed; it is excluded from the admitted count. Other fixtures keep Cancelled collapsed.
- `team-check-in`: River Falcons is confirmed with 2 of 3–5 players, incomplete; Team A is pending with 4 players. Roster readiness remains separate text. The fixture uses two of four available team places, automatic admission and no waiting entries; it asserts no player attendance.
- `check-in-locked`: check-in policy uses the same disabled select and help placement as the implemented entry-kind and admission locks. All other configurable inputs remain editable; the competition profile remains read-only as implemented. Registration and entries precede the form.

## Verification and limitations

Recreate the captures from the repository root:

```sh
node prototypes/frontend/tools/capture-check-in.cjs
```

The 390 × 1100 captures do not assert collision freedom at every viewport height. The script checks every state at both sizes for page errors, HTTP(S) requests, horizontal overflow, labelled form controls, unique IDs, 44 px targets, and toast overlap with the primary action. It checks the unknown-state fallback, immediate check-in/undo and counts, row-local progress, failure retry, conflict reload, read-only cancellation, policy locks, retained Roster action, focus return and visible keyboard focus. Additional layout checks run at 699, 700 and 1920 px. It verifies exactly 22 unique PNGs and every manifest hash.

These are deterministic documentation fixtures, not backend, concurrency, persistence or production accessibility tests. Existing add, cancellation and registration workflows are outside this slice; their controls provide local review affordances or explanations, and send no requests. The small roster preview preserves entry context but is not a replacement for the full roster-state prototype. No functional document or OpenSpec change is modified. Nothing is committed.
