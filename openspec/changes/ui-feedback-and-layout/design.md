## Context

See proposal.md (Why). The visual direction already lists Dialog, Drawer and a toast rule in §5 and an admin content width that is "fluid with protected table readability" in §4, but none of it is implemented: `ui` has Button, Icon, NavLink, Notice and StatusLabel only; confirmations are in-page panels or the browser's `confirm` (the `CONFIRM` token used by `confirmLeave` and "Reload latest"); success is a persistent `herald-notice` or a status line; and each admin page sets its own `max-width` (720, 800, 960 and 1040 px today), with breakpoints at 700 and 900 px. The public home caps at 1280 px, against the documented 1200 px. `ng-primitives` 0.131.4 (MIT, already installed and allowed only inside `ui`, W-03) provides dialog, focus-trap and toast primitives.

Decisions settled with the maintainer during the exploration of 11 November 2026: toasts for outcomes only, errors at their origin; dialog for consequential confirmations, drawer for adding a player or team, page for long reviews; `form` width with an aside for the tournament configuration; the three named widths and two breakpoints; cancelled entries collapsed, no "Enter again"; pending decisions in the entries summary.

## Goals / Non-Goals

**Goals:**

- Rules in `docs/herald-visual-direction.md` that later admin screens and the public site can follow without a new decision each time.
- Dialog, drawer and toast controls in `ui`, usable by both applications and safe under SSR.
- Existing admin screens and the public home brought into line, with no behaviour change beyond feedback and layout.

**Non-Goals:**

- Tabs, tables, pagination, filters and a public discovery page.
- A layout component library: widths are tokens and a few classes, not a page framework.
- Changing any product rule, API or stored data.

## Visual input

