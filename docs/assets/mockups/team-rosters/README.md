# H1 team roster mockups

Deterministic documentation prototype for `h1-team-rosters`, 11 November 2026. These captures are **review material and approve no product default**. They represent proposed roster UI, not implemented Angular functionality.

Open [team-rosters-states.html](../../../../prototypes/frontend/team-rosters-states.html) directly from the file system; choose a state from the review navigator or use `?state=<name>`. Unknown values fall back to `team-readiness`. No build step, network, API or persistence is needed.

## States

19 states, each at 1440 × 1000 and 390 × 844 viewport sizes. Entries use full-page captures; drawers scroll within a viewport-sized modal, so lower members, history and the leaving action remain reachable by scrolling.

| State | Coverage | Desktop · 1440 px | Mobile · 390 px |
| --- | --- | --- | --- |
| `team-readiness` | Admitted and waiting teams; readiness in words; cancelled history collapsed | [Desktop](team-rosters-team-readiness-desktop.png) | [Mobile](team-rosters-team-readiness-mobile.png) |
| `roster-empty` | No members; adding available | [Desktop](team-rosters-roster-empty-desktop.png) | [Mobile](team-rosters-roster-empty-mobile.png) |
| `roster-incomplete` | Two members, below the minimum of three | [Desktop](team-rosters-roster-incomplete-desktop.png) | [Mobile](team-rosters-roster-incomplete-mobile.png) |
| `roster-complete` | Four members, within the bounds | [Desktop](team-rosters-roster-complete-desktop.png) | [Mobile](team-rosters-roster-complete-mobile.png) |
| `roster-full` | Five members; maximum reached, adding unavailable with reason | [Desktop](team-rosters-roster-full-desktop.png) | [Mobile](team-rosters-roster-full-mobile.png) |
| `roster-above-maximum` | Six members retained after the maximum was lowered | [Desktop](team-rosters-roster-above-maximum-desktop.png) | [Mobile](team-rosters-roster-above-maximum-mobile.png) |
| `add-existing` | Existing player search; Team A’s player is unavailable | [Desktop](team-rosters-add-existing-desktop.png) | [Mobile](team-rosters-add-existing-mobile.png) |
| `add-new` | New player name entered | [Desktop](team-rosters-add-new-desktop.png) | [Mobile](team-rosters-add-new-mobile.png) |
| `add-duplicate` | Possible duplicate warning; separate guest still allowed | [Desktop](team-rosters-add-duplicate-desktop.png) | [Mobile](team-rosters-add-duplicate-mobile.png) |
| `adding` | Addition in progress; controls cannot repeat or close | [Desktop](team-rosters-adding-desktop.png) | [Mobile](team-rosters-adding-mobile.png) |
| `add-failed` | Failed addition with input retained and retry | [Desktop](team-rosters-add-failed-desktop.png) | [Mobile](team-rosters-add-failed-mobile.png) |
| `remove` | One removal in progress; controls cannot repeat or close | [Desktop](team-rosters-remove-desktop.png) | [Mobile](team-rosters-remove-mobile.png) |
| `possible-duplicate-member` | Informational same-name flag against Team A | [Desktop](team-rosters-possible-duplicate-member-desktop.png) | [Mobile](team-rosters-possible-duplicate-member-mobile.png) |
| `history-expanded` | History open, including a removed player and actor/time evidence | [Desktop](team-rosters-history-expanded-desktop.png) | [Mobile](team-rosters-history-expanded-mobile.png) |
| `cancelled-read-only` | Cancelled team; no mutation controls | [Desktop](team-rosters-cancelled-read-only-desktop.png) | [Mobile](team-rosters-cancelled-read-only-mobile.png) |
| `awaiting-terms` | Bounds not yet known; writes unavailable with reason | [Desktop](team-rosters-awaiting-terms-desktop.png) | [Mobile](team-rosters-awaiting-terms-mobile.png) |
| `conflict` | Concurrent change notice; reload latest | [Desktop](team-rosters-conflict-desktop.png) | [Mobile](team-rosters-conflict-mobile.png) |
| `loading` | Roster load in progress; no stale members | [Desktop](team-rosters-loading-desktop.png) | [Mobile](team-rosters-loading-mobile.png) |
| `failed` | Roster load failed; retry and no stale members | [Desktop](team-rosters-failed-desktop.png) | [Mobile](team-rosters-failed-mobile.png) |

## Provenance

