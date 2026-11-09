# H1 organisation access mockups

9 November 2026 · **Proposals pending maintainer review** for `h1-organisation-access` / UJ-01. These are documentation fixtures, not production screenshots or an approved OpenSpec change. D-21 is confirmed; interaction details below remain proposed. All identities and organisations are fictional.

Open [access-states.html](../../../../prototypes/frontend/access-states.html) directly, or serve `prototypes/frontend` with `python3 -m http.server 4173 --bind 127.0.0.1`. Choose a fixture through **Review states** or `?state=`. The public signed-in and admin-session fixtures start with the account disclosure open; Enter/Space toggles it and Escape closes it. The create form validates and simulates a result in memory; no network, storage, credentials or real permissions are involved. Other actions navigate to named review fixtures or explain their intended behaviour.

| State | Query value | 1440 px desktop | 390 px mobile |
| --- | --- | --- | --- |
| [Public navigation · signed out](../../../../prototypes/frontend/access-states.html?state=public-signed-out) | `public-signed-out` | [Desktop](access-public-signed-out-desktop.png) | [Mobile](access-public-signed-out-mobile.png) |
| [Public navigation · signed in](../../../../prototypes/frontend/access-states.html?state=public-signed-in) | `public-signed-in` | [Desktop](access-public-signed-in-desktop.png) | [Mobile](access-public-signed-in-mobile.png) |
| [Sign-in · redirecting](../../../../prototypes/frontend/access-states.html?state=sign-in-redirecting) | `sign-in-redirecting` | [Desktop](access-sign-in-redirecting-desktop.png) | [Mobile](access-sign-in-redirecting-mobile.png) |
| [Sign-in · returning](../../../../prototypes/frontend/access-states.html?state=sign-in-returning) | `sign-in-returning` | [Desktop](access-sign-in-returning-desktop.png) | [Mobile](access-sign-in-returning-mobile.png) |
| [Sign-in · failed](../../../../prototypes/frontend/access-states.html?state=sign-in-failed) | `sign-in-failed` | [Desktop](access-sign-in-failed-desktop.png) | [Mobile](access-sign-in-failed-mobile.png) |
| [Sign-in · cancelled](../../../../prototypes/frontend/access-states.html?state=sign-in-cancelled) | `sign-in-cancelled` | [Desktop](access-sign-in-cancelled-desktop.png) | [Mobile](access-sign-in-cancelled-mobile.png) |
| [Account not assigned to Herald](../../../../prototypes/frontend/access-states.html?state=not-assigned) | `not-assigned` | [Desktop](access-not-assigned-desktop.png) | [Mobile](access-not-assigned-mobile.png) |
| [Create organisation · empty](../../../../prototypes/frontend/access-states.html?state=onboarding) | `onboarding` | [Desktop](access-onboarding-desktop.png) | [Mobile](access-onboarding-mobile.png) |
| [Create organisation · name required](../../../../prototypes/frontend/access-states.html?state=name-required) | `name-required` | [Desktop](access-name-required-desktop.png) | [Mobile](access-name-required-mobile.png) |
| [Create organisation · name too long](../../../../prototypes/frontend/access-states.html?state=name-too-long) | `name-too-long` | [Desktop](access-name-too-long-desktop.png) | [Mobile](access-name-too-long-mobile.png) |
| [Create organisation · submitting](../../../../prototypes/frontend/access-states.html?state=creating) | `creating` | [Desktop](access-creating-desktop.png) | [Mobile](access-creating-mobile.png) |
| [Create organisation · failed save](../../../../prototypes/frontend/access-states.html?state=create-failed) | `create-failed` | [Desktop](access-create-failed-desktop.png) | [Mobile](access-create-failed-mobile.png) |
| [Organisation created · owner context](../../../../prototypes/frontend/access-states.html?state=created) | `created` | [Desktop](access-created-desktop.png) | [Mobile](access-created-mobile.png) |
| [Admin shell · active session](../../../../prototypes/frontend/access-states.html?state=admin-session) | `admin-session` | [Desktop](access-admin-session-desktop.png) | [Mobile](access-admin-session-mobile.png) |
| [One organisation · no selector](../../../../prototypes/frontend/access-states.html?state=one-organisation) | `one-organisation` | [Desktop](access-one-organisation-desktop.png) | [Mobile](access-one-organisation-mobile.png) |
| [Several organisations · selector](../../../../prototypes/frontend/access-states.html?state=organisation-selector) | `organisation-selector` | [Desktop](access-organisation-selector-desktop.png) | [Mobile](access-organisation-selector-mobile.png) |
| [Organisation · switching](../../../../prototypes/frontend/access-states.html?state=switching) | `switching` | [Desktop](access-switching-desktop.png) | [Mobile](access-switching-mobile.png) |
| [Organisation · switched](../../../../prototypes/frontend/access-states.html?state=switched) | `switched` | [Desktop](access-switched-desktop.png) | [Mobile](access-switched-mobile.png) |
| [Organisation changed in another tab](../../../../prototypes/frontend/access-states.html?state=context-replaced) | `context-replaced` | [Desktop](access-context-replaced-desktop.png) | [Mobile](access-context-replaced-mobile.png) |
| [Membership removed · landing](../../../../prototypes/frontend/access-states.html?state=access-lost) | `access-lost` | [Desktop](access-access-lost-desktop.png) | [Mobile](access-access-lost-mobile.png) |
| [Membership removed · rejected write](../../../../prototypes/frontend/access-states.html?state=write-rejected) | `write-rejected` | [Desktop](access-write-rejected-desktop.png) | [Mobile](access-write-rejected-mobile.png) |
| [Session expired during work](../../../../prototypes/frontend/access-states.html?state=session-expired) | `session-expired` | [Desktop](access-session-expired-desktop.png) | [Mobile](access-session-expired-mobile.png) |
| [Account recovery · support next action](../../../../prototypes/frontend/access-states.html?state=recovery) | `recovery` | [Desktop](access-recovery-desktop.png) | [Mobile](access-recovery-mobile.png) |
| [Generic private denial](../../../../prototypes/frontend/access-states.html?state=private-denied) | `private-denied` | [Desktop](access-private-denied-desktop.png) | [Mobile](access-private-denied-mobile.png) |

