# UI component intent and usage

Status: maintained guidance, accepted and checked against the `@herald/ui` [public API](../../web/projects/ui/src/public-api.ts) on 14 November 2026. This is the intent and integration reference; [visual direction §5](../herald-visual-direction.md#5-shared-component-contracts) owns shared visual/state contracts. Import public symbols from `@herald/ui`; `ng-primitives` and Tabler imports belong inside `ui`.

Run the live state catalogue with `cd web && pnpm exec ng serve catalogue --port 4400`, then open `http://localhost:4400`. It is development tooling. The current examples show states, not a complete intent reference; use this document when choosing a control.

The current catalogue records the components needed to date; it is not a closed set or a limit on future designs. Reuse a control when it fits the task, and define a new component when it adds useful behaviour, clarifies an interaction or expresses an intent the existing controls do not cover well. Do not force an unsuitable control into a new purpose merely to stay within today's inventory. New components follow the shared foundations and belong in shared UI or app-local presentation according to their responsibility and reuse.

Select the audience's [experience pattern](experience-patterns.md) first. An organiser's dense operational list and a participant's next-match task can use the same Button, Notice and StatusLabel without sharing the same page hierarchy. Public browsing, account transitions and signed-in participant work must not inherit the admin rail or its permissions from a copied example.

## Choose by intent

| Person's need | Use | Avoid |
| --- | --- | --- |
| Go to another page | Native link; add `Button` for action prominence | A button whose click merely sets a URL |
| Navigate the graphite workspace | `NavLink`, with app-owned routing/current state | `NavLink` as tabs or on a white content surface |
| Execute an operation | Native button with `Button` | A link with no destination |
| Read one fact about state | `StatusLabel` | A clickable badge or live alert |
| Understand a persistent condition/blocker | `Notice` | A short-lived toast for an unresolved problem |
| Learn the outcome of their completed action | `Toasts` and the shell's `ToastOutlet` | Error toasts, progress toasts or remote-event notifications |
| Decide one consequential question | `Dialogs.confirm` for a simple local decision; `Dialog` for a request with busy/error states | A native browser confirm, or closing before a failing request |
| Do contextual work while retaining the page behind | `Drawer` opened by `Dialogs` | A permanent second page column |
| Review many values before publishing | Feature-owned review page | An oversized modal containing the entire configuration |
| Add a supporting visual cue | `Icon` following [icon guidance](icons.md) | Unicode symbols, ad hoc SVG or another icon family |

## Button

**Intent:** make a labelled operation or prominent destination recognisable and consistent. Native element semantics remain the caller's responsibility.

**Choose:** primary for the next operation in an area; secondary for alternatives and repeated row actions; quiet for a low-emphasis option; destructive for the confirming action that destroys/cancels a record. A `Cancel entry` row trigger can be secondary; the confirmation is destructive. Do not turn every row's action into a primary.

**Contract:** selector `button[herald-button], a[herald-button]`; inputs `variant: ButtonVariant = 'secondary'`, `loading: boolean = false`, `disabled: boolean = false`. Project the visible label. Use `type="button"` outside submission and `type="submit"` for the form operation. Use `href` or app-owned `routerLink` on anchors. There is no custom click output; use the native event.

**States:** hover, press and visible keyboard focus come from the primitive. Disabled prevents activation. Loading sets `aria-busy`, keeps focus and blocks repeat clicks while showing progress beside the label. Keep a meaningful visible label and avoid shifting nearby actions when it changes. Explain domain unavailability beside the control; do not replace it with loading. See audit A-04 for the existing loading-width limitation.

**Avoid:** adding icons to ordinary admin actions, permission checks in `ui`, clickable `<div>` elements or a primary button for every choice. A spinner's decorative square is feedback, not a new icon family.

```html
<button herald-button variant="primary" type="submit" [loading]="saving()">Save changes</button>
<button herald-button type="button" [disabled]="blocked()" aria-describedby="admit-reason">Admit</button>
<p id="admit-reason">No free slot. Cancel an admitted entry or increase capacity.</p>
<a herald-button [routerLink]="entriesPath"><herald-icon name="users" />View entries</a>
```

`ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'destructive'`.

## Icon

**Intent:** reinforce an already understandable meaning. Use the reviewed meaning and placement rules in [icon guidance](icons.md), including decorative versus standalone use.

**Contract:** `<herald-icon>`; required `name: IconName`; `size: IconSize = 'control'`; optional `label: string`. Without `label`, its SVG is hidden from assistive technology and is not focusable. With a label it is an image with an accessible name. `data-icon` exists for inspection/tests, not as product copy. The fixed outline stroke and leaf hydration handling belong to `ui`.

**States:** no hover, loading, disabled or pressed state of its own; inherit colour from its surrounding semantic context. State belongs to the parent control/status. Do not attach a click handler to the icon.

**Avoid:** a label on an icon that repeats adjacent text, a standalone icon for a consequential action or direct Tabler imports in a feature.

```html
<herald-icon name="arrow-left" size="metadata" />Back to configuration
<button type="button" aria-label="Dismiss notification"><herald-icon name="x" /></button>
```

`IconName` and `IconSize` are exported types; the [registry and sizes](icons.md#implementation-and-accessibility) are their current supported values.

## NavLink

**Intent:** navigate between major workspace destinations on graphite. A selected item shows the current location, not a toggled preference or a status.

**Contract:** `a[herald-nav-link]`; optional `icon: IconName`. Supply the destination and `aria-current="page"` from app routing (`routerLinkActive` / `ariaCurrentWhenActive`); `ui` imports no router. The icon uses navigation size and is decorative; the text names the link.

**States:** resting, hover, keyboard focus and current page. There are no disabled/loading inputs. If a destination is unavailable, apply the feature's permission policy and explanation rather than inventing a disabled navigation variant.

**Avoid:** light content surfaces, command buttons or assigning `aria-current` to every tournament sub-route. Global destinations and within-tournament navigation have different scopes.

```html
<nav aria-label="Workspace" data-herald-surface="inverse">
  <a herald-nav-link routerLink="tournaments" routerLinkActive
     ariaCurrentWhenActive="page" icon="trophy">Tournaments</a>
</nav>
```

## StatusLabel

**Intent:** communicate a short record fact such as Draft, Registration closed or Checked in. It is passive text, not an action or a transient outcome.

**Contract:** `<herald-status-label>`; `tone: StatusTone = 'neutral'`; optional `icon: IconName`; projected text. The caller chooses the icon by meaning. `ui` sets explicit foreground/background pairs and metadata icon size, without domain logic or a tone-to-status mapping.

**States:** the domain supplies the text/tone/icon; there are no interactive states or live-region announcements. Place lifecycle labels beside the record title and allow the group to wrap. Unknown lifecycle values keep readable text without an invented icon. Individual labels currently stay on one line internally; verify the narrow layout when introducing longer status text.

**Avoid:** using success tone for every published state, conflating lifecycle dimensions or removing text because the icon looks recognisable.

```html
<herald-status-label icon="world">Published</herald-status-label>
<herald-status-label tone="success" icon="circle-check">Checked in</herald-status-label>
```

`StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'`.

## Notice

**Intent:** explain a persistent condition and, when relevant, how to recover. Use information for context, warning for a condition requiring attention, danger for a failed/blocked operation and success for a persistent positive condition. An outcome of the person's completed action normally belongs in a toast.

**Contract:** `<herald-notice>`; `tone: NoticeTone = 'info'`, optional `heading: string`, optional `iconName: IconName`, `dismissible: boolean = false`, `dismissLabel: string = 'Dismiss'`; output `dismissed: void`. Content is projected; a parent decides whether to remove it after dismissal. Supply the recovery action in the content. The heading states what happened and the body states the effect and next action.

**States:** danger is `role="alert"`; other tones are `role="status"`. Default tone icons are in the [meaning table](icons.md#meaning-table); an explicit meaning such as offline/reload may override one. Only make optional context dismissible. A blocker must remain visible while it applies.

The existing organisation-creation landing retains its created notice under the implemented end-to-end journey contract. The general toast rule does not silently remove that specific behaviour; A-03 in the [style guide's dated audit](style-guide.md#start-here) records the contract tension and proposed review. Roster updates have their own no-toast contract below.

**Avoid:** a notice as the only field error, a dismissible unresolved permission/conflict problem or repeated render-driven announcements. A notice's tone never decides business availability.

```html
<herald-notice tone="danger" heading="Entry was not added">
  <p>The request failed. Your input is kept; try again.</p>
  <button herald-button type="button" (click)="retry()">Retry add</button>
</herald-notice>
```

`NoticeTone = 'info' | 'success' | 'warning' | 'danger'`.

## Dialog

**Intent:** focus attention on one consequential decision or short input. Show a question, consequence, explicit confirmation and safe leaving action. Use a page for a substantial configuration review.

**Contract:** `<herald-dialog>`; required `heading: string`; `busy: boolean = false`. Project body content and a sibling element with `heraldDialogActions` for the actions. It must be opened through `Dialogs`, not placed as an always-visible modal in a page. Put `data-herald-initial-focus` on the safe leaving action for a destructive decision.

**States:** default, busy and failed with retry. The primitive traps focus and restores it to the opener. Escape leaves when idle; outside clicks do not close; busy disables dismissal. The feature sets loading/disabled on its own controls and closes only after a successful request. Failure stays inside, with typed input preserved. Layout is centred on wide screens and full width at the bottom on narrow screens.

**Avoid:** closing before awaiting the mutation, forgetting to disable the leaving action while busy, hiding the cause of failure on the background page or stacking several confirmations for a single choice.

```html
<ng-template #cancel let-close="close">
  <herald-dialog heading="Cancel this entry?" [busy]="saving()">
    <p>The entry keeps its history. Entering again puts it at the back of the queue.</p>
    @if (failed()) { <herald-notice tone="danger" heading="Entry was not cancelled">Try again.</herald-notice> }
    <div heraldDialogActions>
      <button herald-button variant="destructive" type="button" [loading]="saving()" (click)="cancelEntry()">Confirm cancellation</button>
      <button herald-button type="button" data-herald-initial-focus [disabled]="saving()" (click)="close()">Keep entry</button>
    </div>
  </herald-dialog>
</ng-template>
```

The feature's `cancelEntry()` closes its saved `DialogRef` after success; the template's `close()` is the leaving action.

## Drawer

**Intent:** contextual multi-step work such as choosing/creating an entrant or inspecting a team's roster while the page stays behind a backdrop. The drawer remains modal; the background is not interactive.

**Contract:** `<herald-drawer>`; required `heading: string`, `busy: boolean = false`; body projection and optional `heraldDialogActions`, opened by `Dialogs.open`. Shares the dialog's modal behaviour. The body is a flow rather than one short description, so label its own fields and sections. Keep draft form state in the feature across retries and transitions.

**States:** loading, empty/search results, edited, duplicates, busy, request failure, conflict, locked/read-only and permission loss as relevant. It occupies the side on wide screens and the whole screen below the breakpoint. Back/Escape leave when idle; outside clicks do not. A feature must confirm discarding typed input where its workflow requires that.

**Avoid:** a drawer for ordinary navigation, silently losing search/form values on a retry or opening a second drawer above the first when the flow can change its current step.

```html
<ng-template #add let-close="close">
  <herald-drawer heading="Add player" [busy]="saving()">
    <!-- Feature-owned labelled fields, results and errors. -->
    <div heraldDialogActions>
      <button herald-button type="button" [disabled]="saving()" (click)="close()">
        <herald-icon name="arrow-left" />Back to entries
      </button>
    </div>
  </herald-drawer>
</ng-template>
```

## Dialogs

**Intent:** open/close the shared modal surfaces consistently, with the initiating context and focus-return target.

**Contract:** inject `Dialogs`. `open(template: TemplateRef<DialogContext>, options?: { trigger?: HTMLElement; viewContainerRef?: ViewContainerRef }): DialogRef`. Pass the clicked trigger and the feature's view container when opening a feature template, as the catalogue does. `DialogContext` supplies `close: () => void`; `DialogRef` supplies `close(): void` and `closed: Promise<void>`, settled after closing and focus restoration. The reference is owned by the feature, not by a global business-state service.

`confirm(options: ConfirmOptions): Promise<boolean>` resolves true only after the confirmation choice. `ConfirmOptions` requires `heading`, `body`, `confirmLabel`, `leaveLabel`; optional `destructive` chooses the confirmation variant. The safe leaving action receives initial focus. This helper closes when the person decides: it has no busy/error API. Use a custom `Dialog` for a request that must remain open through failure/retry.

**Avoid:** `window.confirm`, treating Escape as confirmation or using `confirm()` as if it hosted an asynchronous mutation inside the surface.

```typescript
const discard = await this.dialogs.confirm({
  heading: 'Discard your changes?', body: 'Your unsaved values will be lost.',
  confirmLabel: 'Discard changes', leaveLabel: 'Keep editing', destructive: true,
});
if (discard) this.leaveWithoutSaving();
// For a feature template:
this.surface = this.dialogs.open(this.addTemplate, { trigger, viewContainerRef: this.viewContainerRef });
```

## Toasts

**Intent:** confirm the person's own completed action without interrupting their next task. Page data must also reflect the confirmed outcome.

**Contract:** inject `Toasts`; `show(text: string, tone: ToastTone = 'success'): void`, `dismiss(id: number): void`, `clear(): void`; `toasts` is a read-only signal of `Toast[]` in oldest-first order. `Toast` has readonly `id: number`, `text: string`, `tone: ToastTone`. `ToastTone = 'success' | 'info'`; no error/warning variants. `pause(id)` and `resume(id)` serve outlet interaction; callers normally use only `show`/`clear`.

**States:** at most three, oldest removed first. Exported `toastDuration` is currently 6000 ms; the visual contract requires at least five seconds and pauses while hovered/focused. No toast is created on the server. Clear the stack when person/organisation changes; an outlet's destruction also clears it.

The implemented [team-rosters contract](../../openspec/specs/team-rosters/spec.md) deliberately updates roster additions/removals in the drawer and page readiness without a toast. Preserve that specific workflow exception.

**Avoid:** errors, progress, automatic remote changes, essential instructions, a sole recovery action or old-context notifications carried into a new workspace.

```typescript
// After the server confirmed and the page/query data was updated:
this.toasts.show('Entry added.');
// On identity/organisation replacement:
this.toasts.clear();
```

## ToastOutlet

**Intent:** provide the shell's single accessible toast stack. Features ask the service to show outcomes; they do not create their own outlets.

**Contract:** `<herald-toast-outlet />`, no inputs/outputs. Install once at shell level; the catalogue has its own development shell. The browser renders a polite `role="status"` region, decorative tone icons and labelled dismiss buttons. It reserves bottom space on narrow screens so the stack does not hide primary actions.

**States:** empty (no visible stack), one or several toasts, hovered/focused pause, dismiss/timeout; no server-rendered stack. Verify an open modal does not expose background notifications as interactive content and that the narrow reserve still works with wrapped text.

**Avoid:** one outlet per feature, forcing it into server output or using it as a global event inbox.

```html
<!-- Once, in the shell, after its routed content. -->
<router-outlet />
<herald-toast-outlet />
```

## Native and feature-owned patterns

The visual direction also names contracts that are not exported components. Do not invent imports such as `Field`, `Table` or `Tabs` from `@herald/ui`. Existing forms/lists and app-local composition implement the patterns below. Promote a pattern only through a reviewed change when its responsibility and reuse justify a shared control.

| Pattern | Intent and current use | Required treatment |
| --- | --- | --- |
| Field / select | Collect one value; native input/select/textarea in organisation, tournament and drawer forms | Visible associated label, required status when relevant, help/error IDs, `aria-invalid`, input preservation, appropriate native type; error summary for multi-field forms |
| Filter / search | Narrow a result set without changing its records; guest searches are app-owned | Current query/value visible, loading/no matches/failure distinguished, keyboard access and a way to clear/reset; do not equate no matches with no records |
| Table / operational list | Compare records or work through rows; lists are currently used for entries/tournaments | Semantic headers for real tables, meaningful row identity/actions, retained counts/status at narrow widths; no tiny scaled desktop table |
| Tabs / section navigation | Move between peer sections of one record; future contract | Route links for route navigation; real tab semantics/keyboard behaviour only for in-page panels; no ARIA tab role on ordinary links |
| Entrant identity | Identify an individual/team in context; current entry/roster rows | Stable visible name, explicit kind/context and permission-scoped detail; no roster for individual 1v1 |
| Score / result | Present outcome, cause and pending/effective status; future control | Tabular values with units, pending distinct from effective and correction context; no unsupported production flow implied |
| Pagination | Bound a large list; future contract | Visible range, labelled previous/next, current filters preserved; do not add a dead pagination bar to small current lists |
| Account / organisation context | Show who is acting and which workspace is selected; admin app owns `AccountMenu` and context switching | Clear labels, surface focus, keyboard dismissal/focus return and cache/context replacement; never put identity or permissions into `ui` |
| Empty panel / history disclosure | Explain absence, offer next action where permitted and retain low-weight history | Heading and explanation, reviewed empty icon; distinguish empty/loading/denied; history after active work, count visible while collapsed, no mutation controls |

## Adding or changing a control

Start with the value or intent the new component contributes; the catalogue's current contents are not a restriction against adding it. Document the person's intent, when to choose an alternative, all supported inputs/outputs, projected slots and state ownership. Add a minimal integration example and observable acceptance checks. Check SSR, keyboard, focus, reduced motion and narrow-width behaviour as applicable. Update the live catalogue and this inventory in the same change. An API type or catalogue state alone is not a usage rationale.
