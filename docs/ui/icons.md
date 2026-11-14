# Icon intent and usage

Status: documentation proposal, 14 November 2026. This is the maintained icon meaning and integration reference. The confirmed family, sizes and geometry are in [visual direction §4](../herald-visual-direction.md#4-typography-space-and-geometry). The initial choices were reviewed in `ui-icons`; the table below brings them into live documentation.

## When to use an icon

Use Tabler outline icons through `Icon` from `@herald/ui`. Icons improve scanning when the same concept recurs; they do not replace the words that explain status, permissions, eligibility or a consequence.

In the admin application, use icons for global navigation, lifecycle/check-in status labels, back links, links to entries and empty panels. Keep ordinary operation buttons text only: Add, Admit, Save, Publish, Check in, Undo check-in, Cancel entry and Roster do not gain decorative action icons. The reviewed exception is a drawer's `Back to entries` / `Back to roster` button, which closes/steps back and carries the back arrow.

Shared notices/toasts keep their existing feedback icons. Account disclosure, mobile menu, organisation switch and dismiss controls keep their functional cues. The public mobile Menu cue already exists; the admin placement rule does not authorise adding a new public icon treatment. Documentation prototypes remain exempt from installing Tabler, as visual direction §4 states.

For the H2 public/participant target, follow [experience patterns](experience-patterns.md): use supporting icons for repeated navigation/metadata only where they improve scanning, with visible labels for unfamiliar meanings and all consequential actions. Keep the same family, scale, stroke, semantics and registry; do not copy the admin rail or imply that a participant has staff powers. Choose any new public event/filter/team/match symbols in the owning reviewed screen proposal and extend the meaning table before implementation. A compact mobile action still needs its visible purpose and adequate target; a live-looking icon is not proof of freshness or delivery.

Choose by meaning: Published is `world`, even if the badge uses a different tone; success green does not automatically mean `circle-check` for every domain state. A new, unknown state keeps its text until a meaning is reviewed. Do not invent a symbol by matching only its colour or visual balance.

## Meaning table

Names are the exact current `IconName` values in the [typed registry](../../web/projects/ui/src/lib/icon.ts). All are outline icons; application code does not import Tabler directly.

| Name | Intended meaning / placement | Pairing |
| --- | --- | --- |
| `alert-circle` | Failed action or field error; default danger notice | Explicit error and recovery text |
| `alert-triangle` | Attention required; default warning notice | Explain the condition, never colour alone |
| `arrow-left` | Back to configuration/tournaments/public page; drawer back exception | Visible `Back to …`; metadata for text links, control for button-style links/back buttons |
| `arrows-exchange` | Switch the working organisation | `Switch organisation`; context owns the switch |
| `chevron-down` | Account/disclosure can be opened | A labelled button with `aria-expanded` |
| `circle-check` | Checked in; default success feedback | `Checked in` or the confirmed outcome text; not universal tournament readiness |
| `circle-dashed` | Check-in pending | Visible pending text |
| `clock` | Registration not open | That lifecycle label; not a claim that opening is scheduled automatically |
| `door-enter` | Registration open | Visible registration state |
| `home` | Home/context cue in the registry/catalogue | Do not substitute it for the reviewed Overview icon |
| `hourglass` | Competition preparing | `Preparing`; a new competition state needs its own reviewed mapping |
| `info-circle` | Neutral explanatory feedback; default information notice/toast | The explanatory message |
| `layout-dashboard` | Workspace Overview destination | `Overview`, navigation size |
| `lock` | Registration closed | Explicit registration text; not a generic permission-denied icon for every surface |
| `menu` | Mobile navigation menu (Tabler `IconMenu2`) | Visible `Menu`, expanded/controls state on the button |
| `pencil` | Draft publication state | `Draft`; not a new edit-action treatment |
| `refresh` | Reload to recover unavailable/stale content | Describe what must reload and keep a labelled recovery action |
| `trophy` | Tournaments destination or empty tournament list | Navigation label; empty illustration above the heading |
| `users` | Entries destination or empty entries panel | `Entries` / `View entries`; empty illustration, without implying a team-only entrant kind |
| `wifi-off` | Offline condition | Text says requests cannot be sent and what happens to input |
| `world` | Published publication state | `Published`; not a claim that a private tournament is publicly discoverable |
| `x` | Close/dismiss, or the open mobile menu's close cue | Name the button, and keep text for consequential leaving actions |

The lifecycle mapping is owned by admin's `lifecycleLabels`; check-in labels are selected by entries. `StatusLabel` does not derive an icon from its tone. Notice/toast tone icons are feedback conventions, not domain mappings.

## Implementation and accessibility

| `IconSize` | Pixels | Use |
| --- | --- | --- |
| `metadata` | 16 | Status labels, compact facts and text back links |
| `control` | 20 | Button-style links, shared feedback/dismiss and normal control cues; default |
| `navigation` | 24 | Workspace navigation |
| `empty` | 32 | Above an empty panel heading, in the secondary text colour |

The icon-to-label gap is the shared 8 px spacing step; the outline stroke is fixed at 1.75 by `Icon`. These are the current registry mappings of the §4 foundations. Do not pass arbitrary pixel sizes or per-screen stroke widths. The clickable target belongs to the parent control and follows the product's target sizing, independent of these visual sizes. Keep empty illustrations distinct from logo or event artwork.

For an icon beside visible text, omit `label`: the SVG is decorative (`aria-hidden="true"`, `focusable="false"`). For a standalone meaningful image, set `label`; `Icon` exposes `role="img"` and its accessible name. This option is not permission to replace required status/action text.

For an icon-only control such as dismiss, put `aria-label` on the native button and keep the icon decorative. Naming the child image alone does not establish the intended button contract. Consequential actions retain visible labels. Tooltips do not replace those labels or the explanation for an unavailable action.

```html
<!-- Decorative; the status text remains the accessible name/content. -->
<herald-status-label icon="clock">Registration not open</herald-status-label>

<!-- A navigation cue chosen by its caller, not by ui routing logic. -->
<a herald-nav-link routerLink="tournaments" icon="trophy">Tournaments</a>

<!-- Existing benign icon-only dismiss pattern. -->
<button type="button" aria-label="Dismiss notification" (click)="dismiss()">
  <herald-icon name="x" />
</button>

<!-- Meaningful image, only when there is no duplicate adjacent label. -->
<herald-icon name="wifi-off" label="Offline" />
```

Use `currentColor` through the surrounding semantic token. Keep adequate contrast against the actual surface and focus on the parent control. Avoid lime icons on white when they carry essential information, emoji, filled/outline mixtures, CSS-generated symbols for domain state and repeated icons on every line of supporting copy. Native disclosure indicators may remain native.

`Icon` isolates its Tabler leaf from hydration to avoid duplicate SVG output. Keep that handling inside `ui`; consumers do not need hydration workarounds. `data-icon` is a stable inspection/testing hook for decorative symbols, not a text alternative.

## Extending the registry

1. Identify the meaning and why existing entries cannot express it. Check that the placement is allowed; a registry entry is not approval to decorate new action categories.
2. Record the proposed meaning, name, size, adjacent text and affected states in the change's design; have any visual choice reviewed through the normal screen process.
3. Import only the selected outline icon in `web/projects/ui/src/lib/icon.ts`, add its typed name and update this meaning table. Keep a single registry and stroke.
4. Add live catalogue examples for the new meaning/size where needed, then verify decorative/labelled semantics, no duplicate hydrated SVG, no extra focus target, label wrapping and bundle impact.
5. Run `node --test scripts/ui-guidance.test.mjs`, relevant `ui`/consumer specs and the synthetic screen checks. Record narrow/wide comparisons in the change's design.

Do not copy an entire external icon catalogue into the repository or claim this documentation implements every future lifecycle symbol.
