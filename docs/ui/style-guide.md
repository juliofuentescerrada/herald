# Herald UI style guide

Status: documentation proposal, 14 November 2026. Applies to mockups, prototypes, the shared catalogue and production screens. Read alongside the [visual direction](../herald-visual-direction.md), which owns the numeric foundations, page compositions and screen/state inventory. A documented target is not a claim that every existing screen meets it.

## Start here

Before designing or implementing a screen:

1. Read the relevant product journey and decision-register rows. Write down the person's job, the record/context they are acting on and the next permitted action.
2. Load [herald-screens](../../.claude/skills/herald-screens/SKILL.md) and [Refactoring UI practices](../../.claude/skills/refactoring-ui/SKILL.md). Follow the proposal's existing visual-input process.
3. Choose the page composition from visual direction §7.2 or §8, then the controls from [component guidance](components.md). Check [icon guidance](icons.md) before choosing symbols.
4. Specify every relevant state and its recovery, including permission changes, conflicts and long content. Apply the review criteria below to mockups as well as code.
5. Record decisions, reference links, comparisons and exceptions in the change's `design.md`. Reuse the [review format](#review-and-handoff); never turn a proposed product rule into a UI default.

The first implementation audit is [Existing screens, 14 November 2026](../../openspec/changes/style-guide-and-ui-audit/reviews/existing-screens.md). It is dated evidence, not a second style guide.

## Sources and precedence

| Question | Maintained source |
| --- | --- |
| What may the person do, and what does a status mean? | [Functional discovery](../herald-functional-discovery.md), its decision register and implemented OpenSpec capability |
| What are Herald's colours, type sizes, spacing, geometry and page order? | [Visual direction §§3–8](../herald-visual-direction.md#3-colour-foundations) |
| Which control fits the intent and what does its API support? | [Component guidance](components.md), checked against `@herald/ui` public exports |
| Which icon represents this meaning? | [Icon guidance](icons.md) and the typed `IconName` registry |
| How do we apply Refactoring UI? | [Local practice skill](../../.claude/skills/refactoring-ui/SKILL.md); Herald's confirmed constraints take precedence |
| Which screens and states need visual references? | Visual direction §9 and [herald-screens](../../.claude/skills/herald-screens/SKILL.md) |
| Where does implementation belong? | [Frontend rules](../../web/CLAUDE.md), ADR 0011 |

An old screenshot or archived design cannot override a current confirmed contract. Preserve the distinction between confirmed direction, proposed refinements and implemented behaviour. This guide adds no dark-theme toggle, new public workflow or product policy.

## Review criteria

Use the stable identifiers in review findings and handoff notes. Values and approved exceptions live in the linked visual-direction sections; do not create a competing token scale here.

### G-01 Hierarchy follows the task

The title identifies the page or record. The next actionable work has the strongest emphasis; supporting facts and historical records have progressively less. Establish hierarchy through grouping, weight, position and spacing before adding colours or making every heading larger (Refactoring UI RU-01–03).

Keep publication, registration and competition state distinct. A green check-in label does not mean a team roster is ready or that a tournament has started. Do not turn all metadata into badges. Preserve the order and history rules in visual direction §§5–7.

**Review:** on a quick scan, can a person identify the context, what needs attention and their next action? Does history compete with work they can do now?

### G-02 Use semantic colours and surfaces

