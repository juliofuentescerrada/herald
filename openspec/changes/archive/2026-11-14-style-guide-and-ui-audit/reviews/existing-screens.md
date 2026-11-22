# Existing-screen conformance review

Date: 14 November 2026. Status: initial audit for the documentation proposal; production remediation is separate follow-up. Criteria: [G-01–12](../../../../../docs/ui/style-guide.md#review-criteria) and [RU-01–10](../../../../../.claude/skills/refactoring-ui/SKILL.md).

## Baseline and method

Inspected `main` at `b017628cc643b3f68b017e6e37aefb0a13f1bedc`. No production source changes are included in this branch. Inventory came from admin/public/catalogue route definitions, their templates/styles, shared UI sources and relevant implemented specifications. CodeGraph was initialised and used before reading implementation areas.

Source review covered the current surfaces below against visual direction §§3–5, §7.2, §8 and §10. Current [screen/state references](../../../../../docs/herald-visual-direction.md#93-h1-screenstate-inventory) include [access](../../../../../docs/assets/mockups/access/README.md), [tournament setup](../../../../../docs/assets/mockups/tournament-setup/README.md), [registration](../../../../../docs/assets/mockups/registration-window/README.md), [entries](../../../../../docs/assets/mockups/entries/README.md), [feedback/layout](../../../../../docs/assets/mockups/feedback-layout/README.md), [rosters](../../../../../docs/assets/mockups/team-rosters/README.md) and [check-in](../../../../../docs/assets/mockups/check-in/README.md). Old raster widths/asides do not override current composition. No new mockups are needed for this documentation-only change.

Browser review used the unchanged local Angular public app and catalogue, anonymous Chromium, Node 26 and the pinned workspace/Playwright/axe dependencies. It covered 320, 390, 699, 700, 1440 and 2560 CSS px; axe ran on the home page, public not-found and catalogue resting state at 390 and 1440. Measurements are in [browser-measurements.json](browser-measurements.json). The small local audit utility used Playwright directly; it was not the composed E2E suite. No host, database, identity provider or synthetic signed-in admin journey ran. Local anonymous screenshots were inspected but are not committed or attached as E2E evidence.

To reproduce, install `web/` and `e2e/` with their pinned pnpm version, run `pnpm exec ng serve catalogue --port 4400` and `pnpm exec ng serve public --port 4300` in separate terminals under `web/`, then run `node openspec/changes/archive/2026-11-14-style-guide-and-ui-audit/reviews/browser-review.mjs` from the repository root. Use `HERALD_CHROMIUM` to select an installed compatible Chromium if needed. The [dated utility](browser-review.mjs) updates only the measurement file; it creates no screenshots and never signs in.

`pass (source)` means the inspected contract is present in code, not that runtime behaviour passed. `gap` names a repeatable mismatch. `not verified` identifies missing execution evidence, not a discovered failure. No screen is declared fully conformant from these samples.

## Screen and state inventory

Admin paths below are relative to the app; `:organisationId` and `:tournamentId` are placeholders. Access screens replace the workspace rather than defining separate routes.

| Surface / route | States inspected in source | Result and evidence limit |
| --- | --- | --- |
| Admin shell and account overlay | Selected/no organisation, rail/mobile bar, current navigation, organisation replaced, lazy-load failure, account open/closed | Pass (source): full-width page beside rail, stacked below breakpoint, current navigation and icon cues. Keyboard/focus/context replacement not verified in composed browser |
| Admin `/` resolution | Signed in/out, organisation selection or creation routing | Pass (source): context selects destination; actual sign-in/redirect not verified |
| Admin access replacement | Signing in, failed, cancelled, not assigned, session expired, unavailable, recovery; unsaved input/copy where relevant | Pass (source): explicit recovery and preserved-input explanations; denied-state browser/privacy behaviour not verified |
| Admin `/organisations`, `/organisations/:organisationId/switch` | Loading, current/other organisation rows, switch, create/keep navigation | Pass (source): full-width list, current selection distinct; runtime loading/failure replacement not verified |
| Admin `/organisations/new` | Default/edited, name validation, creating, failure, leave with input | Pass (source): single panel then supporting content, associated errors and retained value. Visual field-error treatment differs from tournament/drawer forms (A-09) |
| Admin `/organisations/:organisationId` | Overview, just-created notice, notice dismissed | A-03 records the specific created-notice requirement versus the general toast rule; preserve the implemented notice pending explicit reconciliation. Empty overview is current scope, not an invented missing dashboard |
| Admin `.../tournaments` | Loading, failed/retry, empty, draft/published list with lifecycle/capacity/entries links | Pass (source): stacked records, empty icon and independent lifecycle labels. Tabular numerals absent (A-02); long-name/zoom layout not verified |
| Admin `.../tournaments/new`, `.../tournaments/:tournamentId` | Create, individual/team draft, saved/published, missing values, invalid fields, saving, failure, conflict, locked fields, unavailable | Pass (source): full-width form, grouped fields, summaries and local recovery; numeral gap A-02; browser state transitions not verified |
| Published configuration registration area | Not open/open/closed, missing dates, unsaved-blocked, busy, failure, conflict/reload | Pass (source): separate operation area and explained unavailability; dates do not imply automatic registration; A-02 applies |
| Admin `.../tournaments/:tournamentId/review` | Loading/unavailable, individual/team summary, blocked, publishing, failure, changed revision, already published | Pass (source): dedicated substantial review page, explicit publication consequence; A-02 applies; no runtime publication check |
| Admin `.../tournaments/:tournamentId/entries` | Loading/unavailable, field failure, empty, admitted/waiting, over capacity/kind mismatch, conflict, individual/team, check-in pending/confirmed/busy/row failure, cancelled history | Pass (source): local errors, separate readiness/check-in and active groups first; A-02 applies. Historical roster access is retained, not a mutation (A-06) |
| Entries overlays | Add existing/new guest, search pending/no matches/failed, duplicate choice, busy/error; cancel confirmation, queue effect; out-of-order reason | Pass (source): contextual drawers, destructive confirmation and input retained. Repeated primary result actions (A-05); busy/Escape/focus/discard behaviour not verified in admin |
| Roster overlay | Loading/error/retry, empty/populated, bounds/readiness, duplicates, remove busy/failure, add existing/new, conflict/reload, cancelled read-only, history | Pass (source): no writes to cancelled roster and intentional no-toast update. Repeated primary actions (A-05), empty history disclosure (A-07); runtime not verified |
| Admin unknown route, inside/outside organisation | Generic not-found, navigation back | Pass (source): message does not confirm a foreign private record; browser not verified |
| Public `/` and shell | Wide/narrow layout, mobile Menu closed/open, Sign in destination | Pass (browser sample): no page overflow at six widths; Menu expands and Sign in becomes visible. Header/content alignment gap at 2560 (A-08) |
| Public `**` | Not-found, return home, server response assignment | Gap A-08: body remains left aligned in a narrow width. Browser layout checked; actual production HTTP/SSR response not verified by this audit |
| Public `/_fixtures/ssr`, `/_fixtures/client` | Server/browser fixture text, marker/API pending/error, click state | Development fixture source inspected; API/SSR isolation not verified; fixtures are not product screen targets |
| Catalogue `/` | All button variants, disabled/loading, unavailable reason, links, icon sizes, status tones, notices, navigation, recovery default/failure/done | Pass (browser sample): no page overflow, no sampled axe violations. Usage/example gaps A-03/A-10, loading width A-04 and breakpoint A-11 |
| Catalogue overlays/toasts | Destructive initial focus, Escape/return, busy ignores Escape, narrow drawer, three toasts/reserved space, reduced motion | Pass for the specific interactions under Executed checks. Exhaustive focus-cycle, timing, errors/retry and assistive-technology behaviour not verified |

H2–H5 discovery, participant, match, round, standings and live-update screens are future prototypes/targets, not implemented routes in this baseline. They are excluded from current-screen pass counts; their coverage remains in visual direction §9. The audit did not treat an absent future route as a regression.

The supplied organiser/participant perspectives are covered by [experience patterns](../../../../../docs/ui/experience-patterns.md), including the H2 public portal and the mapping of exploratory features to scope. That design guidance extends the review criteria for future H2 slices; this baseline audit does not imply those experiences were implemented or tested.

## Findings

All open production findings are proposed follow-up, not changes made by this branch. There is no verified blocking runtime failure in the sampled states; admin interactions that have not run are coverage limits.

### A-01 Semantic colour escapes in the shared notice — minor, open

- **Criterion:** G-02 / RU-06, token-only component styling (visual direction §3).
- **Evidence:** `web/projects/ui/src/lib/notice.css:15` assigns information text directly to `#174a46`; line 50 uses a raw translucent black hover colour.
- **Trigger:** updating a semantic palette leaves these notice colours outside the shared mapping, so the same role cannot be changed centrally. This is a source-proven consistency defect, not a failed contrast assertion.
- **Correction:** introduce/reuse named semantic text/interaction mappings in tokens and consume them in the notice; compare information and dismiss hover/focus on their actual surfaces.
- **Disposition:** open; shared-UI follow-up with token/consumer checks.

### A-02 Comparable dates/counts lack tabular numerals — minor, open

- **Criterion:** G-03 / RU-05; visual direction §4.
- **Evidence:** `web/projects/ui/src/styles/base.css:3`, tournament list facts/capacity at `web/projects/admin/src/app/features/tournaments/tournament-list-page.ts:43`, review values at `tournament-review-page.ts:71`, registration dates and entry counts. No `tabular-nums`/`font-variant-numeric` declaration exists under `web/projects/`.
- **Trigger:** comparable numeric values render with the font's default numeral widths instead of the required tabular treatment; public/catalogue sampled computed style was `normal`. No admin pixel-alignment pass is claimed.
- **Correction:** apply tabular numerals to comparison-bearing date/count/result roles while leaving prose unchanged; check the actual fallback and intended fonts.
- **Disposition:** open; typography follow-up, scoped to numeric roles.

### A-03 Completed-action outcomes and a specific created-notice contract — should fix, open

- **Criterion:** G-08 / RU-09; feedback placement in visual direction §5.
- **Evidence:** `web/projects/catalogue/src/app/controls-page.html:104` shows `Results saved` as a notice; `recovery-demo.ts:32` shows successful publication the same way. Separately, `web/projects/admin/src/app/overview-page.ts:14` shows `Organisation created`, which the implemented `end-to-end-journeys/spec.md:33` explicitly requires. The reviewed feedback/layout change also retained that notice and removed its width cap (archived design D-9).
- **Trigger:** catalogue-only outcome examples teach persistence despite the generic toast rule. The overview presents a different issue: following that generic rule literally would remove a specific required created-notice behaviour. It cannot be classified as an unconditional implementation defect.
- **Correction:** change catalogue-only outcome examples to use toasts with confirmed state retained on the page, or use persistent examples of ongoing conditions. Preserve the overview notice unless a reviewed delta explicitly reconciles the created-notice requirement, general feedback rule and existing creation journey. Preserve the separate team-rosters no-toast exception too.
- **Disposition:** catalogue examples open for remediation; overview contract reconciliation open for maintainer review, with current behaviour preserved. The guide now records both specific workflow exceptions.

### A-04 Loading changes button width — should fix, open

- **Criterion:** G-06 / G-07; Button's own public contract promises label/width stability (`web/projects/ui/src/lib/button.ts:17`).
- **Evidence:** catalogue primary `Publish` at 1440 px measures 85.5625 px default and 107.5625 px loading with the same text. The conditional 14 px spinner plus 8 px gap (`button.css:53`, `button.ts:28`) accounts for the 22 px difference.
- **Trigger:** submitting adds the spinner to content flow; a neighbouring action can move or wrap even before any label change.
- **Correction:** reserve progress space or otherwise keep the control's measured width stable across the transition, including changing progress labels. Keep visible text, repeat blocking, focus and reduced-motion feedback.
- **Disposition:** open; shared-Button follow-up with a before/while-loading layout assertion and catalogue comparison.

### A-05 Search result lists repeat primary actions — should fix, open

- **Criterion:** G-01 / G-06 / RU-03; one primary per operation area (visual direction §5).
- **Evidence:** `web/projects/admin/src/app/features/entries/entries-page.html:268` and `web/projects/admin/src/app/features/entries/roster-drawer.html:160` assign primary to every eligible search result's enter/add action.
- **Trigger:** a search returns several eligible guests, producing several equal accent-filled choices in one result area. No browser screenshot of signed-in results was taken.
- **Correction:** use secondary row actions or an explicit selection with one primary confirmation; retain row-specific accessible names and existing duplicate rules. Secondary styling is the smaller change.
- **Disposition:** open; entrant/roster follow-up, verify several results and narrow layout.

### A-06 General history wording conflicted with read-only roster access — minor, documentation resolved

- **Criterion:** G-01 / G-06; source precedence and implemented team-rosters contract.
- **Evidence:** `entries-page.html:197` offers Roster on a cancelled team. `openspec/specs/team-rosters/spec.md:88` explicitly requires read-only roster access, while the prior visual direction §5 said no row actions in history.
- **Trigger:** following the broad visual sentence literally would remove implemented, required evidence inspection.
- **Correction:** distinguish a read-only inspection from a mutation. The visual direction and guide now explicitly preserve this exception and the roster update's no-toast rule.
- **Disposition:** resolved in documentation; no production behaviour changed and no new product policy was chosen.

### A-07 Empty roster history still occupies space — minor, open

- **Criterion:** G-01 / RU-02; omit empty history (visual direction §5).
- **Evidence:** `web/projects/admin/src/app/features/entries/roster-drawer.html:84` always renders `History · 0` and `No changes yet`.
- **Trigger:** a roster with no changes includes a historical disclosure that competes with the current add/member work despite having no evidence to inspect.
- **Correction:** omit the history disclosure until it contains a record; retain member empty-state help and the visible count when history exists.
- **Disposition:** open; roster follow-up, check empty and populated history.

### A-08 Public shell/not-found do not share the centred content alignment — should fix, open

- **Criterion:** G-05 / RU-04; public capped/centred content (visual direction §8.1).
- **Evidence:** `web/projects/public/src/app/app.css:2` uses only the fluid gutter for shell content while home-page content also accounts for the maximum width. At 2560 px the brand begins at x=128 and hero/section text at x=680. `not-found-page.ts:18` caps the entire main at 65ch without centring it; its measured x=0 and width=520.515625 px persist at 1440/2560.
- **Trigger:** on wide screens the shell and body no longer share a content edge, and the 404's whole container remains a narrow left block instead of a centred public content region with independently limited prose.
- **Correction:** use the public width/gutter mapping for shell inner content and the not-found container; constrain only running text separately. Keep full-width background bands and mobile behaviour.
- **Disposition:** open; public composition follow-up with wide/narrow/very-wide comparisons.

### A-09 Organisation field errors use a different treatment — minor, open

- **Criterion:** G-03 / G-07 / G-11; consistent field feedback across forms.
- **Evidence:** `web/projects/admin/src/app/features/organisations/create-organisation-page.html:26` prints the message alone, while tournament and entry/roster field errors include the shared decorative error icon and `Error:` prefix.
- **Trigger:** invalid input receives different visual error cues depending on which form collected it. The organisation error is still text-associated and has an invalid boundary; this is not reported as a proved accessibility failure.
- **Correction:** adopt the existing field error pattern consistently, or document a deliberate form-specific exception. Do not add a fake shared `Field` component just to fix this one template.
- **Disposition:** open; form-consistency follow-up.

### A-10 Catalogue examples can teach unsupported icon/navigation intent — should fix, open

- **Criterion:** G-06 / G-11 / RU-10; icon placement and current admin navigation contract.
- **Evidence:** `web/projects/catalogue/src/app/controls-page.html:75` decorates `Try again` with refresh; line 121 adds an Organisation navigation item, which the current admin shell intentionally lacks.
- **Trigger:** an agent copies the catalogue as product guidance, adding an icon to an ordinary admin action or recreating a removed destination. Both examples render, so state tests alone do not catch the intent problem.
- **Correction:** use an allowed labelled navigation/back example for icon-in-control demonstration and current workspace destinations, or clearly label an isolated capability-only example that must not be copied into admin composition.
- **Disposition:** open; catalogue follow-up. The written component/icon guides now distinguish capability from permitted usage.

### A-11 Catalogue switches layout at 700 px inclusively — minor, open

- **Criterion:** G-05; the narrow layout is below 700 px (visual direction §4).
- **Evidence:** `web/projects/catalogue/src/app/controls-page.css:19` uses `max-width: 700px`; product screens and shared overlays use `max-width: 699px`.
- **Trigger:** at exactly 700 px the catalogue demonstrates narrow table/pair layout while the product and overlay controls use the wide layout. This is a boundary inconsistency, not an additional breakpoint family.
- **Correction:** align the boundary with the shared contract and keep a 699/700 comparison in verification.
- **Disposition:** open; catalogue consistency follow-up.

## Executed checks

Browser observations on the unchanged baseline:

- 18 route/viewport samples: public home, public not-found and catalogue at six widths. In each, document scroll width equalled viewport width; no page-level horizontal overflow was observed.
- Six axe runs (three resting pages × 390/1440) with WCAG 2 A/AA, 2.1 AA and 2.2 AA tags: zero reported violations in these samples. This does not cover all interactive states or establish WCAG compliance.
- Catalogue destructive dialog: initial focus was `Keep entry`; Escape closed it and returned focus to the trigger. Busy dialog ignored Escape.
- At 390 × 844 the drawer occupied x=0, y=0, width=390, height=844. Three toasts rendered with labelled dismiss buttons and 226 px of reserved body bottom space. Reduced-motion spinner computed animation duration was `0s`.
- Sampled hydrated icons had exactly one SVG per icon host. Mobile public Menu set `aria-expanded="true"` and revealed Sign in.
- Default/loading button widths and very-wide public alignment produced findings A-04/A-08. Anonymous local screenshots of public not-found and the narrow catalogue were visually inspected; no screenshots are committed as synthetic E2E captures.

Documentation/harness checks and any UI baseline unit-test results are recorded in the owning [design validation](../design.md#validation-and-review), with the exact scope actually run.

## Remaining verification

Not verified: composed admin browser journeys, external sign-in, server/API failures, organisation/permission replacement, destructive request retries, every modal focus cycle and trap, screen-reader announcements, toast pause/timeout behaviour, all hover/pressed/inverse combinations, long unbroken names/time zones, 200% zoom and production SSR/HTTP responses. The environment has no .NET SDK, so the composed suite was not started; no claim is made that .NET or Docker-backed checks ran. The local browser samples require neither and are explicitly narrower evidence.

Before accepting a production remediation, run the existing synthetic E2E scripts/journeys for its affected flow, at 1440 and 390 with boundary/long-content/zoom checks where relevant. Capture each changed state through the synthetic E2E environment, compare against its current reference and record the resolution in that change. Source-positive rows above still need their runtime checks; they are not blanket acceptance.

## Remediation order

| Priority | Findings | Scope and exit evidence |
| --- | --- | --- |
| 1 | A-04 | Shared Button progress stability; measured before/busy width, focus/repeat checks, catalogue captures |
| 2 | A-03, A-10, A-11 | Catalogue feedback, intent and boundary corrections; review the created-notice contract tension separately before any overview change, with creation/recovery checks |
| 3 | A-05, A-07, A-09 | Entry/roster/form consistency; multiple results, empty history and invalid fields, synthetic signed-in checks |
| 4 | A-08 | Public content alignment; 390/1440/2560 comparisons and not-found response regression check |
| 5 | A-01, A-02 | Token/numeral consistency; affected semantic pairs and comparison-bearing roles verified |
| Documentation complete | A-06 | Read-only roster inspection and no-toast roster update exception explicitly preserved |

These are proposed remediation groups, not an approved implementation batch or a change to milestone order. The maintainer can review this guide and prioritise the follow-up with the existing OpenSpec visual-input process.