**Supplied and accepted by the maintainer on 11 November 2026:** [`docs/assets/mockups/feedback-layout/`](../../../docs/assets/mockups/feedback-layout/README.md) (38 states, 79 captures, listed in its `manifest.json`), drawn from [`prototypes/frontend/feedback-layout-states.html`](../../../prototypes/frontend/feedback-layout-states.html) and captured by `prototypes/frontend/tools/capture-feedback-layout.cjs`. Visual decisions the sources left open (among them: the draft's missing-for-publication summary sits above the form, with no aside; catalogue dialogs and drawers are shown inline) are listed in that README under "Visual decisions not settled by the sources". The captures are review material and approve no product default. The maintainer reviewed the proposal, specs and design (D-1 to D-7, A-1 to A-4) against them and approved implementation on 11 November 2026.

Screens and states requested (each at desktop 1440 px and mobile 390 px):

| Screen | States |
|---|---|
| Tournament entries | `wide` with aside; cancelled collapsed and expanded; summary with "pending your decision" and with "waiting for a slot"; cancellation dialog (registration open with promotion, and closed); out-of-order admission dialog (empty and typed reason); add drawer (search with results, an already-entered guest, create, possible duplicate, adding, failed); toast after an admission; conflict and over-capacity notices; loading and failed; mobile with dialog and drawer full width |
| Published tournament configuration | `form` width with an aside holding registration and entries; "Changes saved" toast; save rejected with the error summary; save conflict; "Reload latest" and leave-with-unsaved-input dialogs |
| Draft tournament configuration | `form` width without aside (or with the missing-for-publication summary in it, to be shown) |
| Tournament list | `wide`; empty; loading; failed |
| Review before publishing | its width (`form`) |
| Organisation selector, organisation creation, not found | `focused` |
| Public home | 1200 px cap at 1920 px |
| `ui` catalogue | Dialog (default, destructive, busy, error inside), Drawer (default, busy, error inside), Toast (success, info, stacked, focused/hovered) with keyboard focus visible |

Existing mockups that remain valid for content and states: `docs/assets/mockups/entries/`, `tournament-setup/`, `registration-window/` and `access/`; the new captures supersede them for composition, confirmations and feedback only.

## Decisions

### D-1 Controls in `ui`, built on `ng-primitives`

`Dialog`, `Drawer` and `Toast` are `ui` controls on `ng-primitives`' dialog and toast primitives, so focus trapping, Escape handling, inert background and live regions come from one tested place. `Drawer` is the dialog primitive with a side placement and its own width (about 480 px on a wide screen, full screen below 700 px), not a separate mechanism. Each control gets its catalogue entry and accessibility tests, as the first controls did.

*Implementation note (11 November 2026):* `Dialog` and `Drawer` use `ng-primitives`' dialog as decided. `Toast` does not use its toast primitive: that primitive stacks toasts as overlapping cards that expand on hover, pauses on hover but not on focus, and positions its region with inline styles, so the visible stack, the focus pause (A-2) and the narrow-screen placement would have needed workarounds. The toast service and outlet in `ui` are about a hundred lines with their own tests. The catalogue opens each dialog, drawer and toast state as the real overlay rather than inline specimens, so focus, Escape and the busy rule can be tried there.

*Alternative considered:* the native `<dialog>` element. Rejected: it gives modality and Escape, but not focus return to a vanished trigger, inert handling across Angular portals or a toast region, and `ui` already standardised on `ng-primitives`.

### D-2 Toast state in `ui`, cleared by each app's platform

A toast service with no app dependencies lives in `ui` (a presentation contract, allowed by `frontend-boundaries`); each shell renders one toast outlet. Admin platform clears the toasts on a change of working organisation or person, where it already invalidates queries. Features call the service after a successful write.

*Alternative considered:* the service in admin platform. Rejected: the public application needs the same control later, and platform would own presentation state it does not otherwise hold.

### D-3 SSR

The toast outlet renders nothing on the server and starts in the browser; dialogs and drawers only open on interaction. The public SSR isolation check keeps passing because no request-scoped state is added.

### D-4 Widths as tokens and app classes (superseded by D-9)

`ui` defines `--herald-width-focused`, `--herald-width-form`, `--herald-width-wide` and `--herald-width-aside`, and documents the breakpoints (700 and 1200 px; custom properties cannot be used in media queries, so the values are written in the stylesheets and named in a comment). Each app's global stylesheet gains a few layout classes (a page of a given width, a main-and-aside grid) that pages use instead of their own `max-width`. Running text gets `max-inline-size: 75ch` on paragraphs.

*Alternative considered:* a `ui` page-layout component with aside slots. Rejected for now: a grid and three widths do not justify a component, and `ui` must not know about app routing or shells.

### D-5 Browser confirms become dialogs

The `CONFIRM` token's implementation opens the dialog and resolves a promise; `confirmLeave` already runs in a route guard, which accepts a promise. Closing or reloading the browser tab keeps the browser's own `beforeunload` prompt, which a page cannot replace.

### D-6 Entries page

The cancellation and out-of-order admission panels become dialogs with the same texts; the add panel becomes a drawer. The cancelled group uses a native disclosure (`details`/`summary`), compact rows and is omitted when empty. The summary's second line becomes "Manual admission · N pending your decision" or "Automatic admission · N waiting for a slot", counting entries waiting with "Admission pending" and "Capacity full" respectively. The status line used for outcomes is replaced by toasts.

### D-7 Assumptions

| # | Assumption | Why |
|---|---|---|
| A-1 | Opening and closing registration need no confirmation | Both are reversible and change nothing else (registration window rules) |
| A-2 | A toast stays at least 5 seconds, longer while hovered or focused | Long enough to read a short sentence; WCAG 2.2.1 timing is met by pausing and dismissing |
| A-3 | Toasts stack at most three; older ones leave first | Several quick writes stay readable without covering the page |
| A-4 | The drawer is about 480 px wide on wide screens | Room for a search field and result rows while the list stays visible |

### D-8 Notifications kept in mind (ADR 0017)

Added on 11 November 2026 at the maintainer's request, with no code impact. Notices were not covered by any architecture decision, and today's snapshot events cannot express F-10's facts. ADR 0017 (proposed) settles a consumer-only `Notifications` module fed by fact events, published once a consumer exists. Its inventory records `h1-entries`' admission, promotion and cancellation, which Registration's `Entry` already persists. Later proposals list their notifiable facts there.

### D-9 Full-width admin layout (maintainer's run through Aspire)

Settled with the maintainer during the run of 11 November 2026 (task 6.2), after trying the named widths and the aside on the real screens. They supersede D-4, the width and aside parts of the accepted mockups, and the "Aside from 1200 px" compositions.

- **Every admin page fills the available width.** The named widths (`focused`, `form`, `wide`), their classes and their `ui` tokens (with `--herald-width-aside`) are removed, as are the 720 px cap on the shell's failure section and the 800 px cap on the "Organisation created" notice. Standalone pages (access states, organisation creation) keep their padding with no maximum. Only `--herald-width-public` remains.
- **Running text keeps about 75 characters per line**; `Notice` loses its own 75 ch cap and fills its container in every app, so a notice lines up with the panels around it.
- **No aside; one breakpoint.** Secondary content is stacked with the main content at every width; 700 px is the only breakpoint. Tournament configuration (published): the "Published · configuration remains editable" notice, the registration area and the entries summary, then the form. Entries: the summary, the admitted and waiting groups, then the collapsed cancelled group.
- **Labels beside the title.** On the tournament configuration and entries pages the lifecycle labels sit to the right of the title and wrap below it when there is no room. The review page keeps them under its lead, because its title is fixed while its labels wait for the tournament.
- **Summary actions on the right.** "View entries" and "Add player"/"Add team" (with the reason when unavailable) sit to the right of their summary text, and stack under it below 700 px.
- **Organisation creation.** "A workspace of your own" sits inside the creation panel, under the form; the access pages keep their side note after the panel.

*Alternatives tried:* a 1440 px cap aligned left (it leaves an uneven empty margin on wider screens) or centred; the 320 px aside beside the configuration form and the entries groups (rejected by the maintainer on sight); the creation note at full width beside the panel (lines too long).

## Risks / Trade-offs

- [`ng-primitives` is pre-1.0 and its API may change] → Only `ui` imports it; a change touches the three controls and their tests, not features.
- [Toasts are missed by people who look away or use a screen reader] → Outcomes are also visible on the page (the entry moves group, the form shows saved values); toasts never carry errors or the only path to an action.
- [Focus handling regressions] → Catalogue and Vitest tests with `axe-core` for each control; journeys 13 and 14 exercise the dialog and drawer.
- [Visual churn across screens already reviewed] → Content, texts and states stay; only composition, confirmations and feedback change, compared against the new mockups.

- [The admin initial bundle grows to about 945 kB, over its 900 kB warning budget (error at 1 MB)] → The dialog primitive (focus trap, portal, Escape routing) is the cost; loading it lazily did not help because the `ui` entry point is bundled whole. The warning stays; the maintainer decided on 11 November 2026 to optimise the bundle later if it becomes an obstacle.

## Migration Plan

Frontend only; no data or API migration. Rollback is reverting the change.

## Validation record

**Full run (6.1), 11 November 2026.** `dotnet format --verify-no-changes` clean; `dotnet build` with no warnings; 273 .NET tests pass; Wolverine codegen and the OpenAPI documents and web client regenerate with no drift; web lint and the boundary fixtures (15 planted violations, 15 reported) pass; Vitest passes in every project (admin 167, public 13, catalogue 7, `ui` 31, api-client 9) with `axe-core` checks; the three applications build, admin with its initial-bundle warning (see Risks); the SSR isolation check passes (50 concurrent requests); the 14 Playwright journeys pass, with journeys 8 (leaving with unsaved input) and 13–14 (entries) updated for the dialogs, toasts and the collapsed cancelled group.

**Visual comparison (6.2).** A temporary Playwright spec (not committed) built the states against the composed system, a real organisation with an individual automatic tournament (three admitted, two waiting, three cancelled) and a team manual one, forcing the rarer states with `page.route` (a held or failed cancellation and addition, a 409, a 400, a free slot, over capacity, a slow or failed field), and captured 34 states at 1440 × 1000 and 390 × 844, full page, plus `entries-wide`, `list-wide` and `public-home` at 1920 × 1080; the catalogue states were captured from the built catalogue in block 2. Each was compared with its mockup. Corrected after the comparison: the cancelled disclosure keeps a visible "+"/"−" marker, which the native one lost with its inline layout; result rows in the add drawer put "Enter this player" under the name, as in the mockup, instead of squeezing it beside it. Kept: the public hero band stays full width, with its content capped at 1200 px (the mockup insets the band); the catalogue opens each dialog, drawer and toast state as the real overlay (see D-1). Observed, as in the mockups: on a wide screen a toast can sit over the bottom of the aside, for example over "View entries" for the few seconds after a save; it can be dismissed and pauses on hover. Not captured in the real system: `cancel-dialog-closed`, which differs from `cancel-dialog` only by its effect sentence and is covered by Vitest.

**Maintainer's run through Aspire (6.2), 11 November 2026.** The maintainer ran the system and revised the layout: D-9 records the decisions, which supersede the width and aside parts of the comparison above (the toast over the aside no longer applies). After the revision: admin Vitest 167, `ui` 31 and public 13 pass; lint and the boundary rules pass; the catalogue builds.

## Acceptance review

| Requirement | Evidence |
| --- | --- |
| Outcomes are announced as toasts | `ui/toast.spec.ts` (polite region, leaves by itself, nothing on the server); entries spec (admission, cancellation, addition toasts); form spec ("Changes saved.", draft saves); journeys 13 and 14 |
| Toasts can be read and leave with their context | `ui/toast.spec.ts` (at least five seconds, paused while focused, dismissible, at most three); `app.spec.ts` (cleared when access stops); a change of organisation or person is a full load (W-06) |
| Errors stay where they arose | Entries spec (failed cancellation and addition inside the dialog or drawer with retry and kept input; conflict on the page, dialog closed); form spec (field errors and summary, conflict notice, no success notice) |
| Consequential actions are confirmed in a modal dialog | Entries spec (cancellation with its effect and destructive action; out-of-order admission unavailable until a reason); `ui/dialog.spec.ts` (`confirm`); journeys 8 and 13 |
| Dialogs keep focus and requests under control | `ui/dialog.spec.ts` (Escape, focus kept and returned, busy ignores Escape and repeats nothing); entries spec (busy cancellation); journey 13 (focus on "Keep entry") |
| Multi-step flows that keep their context open in a drawer | Entries spec (drawer, search, duplicate, failed addition keeps the name); journey 14; captures `add-drawer-*` |
| Long reviews are pages and reversible actions act at once | Review page unchanged; entries spec (in-order admission without a dialog); registration journey unchanged |
| Admin pages use the full width | No page or `ui` stylesheet sets a maximum width for admin content (D-9); paragraphs keep `max-inline-size: 75ch`; maintainer's run at desktop width; captures at 390 px with no horizontal scroll |
| Secondary content is stacked with the main content | Form spec (registration and entries before the form for a published tournament, neither for a draft); entries spec and journeys 13–14 on the stacked page; maintainer's run |
| Public content is capped at 1200 px | Measured on the built home: content starts at x = 360 at 1920 px; capture `public-home` |
| Visual weight follows what a person can act on | Entries spec (collapsed compact cancelled group with its count, omitted when empty; "pending your decision" and "waiting for a slot"); journey 13 |
| Guest entries (modified) | Entries spec and journeys 13–14 cover every scenario, including the dialog naming the waiting entry and the drawer's duplicate |
| Tournament setup (modified) | Form spec: a successful save is a toast and leaves no persistent success notice; the other scenarios keep their tests |

The maintainer's run through Aspire (task 6.2) is done; its layout decisions are D-9.