- Functional scope: [proposal](../../../../openspec/changes/h1-team-rosters/proposal.md), [design rules R-1–R-10, decisions and A-1–A-5](../../../../openspec/changes/h1-team-rosters/design.md), [team-rosters spec](../../../../openspec/changes/h1-team-rosters/specs/team-rosters/spec.md), and [functional discovery §10.2, TM-02/03/05 and D-17](../../../herald-functional-discovery.md).
- Composition and controls: [visual direction §4, §5, §7.2 and supersession inventory §9.3](../../../herald-visual-direction.md). Full-width single column; labels beside the title; summary action on the right; history last. The earlier captures’ capped widths and asides are superseded.
- Current visual truth: `web/projects/admin/src/app/features/entries/entries-page.html` and `.css`, admin `app.html`, `app.css` and `account-menu.ts`/`.css`; `web/projects/ui/src/lib/dialog.ts`/`.css`, Notice and StatusLabel. Existing entries/feedback prototypes provide fixture names and dependency-free review conventions, only where consistent with the implementation.
- Shared prototype tokens from `style.css` and `access-states.css`; existing UI semantic feedback tokens from `web/projects/ui/src/styles/tokens.css`. No new palette, font, corner radius or spacing scale.
- Fictional organisation Northside Gaming, operator Alex Morgan and Saturday Team League are reused from the entries fixtures. Team A and generic player/team names are invented. Capacity is four teams; roster bounds are three to five. All written times are November 2026, Europe/Madrid.

## Visual decisions for review

The documents fix behaviour and overall layout but leave these details open:

- `team-readiness`: readiness wraps beside the name and uses warning text for incomplete/above-maximum states, neutral text within bounds. Complete rosters use the specified count without an extra “complete” label. Team A names the reference team used by the exclusivity and same-name examples.
- `add-existing`, `add-new`, `add-duplicate`, `adding`, `add-failed`: adding is a step within the same roster drawer. The team name, bounds and readiness remain visible; the member list and its history return with “Back to roster”, avoiding a second modal and keeping the input visible on mobile. The two guest-choice buttons share one row at both sizes, leaving room for duplicate feedback and its override action. A duplicate guest already on Team A has no add action; creating a separate guest remains possible.
- `roster-full` and `roster-above-maximum`: a disabled Add player control is followed by a plain-language explanation. An above-maximum roster needs enough removals to fall below the maximum before another player fits; members are never trimmed automatically.
- Roster member rows keep Remove beside the name and written date on both viewports, with the existing compact text/spacing tokens. This keeps the maximum and above-maximum explanations visible on mobile; longer history remains scrollable.
- `remove`: only the first member reads “Removing…”, with a progress sentence; all mutation/leaving controls are disabled while the request is in progress. No confirmation or reason is introduced.
- `possible-duplicate-member`: the information notice sits within the affected member row, where its meaning is unambiguous.
- `history-expanded`: chronological history lines show additions/removals, Alex Morgan and written date-times; collapsed in all other roster detail states, including empty history.
- `cancelled-read-only`: the drawer explicitly labels the cancellation and read-only status and retains history. “Back to entries” is the sole button. Its entries-page cancelled group stays collapsed behind the drawer.
- `awaiting-terms`: no speculative bounds are shown in the drawer. Existing members remain visible, with roster writes unavailable while bounds are missing.
- `conflict`: the drawer retains the last read list, explains that the attempted write changed nothing and disables writes until “Reload latest”. The local reload fixture illustrates a removal made elsewhere.
- `loading` and `failed`: bounds may be known from entry terms but there is no stale member list or readiness count inside the drawer. Retry and leaving actions are explicit.
- All drawers initially focus their heading with visible focus evidence; Back to entries and Escape return focus to the opener. Busy fixtures stay in progress deterministically. In a long drawer, scroll to reach history and leaving controls, matching the implemented scrollable panel.

## Reproduce and verify

From the repository root, using the existing `e2e/node_modules/@playwright/test` and installed Chrome:

```sh
node prototypes/frontend/tools/capture-team-rosters.cjs
```

The script derives its capture/check structure from `capture-feedback-layout.cjs`. [manifest.json](manifest.json) records all 38 PNGs, SHA-256 hashes, viewport sizes and per-capture checks: state, page errors, HTTP(S) requests, horizontal overflow, labelled controls, unique IDs, 44 px control heights, drawer dimensions and focus inside the drawer. Interaction checks cover fallback, cancellation read-only access, focus return/trapping, non-repeatable busy states, blocked adding, add/remove readiness updates without toasts, history, retained-input retry, conflict reload and 699/700/1920 px layouts. No dependencies are installed by the script.

These are static review fixtures, not production accessibility certification or an implementation of authorisation, persistence or concurrency. Other entries/account actions explain their prototype scope. Search results are deterministic examples, not a live organisation directory.