## Relationship to existing patterns

The creation composition refines `review-states.html?state=onboarding` and `journeys.html?step=access`: the creator becomes the single owner under confirmed D-21. Older examples still contain historical “proposed” wording and are not the access review authority. The new generic denial reuses `private-denied`'s unavailable-page wording without naming an organisation, tournament, entrant or confirming existence; support is the platform operator rather than an unknown organiser. `context-replaced` follows the existing shell pattern: a reload notice and only the new organisation's context. The one-organisation fixture has no switch control; creation of another organisation remains available.

Assigned-only sign-in is separate from Herald membership. The unassigned fixture has no Organise or creation path, including in its account disclosure. No email is used as a display identity or key. Recovery starts with the provider, then a recorded support verification/relink; it does not reset passwords, merge identities or copy permissions. No H2 collaborator invitation flow is added.

## Capture and validation scope

The [manifest](manifest.json) records the source URL, viewport, SHA-256 and checks for each of 48 full-page PNGs. Desktop: 1440 × 1000; mobile: 390 × 844; device scale 1. Captured with installed Google Chrome through Playwright, directly from local files, using local assets and the system sans-serif fallback. Opened all captures in labelled contact sheets for visual inspection; detailed inspection concentrated on account menus, forms, switching, retained input and recovery.

Every capture passed document horizontal-overflow and page-error checks. Computed text colours were checked against their nearest opaque surface, including expanded account menus: no normal-text pair below 4.5:1 or large-text pair below 3:1. Controls in captured states met the 44 px height target. Text status labels do not rely on colour. The first pass exposed white account-menu text on white; the corrected surface-specific foreground is included in all final captures. The Inter font warning from the design detector is retained because the visual direction explicitly prescribes Inter with a system fallback.

Exercised required-name and overlong-name validation, retained typed name in the creation simulation, keyboard account disclosure, Escape closure/focus restoration. These checks are scoped to mockups. Screen-reader announcements, OS/browser combinations, clipboard permission, real sign-in redirects, draft restoration after provider navigation, authorisation, concurrency and actual disposal of private data were not verified. The fixture expresses those behaviours for review; it does not implement them. No production tests or OpenSpec files were changed.

## Design review

Independent finish review: **ship as a visual review proposal**. The documentation handoff subsequently confirmed the coverage README and inventory links. Account-menu links deliberately load independent named snapshots, including the single-organisation Northside example; they do not preserve the current fixture's organisation as a real application would.

Refactoring UI diagnostic: **9/10 (7 of 8 checks)** at this mockup scope. Hierarchy survives representative grayscale/blur inspection; whitespace, scale, constrained text, contrast and overlay depth pass. Field labels remain as prominent as values in the creation form; the remaining diagnostic improvement is to de-emphasise labels relative to entered values during component refinement. This is not a production accessibility score. Access compositions retain the incumbent neutral admin-style canvas (`#F3F4F6`); the public content canvas mapping (`#FAFBFC`) should be settled with the actual shell composition.

## Interaction assumptions to confirm in the proposal

- **Name validation:** required after trimming, maximum 80 JavaScript string units; no uniqueness rule. Confirm the limit, Unicode counting and duplicate-name handling.
- **Sign-in return:** return to the intended task only after assignment and membership checks. The returning fixture assumes a newcomer; existing owners would enter their valid context. Retry/status controls manually advance static snapshots; no real timing is asserted.
- **Draft retention:** retain only the person's unsaved input in the current tab on expiry or rejected write, hide all loaded private data, offer copying, and never automatically resubmit. Revalidate membership and current data before restoring a task. Confirm retention lifetime and whether entered text may itself be too sensitive to re-show after revocation.
- **Organisation switch:** explicit selection replaces private context and pending requests; another-tab change reloads this tab. Confirm warning/copy options for unsaved edits before a deliberate switch, and the treatment of drafts on other-tab reloads.
- **Support:** use the contact supplied in the invitation; there is no invented support address. Confirm that channel, accepted ownership evidence and the recorded relink procedure. “Use another account” assumes a provider account-selection/sign-out hand-off.