Use the [semantic mappings](../herald-visual-direction.md#31-semantic-tokens) and [implemented CSS tokens](../../web/projects/ui/src/styles/tokens.css). Use the canvas for page context and surfaces for meaningful groups, borders for separation and stronger boundaries for controls. Reserve shadows for layers that are actually above content. Keep corners square.

The primary accent draws attention to action/selection. Success, warning, information and danger describe distinct meanings; pair each with readable text. Never use the accent as small text on white or use a pale divider token as the only input boundary. Apply `data-herald-surface="inverse"` to graphite sections so focus and controls receive their surface mappings. A graphite section is not a complete dark theme.

**Review:** check actual foreground/background pairs in default, hover, pressed and focus states, including inverse surfaces. A raw colour inside a component is a token-consolidation finding even if its contrast happens to pass.

### G-03 Typography communicates importance

Use the family, roles and size ranges in [visual direction §4](../herald-visual-direction.md#4-typography-space-and-geometry). Use the shared font stack in code; until a font is supplied, a system fallback is expected. Do not silently download a font from an external service.

Prefer sentence case, normal body weight and a few clear levels. Labels are quieter than values; errors and essential status stay readable. Use tabular numerals where dates, capacities, scores or standings are compared. Limit running text independently of its full-width panel. Names, titles and error explanations must wrap without being silently cut off; use `min-width: 0` on shrinking flex/grid children when needed.

**Review:** inspect long names, a long time-zone identifier, several lifecycle labels and 200% zoom. Verify the font actually rendered rather than assuming Inter is installed.

### G-04 Space expresses relationships

Use the scale in visual direction §4 through `--herald-space-*`. Related label/value/help/error content sits closer together than unrelated fields; fields group inside sections, and sections have the largest separation. Start with enough space to see the groups, then reduce it deliberately for operational density (RU-04).

Align text, field edges, summaries and action groups consistently. Avoid fixing density with arbitrary gaps or a new spacing value. Stroke widths, icon dimensions, targets, content widths and breakpoints are dimensions; the visual direction records their exceptions to the spacing scale.

**Review:** can grouping be understood without a border around every element? Do equivalent groups use equivalent spacing across screens?

### G-05 Compose for the available width

Administration follows [§7.2](../herald-visual-direction.md#72-page-compositions): full width, stacked page groups, summaries before their actionable lists, secondary content below, status labels beside the title and summary actions to the right when they fit. A semantic `<aside>` below a form is acceptable; a competing side column is not. Two field columns within a form group are compatible with the existing composition and collapse below the single breakpoint.

Public pages follow [§8](../herald-visual-direction.md#8-public-and-participant-composition): capped, centred content, a restrained graphite introduction where useful and the documented fluid outer gutter. Do not add a hero to every page.

The narrow layout starts below 700 px. Preserve reading order, wrap action groups and replace wide operational rows with stacked content. Make text children shrink safely; do not hide whole-page overflow to conceal a broken layout. The page must remain usable at 320 CSS px and under zoom; test 699 and 700 px to catch boundary disagreements.

**Review:** no lost content or page-level horizontal scroll; container widths and alignment match the composition at 390 and 1440 px. A horizontally scrollable code example in development tooling needs its own labelled container, not a scrolling page.

### G-06 Choose controls by intent

Use a link for a destination and a button for an operation. `herald-button` changes appearance, not semantics. Use one primary action per operation area; a registration operation and a configuration-save operation may each have their own primary action. In a result list, repeated row actions normally use secondary weight so the list does not become a wall of accent.

Use the [selection table](components.md#choose-by-intent) before choosing between a status, notice, toast, dialog, drawer and review page. Keep consequential actions visibly labelled. Explain unavailability near the action and connect it with `aria-describedby` when useful. A busy action communicates progress, blocks repeats and preserves focus and the surrounding layout.

**Review:** a person can distinguish navigation, reversible actions and destructive confirmation; keyboard activation has the same result as pointer activation. Do not use an unexplained disabled action as the only explanation of a permission rule.

### G-07 States are part of the design

For data views, specify loading, empty, populated, updating/stale and failure with retry. Initial load failure does not masquerade as an empty list. Do not leave stale/private records visible after access or organisation changes. Show lifecycle dimensions as returned by the domain, without inferring them from dates or colour.

For forms, include default, edited, validation failure, submitting, request failure, revision conflict, saved, locked and permission-loss states where relevant. Keep valid input after failure; link an error summary to the corresponding fields. A conflict tells the person what changed, that their request did not apply, and how to load the current revision. A successful action is reflected in page data as well as any toast.

**Review:** every loading or failure state has an end or a recovery path; no interaction implies success before the server confirms it. Test a retry and a context change, not just a screenshot of the happy path.

### G-08 Feedback stays with its cause

Apply the placement table and confirmation pattern in [visual direction §5](../herald-visual-direction.md#5-shared-component-contracts). Field errors belong at the field; failed row actions remain on the row; dialog/drawer errors remain inside the open surface; page blockers persist on the page. Toasts report the person's completed action and are never the only record or the only recovery path.

Use a confirmation for a consequential decision that fits one question, a drawer for contextual work and a page for a substantial review. Do not add a confirmation to every reversible action. Name the consequence, including effects on waiting entries, rather than asking a vague "Are you sure?".

**Review:** close/reopen behaviour preserves expected input, Escape and focus return work, background content cannot receive focus through a modal, and busy operations cannot be repeated or dismissed halfway through.

### G-09 Accessible interaction is visible interaction

Meet the acceptance target in [visual direction §10](../herald-visual-direction.md#10-accessibility-and-semantic-acceptance). Use native semantics, heading order, associated labels/help/errors, explicit current navigation and visible surface-appropriate focus. Touch targets follow the product target; an icon's visual size is not its hit area.

Use text alongside colour and icons. Keep DOM order consistent with reading order. Respect reduced motion; progress must still be understandable when animation is removed. Announce meaningful results politely and reserve interrupting alerts for errors requiring attention. A static badge is not a live region. Do not auto-focus routine live updates.

**Review:** use Tab, Shift+Tab, Enter, Space and Escape, then axe and a screen-reader spot check. Automation does not prove reading order, good copy, focus restoration or complete WCAG compliance.

### G-10 Content is specific and consistent

Write British English, sentence-case headings and verb-led actions. Use the project's domain vocabulary: organisation, entrant, roster and check-in describe different concepts. State units, time zone and whether a value is pending or effective. Use public-safe synthetic names in documentation and screenshots.

Avoid raw API errors, unexplained abbreviations, icon tooltips as essential instructions and decorative copy that competes with a task. A request failure explains what did not change and how to recover. A permission failure reveals no record from another organisation.

### G-11 Icons have a stable meaning

Follow [icon guidance](icons.md). Reuse the reviewed registry and meaning table; choose by meaning, not by badge tone. Preserve the admin rule that ordinary actions are text only and the documented back-button exception. Never substitute an icon for a consequential action's visible label.

**Review:** equivalent meanings use equivalent names and sizes across screens. Decorative icons do not duplicate accessible names; standalone meaningful images and icon-only controls have the appropriate names.

### G-12 Evidence states what was checked

List the screens, states, viewports, references, method and revision checked. Use `pass`, `gap`, `not verified` and `not applicable` explicitly. Source inspection can establish a CSS/API mismatch; it cannot establish that focus trapping, contrast under all states or a composed user journey passed in a browser.

Compare against the current documented contract when a raster reference has been superseded. Record the deviation and its disposition without regenerating old mockups. Screenshots intended for the repository or pull request come from the synthetic E2E environment; see [herald-screens](../../.claude/skills/herald-screens/SKILL.md).

## Worked compositions

### Published tournament configuration

Read the current composition from visual direction §7.2. Use a record title and independent lifecycle labels, followed by the published information notice, registration operation, entries summary/navigation and configuration form. The registration button and save button are primary within separate operations. `View entries` is a link with `users`; save/open/close are text-only buttons. Publication is not inferred to mean registration is open.

A save failure stays at the form; field validation adds associated errors and the summary. A revision conflict keeps typed values and offers `Reload latest`. A successful save updates the visible values and may show a toast. Do not move the summary into an aside to fill a wide screen.

### Entries and roster work

Lead with the tournament context and actionable summary. Use admitted and waiting groups, explicit check-in/readiness text and secondary row actions. Adding opens a drawer; cancelling an entry opens a destructive dialog that explains queue effects. Show errors inside that surface. Put cancelled history after active work and keep its count visible when collapsed.

Cancelled team entries retain read-only roster inspection as the implemented team-rosters contract requires; history offers no mutation. Roster additions/removals update the drawer and page readiness without a toast under that same contract. Individual entrants never acquire a team-roster control by design convenience.

## Review and handoff

Copy this outline into a change's `design.md` or a linked review file. Use one finding per actionable failure, with evidence and a proposed resolution.

```text
Revision / date:
Product journey / decision rows and statuses:
Screens and states (including overlays):
Visual reference and any superseding rule:
Component choices and reasons:
Icon meanings / new registry entries:
Viewports: 1440, 390, 699, 700; 320 reflow; 200% zoom
Checks actually run: source / browser / keyboard / axe / E2E

Finding ID | G-/RU- criterion | severity | file:line / capture
Trigger and observed result:
Expected behaviour and source:
Proposed correction / exception / owner:
Status: open / resolved / accepted exception / not verified
Retest and evidence:
```

Severity: **blocking** for lost access boundaries, lost input, unavailable essential actions or inaccessible core flows; **should fix** for a repeatable contract violation; **minor** for a local consistency defect. An unverified state is a coverage gap, not a pass or an invented defect.

Before handing off, account for every relevant G- criterion and every affected screen/state. Check the component catalogue at narrow and wide widths, compare the screen to its reference and record all material differences. A visual exception needs its reason and maintainer disposition in the owning change; it never silently changes the foundations.

## Maintaining the system

- A new exported control includes an intent/API entry here in [components](components.md), an interactive catalogue example, relevant state tests and its approved visual reference in the same change.
- A new icon updates the typed registry, [meaning table](icons.md#meaning-table), catalogue examples and relevant accessibility/SSR checks.
- Numeric foundation changes update visual direction and tokens together; inspect consumers before adopting the new value. Keep token names semantic and avoid application-specific tokens in `ui`.
- Keep review snapshots in their change. Update the live guide when a decision is accepted, and link old evidence without turning its findings into permanent instructions.
- Run `node --test scripts/ui-guidance.test.mjs` for documentation/harness routing and inventory checks, then the repository rules. These checks establish discoverability and coverage, not visual compliance.
