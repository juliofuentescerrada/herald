**Approved for implementation on 12 November 2026** (gate 1.1), by the maintainer, with the icon table and empty-state size reviewed below.

**Reviewed on 12 November 2026:** the maintainer accepted design D-1's icon table and D-2's 32 px empty-state size, and added the drawers' back buttons (R-1).

## Why

Visual direction §4 confirms Tabler outline icons for Herald's application, and `ui` already wraps them (`herald-icon`), but the admin application uses icons only in field errors, notices, toasts, the account menu and the organisation switch. Navigation, statuses, links and empty states are text only, so they are slower to scan. The maintainer asked for icons in those four places on 12 November 2026.

## What Changes

- The admin rail's navigation items carry an icon before their label (24 px), on desktop and in the mobile bar.
- Status labels can carry an icon (16 px) chosen by their meaning: tournament lifecycle labels (publication, registration, competition) and check-in labels.
- Text links and link buttons that go back or to a related page carry an icon: "Back to …" (arrow), including the drawers' "Back to entries" and "Back to roster" buttons, and "View entries" / "Entries" (people).
- The panel empty states ("No tournaments yet", "No entries yet") carry a larger icon above their heading.
- Every one of these icons is decorative: accessible names and visible text do not change. Actions (Add, Check in, Cancel entry, Save, Publish…) do not get icons in this change.
- No new mockups: `design.md` holds the table of each place and its Tabler icon for review before implementation, and the implementation is reviewed by before/after captures (the maintainer's decision, 12 November 2026).

## Capabilities

### New Capabilities

- `interface-icons`: which admin elements carry an icon, the icon's size and its accessibility, and that icons never replace text.

### Modified Capabilities

None. `page-layout` and `feedback-and-confirmation` keep their requirements; the icons added to notices and toasts before this change are unchanged.

## Impact

- `web/projects/ui`: new icons in the `herald-icon` registry; `StatusLabel` and `NavLink` take an optional icon; an empty-state icon size (design D-2). The catalogue shows them.
- `web/projects/admin`: the shell rail, the tournament list, the configuration form, the entries page, the roster drawer and the access page.
- No backend, API, contract or data change. No new dependency (`@tabler/icons-angular` is installed).
- Screens modified, mockups not applicable (maintainer, 12 November 2026): the admin shell on every page; the tournament list (populated, empty); the configuration form; the entries page (populated, empty, team, cancelled history); the roster drawer; the access page. The public application is out of scope.
- Decision register: none. This is a visual contract under visual direction §4, which is updated with the empty-state size.
- Notifiable facts: none (ADR 0017).
