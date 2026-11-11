# Registration window mockups

Deterministic review material for `h1-registration-window`. These captures are review material and approve no product default. No save, registration mutation, authentication or persistence takes place.

Open [the local prototype](../../../../prototypes/frontend/registration-window-states.html). Select a fixture with `?state=not-open-ready` or the Review states menu. Each fixture is independent; navigation does not execute a tournament operation. Opening/closing snapshots intentionally remain in progress until another fixture is selected.

## States

| State | Desktop | Mobile |
| --- | --- | --- |
| `not-open-ready` | [PNG](registration-window-not-open-ready-desktop.png) | [PNG](registration-window-not-open-ready-mobile.png) |
| `not-open-missing-dates` | [PNG](registration-window-not-open-missing-dates-desktop.png) | [PNG](registration-window-not-open-missing-dates-mobile.png) |
| `unsaved-changes` | [PNG](registration-window-unsaved-changes-desktop.png) | [PNG](registration-window-unsaved-changes-mobile.png) |
| `opening` | [PNG](registration-window-opening-desktop.png) | [PNG](registration-window-opening-mobile.png) |
| `open` | [PNG](registration-window-open-desktop.png) | [PNG](registration-window-open-mobile.png) |
| `open-failed` | [PNG](registration-window-open-failed-desktop.png) | [PNG](registration-window-open-failed-mobile.png) |
| `closing` | [PNG](registration-window-closing-desktop.png) | [PNG](registration-window-closing-mobile.png) |
| `closed` | [PNG](registration-window-closed-desktop.png) | [PNG](registration-window-closed-mobile.png) |
| `conflict` | [PNG](registration-window-conflict-desktop.png) | [PNG](registration-window-conflict-mobile.png) |
| `open-date-removed` | [PNG](registration-window-open-date-removed-desktop.png) | [PNG](registration-window-open-date-removed-mobile.png) |
| `list-registration-states` | [PNG](registration-window-list-registration-states-desktop.png) | [PNG](registration-window-list-registration-states-mobile.png) |

## Provenance

Source: [task brief](../../../../.prompts/h1-registration-window-mockups.md), [proposal](../../../../openspec/changes/archive/2026-11-11-h1-registration-window/proposal.md), [design](../../../../openspec/changes/archive/2026-11-11-h1-registration-window/design.md), [registration specification](../../../../openspec/changes/archive/2026-11-11-h1-registration-window/specs/registration-window/spec.md), functional discovery §5/§5.1 rows 2–3, and visual direction §9.3. This support does not override those documents or settle the change's pending decisions.

The prototype reuses `style.css`, `access-states.css` and `tournament-setup-states.css`, the setup fixture names and configuration composition, and the implemented `tournament-form-page.html` corrections. The rail contains Overview and Tournaments only. Published pages contain no draft sentence. Date controls also have written dates; errors have danger borders, an icon and “Error:”; information and danger notices have matching tones and icons. Existing contract colours, fonts, square geometry and spacing are retained.

## Capture method and verification

As in the tournament setup set: Playwright (the installed `@playwright/test` package, using Playwright Core) with installed Google Chrome `/opt/google/chrome/chrome`, headless, direct `file://` navigation, device scale 1, locale `en-GB`, reference time zone `Europe/Madrid`. All assets are local, with the existing system sans-serif fallback and no build step. Native date controls remain browser-dependent. Capture every state with `page.screenshot({path, fullPage: true})` after navigation and `document.fonts.ready`.

Desktop viewport: **1440 × 1000**. Mobile viewport: **390 × 844**. Full-page image heights can exceed the viewport. The [manifest](manifest.json) lists exactly 22 captures with source URLs, viewport, SHA-256 and per-capture checks.

Every fixture was checked for page errors, HTTP requests, horizontal document overflow, associated input/select labels, duplicate IDs, visible rail and interaction targets below 44 px; none were found. Exercised interactions: missing-date link focuses its field; editing configuration blocks the registration action; Reload latest explains reconciliation while preserving typed input; keyboard focus has a visible 3 px solid outline; team header renders the same area structure. All captures were inspected in labelled contact sheets, with native-size mobile crops for the registration area and rejected closure field.

The design detector reports the existing Inter font and an unused repeating-gradient rule imported from the legacy shared stylesheet. Both are inherited; neither introduces a new visual treatment. This is a static visual and interaction check, not a server test, screen-reader audit, cross-browser test or accessibility certification.

## Visual decisions not settled by the sources

- **All tournament states:** a single bordered registration area at the form's 960 px width, above the information notice and configuration form. Announcement facts use two columns on desktop and stack on mobile. Its one registration action remains separate from the form's Save changes action.
- **Open and closed:** actor/time appears as a plain sentence below the announcement, showing the most recent illustrative change only. No history is invented. November timestamps are fixtures, not clock-driven state.
- **Opening and closing:** static progress wording and a disabled action prevent repetition. No spinner, timer or inferred completion is drawn.
- **Open failed:** retain the explicit action label Open registration, with failure copy saying to try it again; no second retry action is added.
- **Conflict:** retain the unavailable state action and place Reload latest in the conflict notice as the recovery control. It explains reconciliation and retains typed input in this prototype; it does not silently replace values or pretend to fetch a revision.
- **Unsaved changes and open date removed:** the area continues to show stored announcement dates while the form shows local input. The illustrative venue change is “Madrid · Main hall”. A rejected closure removal keeps registration open and uses the full-width “Correct 1 field to save” summary plus the linked field error.
- **List:** reuse operational rows with three separate lifecycle labels. The repeated Saturday Open fixture name is distinguished by registration status; links open the corresponding independent snapshot.

A team header changes the title, entry-kind text and existing team configuration fields, but does **not** change the registration-area layout. Inspect `?state=open&kind=team`; no additional capture pair is needed. All 11 required states therefore have exactly one desktop/mobile pair.
