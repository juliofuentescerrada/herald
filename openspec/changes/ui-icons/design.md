## Context

Visual direction §4 confirms Tabler outline icons with a consistent stroke at 20 px for controls, 24 px for navigation and 16 px for compact metadata, an 8 px icon-to-label gap, decorative icons hidden from assistive technology and visible labels on consequential actions. `ui` already has `herald-icon` (`web/projects/ui/src/lib/icon.ts`): a registry of twelve icons that only `ui` imports from `@tabler/icons-angular`, with those three sizes. The admin application uses it in field errors, notices, toasts, the account menu and the organisation switch. The maintainer chose on 12 November 2026 to add icons to navigation, status labels, links and empty states, but not to actions.

## Visual input

No new mockups (maintainer, 12 November 2026): the mockups are generated without icons. The review material is the table below, read before implementation, and before/after captures of each screen at 1440 and 390 px after it. The existing screens' mockups stay the reference for everything but the icons.

| Screen | States captured before and after |
|---|---|
| Admin shell (rail and mobile bar) | Any workspace page, desktop and mobile |
| Tournament list | Populated with draft and published rows; empty |
| Configuration form | Published with registration open |
| Entries page | Individual with check-ins and a cancelled history open; empty; team |
| Roster drawer | Open on a team |
| Access page | Denied |
| `ui` catalogue | Controls page |

## Goals / Non-Goals

**Goals:**

- The four places the maintainer chose carry icons from one reviewed table, through the existing `herald-icon`.
- No accessible name, visible text or status meaning changes; icons are decorative.

**Non-Goals:**

- Icons on actions (Add, Check in, Undo check-in, Roster, Cancel entry, Admit, Save, Publish, registration actions): a later change if wanted.
- The public application, and the icons already on notices, toasts, field errors, the account menu and the organisation switch.
- New mockups.

## Decisions

### D-1 The icon table

Each icon is a Tabler outline icon, added to the `ui` registry under its Tabler name.

| Place | Text | Icon | Size |
|---|---|---|---|
| Rail navigation | Overview | `layout-dashboard` | navigation (24) |
| Rail navigation | Tournaments | `trophy` | navigation (24) |
| Status label | Draft | `pencil` | metadata (16) |
| Status label | Published | `world` | metadata (16) |
| Status label | Registration not open | `clock` | metadata (16) |
| Status label | Registration open | `door-enter` | metadata (16) |
| Status label | Registration closed | `lock` | metadata (16) |
| Status label | Preparing | `hourglass` | metadata (16) |
| Status label | Checked in | `circle-check` | metadata (16) |
| Status label | Check-in pending | `circle-dashed` | metadata (16) |
| Text link | Back to tournaments / configuration | `arrow-left` | metadata (16) |
| Link button | Back to tournaments, Back to public page | `arrow-left` | control (20) |
| Link button | View entries, Entries | `users` | control (20) |
| Drawer button | Back to entries, Back to roster | `arrow-left` | control (20) |
| Empty panel | No tournaments yet | `trophy` | empty state (32) |
| Empty panel | No entries yet | `users` | empty state (32) |

"Back to entries" and "Back to roster" in the roster and add drawers are buttons that close a drawer, not links; the maintainer chose to give them the back arrow too (R-1, 12 November 2026), so every "Back to …" reads the same.

### D-2 Empty-state size

Visual direction §4 has no size for an empty state's icon. A fourth size, `empty` at 32 px, is added to `herald-icon`, used only above an empty panel's heading, in the secondary text colour. Alternative rejected: the navigation size (24 px), which reads as a list item rather than a panel's illustration. §4 gains the size on implementation.

### D-3 Where the icon is chosen

- `NavLink` and `StatusLabel` take an optional `icon` input of type `IconName` and render it before their content; the caller names the icon. No tone-to-icon mapping in `ui`: the meaning, not the colour, picks the icon (§3.1).
- The admin's `lifecycleLabels` returns each label's text with its icon, so the list, the configuration form and the entries page share one mapping. The check-in labels name theirs in the entries page.
- Links and empty panels put `<herald-icon>` in the template, as the account menu does.

### D-4 Accessibility

Every icon in this change is decorative (`herald-icon` without a label sets `aria-hidden`). Accessible names stay as they are, so no journey or unit test changes its locators. Status labels keep their text; an icon alone never carries a status (§4). The axe checks of the existing page specs cover the modified screens.

### D-5 Tests

- `ui` specs: `StatusLabel` and `NavLink` render the given icon before their content, hidden from assistive technology; the `empty` size.
- Admin page specs: each scenario of `interface-icons`, located by the icon's `data-icon` attribute (added to `herald-icon` for tests) beside its unchanged text.
- No new e2e journey: no new user-visible flow. The test script captures the shell, list and entries with icons for the maintainer's round.

## Risks / Trade-offs

- [Icons crowd the row's labels on narrow screens] → 16 px with the 8 px gap; the captures at 390 px show whether labels wrap more, and the maintainer decides on them.
- [Icon meaning is a matter of taste] → the table is reviewed before implementation, and an icon is a one-line change in the registry.
- [The admin's initial bundle is already over its 900 kB budget warning] → each Tabler icon is a small tree-shaken component; the bundle is measured before and after and recorded here.

## Open Questions

None. Answered by the maintainer on 12 November 2026:

- R-1: the drawers' "Back to entries" and "Back to roster" buttons get the back arrow (D-1's table).
- R-2: the icon table and D-2's 32 px empty-state size are accepted.

## Validation

Full run on 12 November 2026 (task 4.2):

- `scripts/check all`: rules, the web steps and 339 of 340 .NET tests pass. The one failure, `LocalSeedingTests.Without_an_object_id_…`, comes from the machine: the AppHost's user secrets set `seed-object-id`, which the test expects unset. It does not touch this change, and CI has no such secret.
- e2e suite: 16 passed; test scripts: 3 passed.
- Admin initial bundle (`ng build admin`, production): 946.89 kB raw, 233.46 kB transfer on `main` before the change; 950.56 kB raw, 234.28 kB transfer after it. The icons add 3.67 kB raw (0.82 kB transfer); the 900 kB budget warning was already exceeded before.

Captures after the change (task 4.3), compared with task 3.0's at 1440 and 390 px for every screen of the Visual input table except the `ui` catalogue:

- Desktop: icons appear where D-1's table puts them, and no row, header or drawer changes its layout; the status labels grow by the icon and the gap and stay on one line.
- Mobile (390 px): the rail's links carry their icons without wrapping. Status labels wrap more often: on the tournament list "Registration not open" moves to its own line (three rows of labels instead of two), and on the team entries page a long team name pushes its check-in label below the name. Labels still read in order and nothing overflows.
- The `ui` catalogue's controls page was not captured before and after; its specs (task 2.2) cover the new inputs.
- The maintainer accepted the extra wrapping on mobile on 12 November 2026.
