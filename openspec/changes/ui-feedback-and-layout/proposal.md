## Status

**Approved for implementation by the maintainer on 11 November 2026.** The decisions below come from the maintainer's run of `h1-entries` through Aspire and the exploration that followed (11 November 2026). Mockups of every affected screen and state were supplied on 11 November 2026 and are referenced in design.md (Visual input); the maintainer reviewed them with this proposal and approved implementation on the same day.

## Why

The maintainer's run of `h1-entries` found the admin application functionally right but visually weak: confirmations open as panels inside the page, an outcome such as "Ellis Stone admitted." stays as text on the page, cancelled entries weigh as much as the ones that need work, and on a desktop screen most pages use a narrow column that leaves much empty space. The visual direction already names dialogs, toasts and a fluid admin width, but no screen implements them and each page chose its own width. Settling the rules now, before more screens exist, keeps future admin screens and the public site consistent.

## What Changes

- **Feedback placement:** an outcome of the person's own action (an entry admitted, changes saved) is announced as a toast that disappears by itself. Errors never go to a toast: a field error stays at its field and in the summary; a failed action started in a dialog or drawer is shown inside it, which stays open; a conflict or a state that blocks actions stays on the page as a persistent notice.
- **Confirmations:** an action with consequences that fits one question and a short input confirms in a modal dialog (cancelling an entry; admitting out of queue order with its reason). A flow of several steps that benefits from keeping the page in view opens in a drawer (adding a player or team). A long review stays a page (review before publishing). Reversible actions without side effects act at once (admitting in order, opening or closing registration).
- **Layout:** three named content widths, `focused` (about 720 px) for one short task, `form` (about 960 px) for long forms and `wide` (fluid, capped at about 1440 px) for operational pages, with a 320 px aside from 1200 px; two breakpoints, 700 and 1200 px; running text kept to about 75 characters per line within any width. Public content is capped at 1200 px with the existing fluid gutter.
- **Visual weight follows actionability:** what has actions or changes comes first at full weight; read-only history is compact, after it and collapsed. On the entries page, cancelled entries are a collapsed, compact group hidden when empty, and the summary says what waits for the owner ("2 pending your decision" with manual admission, "2 waiting for a slot" with automatic).
- **`ui` library:** dialog, drawer and toast controls built on `ng-primitives` (already a dependency), with their catalogue entries; width and breakpoint tokens.
- **Existing screens adopt the rules:** entries page (dialogs, drawer, toasts, `wide` with aside, cancelled collapsed, pending in the summary), tournament configuration (`form` with an aside for registration and entries, "Changes saved" as a toast), tournament list and review, organisation selector and creation, not-found pages, and the public home (1200 px cap). Browser `confirm` prompts inside the application become dialogs.
- **Documents:** `docs/herald-visual-direction.md` records the rules (§4 widths and breakpoints, §5 feedback matrix, control contracts and the actionability rule, §7 and §8 compositions) so future screens and the public site follow them.

Out of scope: tabs within a tournament (§7.1), tables, a public discovery page, "Enter again" on a cancelled entry, confirming registration opening or closing, and any change of product rules.

## Capabilities

### New Capabilities

- `feedback-and-confirmation`: where outcomes and errors are shown (toasts for outcomes only, errors at their origin) and how consequential actions and multi-step flows are confirmed (modal dialog, drawer, page, direct action), in both applications.
- `page-layout`: named content widths, the aside, breakpoints and line length for the admin application; the public content cap; and the rule that visual weight follows actionability.

### Modified Capabilities

- `guest-entries`: the admin entries page confirms in dialogs, adds in a drawer, announces outcomes as toasts, collapses cancelled entries and states pending decisions in its summary.
- `tournament-setup`: a successful save of the configuration is announced as a toast instead of a persistent notice.

## Impact

- `web/projects/ui`: new `Dialog`, `Drawer` and `Toast` controls and a toast service with no app dependencies, catalogue entries and tests; width and breakpoint tokens.
- `web/projects/admin`: shell toast outlet, toasts cleared on a change of organisation or person; the entries and tournaments features and the organisation and not-found pages adopt the widths and controls; browser `confirm` replaced by the dialog.
- `web/projects/public`: toast outlet available to future pages (client-side only); home capped at 1200 px.
- `e2e/`: journeys whose confirmations or outcome messages change are updated; no new journey.
- No API, domain or persistence change.
- Documentation only, added on 11 November 2026: ADR 0017 (notifications consume fact events, proposed) with its inventory of notifiable facts, the matching rule in `CLAUDE.md` and `openspec/config.yaml`, and a pointer from F-10. No notice is published or delivered.
