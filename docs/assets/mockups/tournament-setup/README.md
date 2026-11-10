# H1 tournament setup mockups

10 November 2026 · **Proposals pending maintainer review** for `h1-tournament-setup`. These deterministic documentation fixtures are review material and **approve no product default**. They implement no production behaviour and do not constitute an OpenSpec change. Names, configurations and dates are fictional examples.

Open [tournament-setup-states.html](../../../../prototypes/frontend/tournament-setup-states.html) directly from the file system. There is no build step or network dependency. Alternatively, serve `prototypes/frontend` using `python3 -m http.server 4173 --bind 127.0.0.1`. Select a snapshot through **Review states** or `?state=`. An unknown state falls back to `list-empty`.

| State | Query value | Desktop 1440 px | Mobile 390 px |
| --- | --- | --- | --- |
| [Tournament list · empty](../../../../prototypes/frontend/tournament-setup-states.html?state=list-empty) | `list-empty` | [Desktop](tournament-setup-list-empty-desktop.png) | [Mobile](tournament-setup-list-empty-mobile.png) |
| [Tournament list · populated](../../../../prototypes/frontend/tournament-setup-states.html?state=list-populated) | `list-populated` | [Desktop](tournament-setup-list-populated-desktop.png) | [Mobile](tournament-setup-list-populated-mobile.png) |
| [Tournament list · loading](../../../../prototypes/frontend/tournament-setup-states.html?state=list-loading) | `list-loading` | [Desktop](tournament-setup-list-loading-desktop.png) | [Mobile](tournament-setup-list-loading-mobile.png) |
| [Tournament list · failed](../../../../prototypes/frontend/tournament-setup-states.html?state=list-failed) | `list-failed` | [Desktop](tournament-setup-list-failed-desktop.png) | [Mobile](tournament-setup-list-failed-mobile.png) |
| [New individual draft · empty](../../../../prototypes/frontend/tournament-setup-states.html?state=create-individual) | `create-individual` | [Desktop](tournament-setup-create-individual-desktop.png) | [Mobile](tournament-setup-create-individual-mobile.png) |
| [Individual draft · saved](../../../../prototypes/frontend/tournament-setup-states.html?state=edit-individual-draft) | `edit-individual-draft` | [Desktop](tournament-setup-edit-individual-draft-desktop.png) | [Mobile](tournament-setup-edit-individual-draft-mobile.png) |
| [Team draft · saved](../../../../prototypes/frontend/tournament-setup-states.html?state=edit-team-draft) | `edit-team-draft` | [Desktop](tournament-setup-edit-team-draft-desktop.png) | [Mobile](tournament-setup-edit-team-draft-mobile.png) |
| [Draft · publication blocked](../../../../prototypes/frontend/tournament-setup-states.html?state=draft-incomplete) | `draft-incomplete` | [Desktop](tournament-setup-draft-incomplete-desktop.png) | [Mobile](tournament-setup-draft-incomplete-mobile.png) |
| [Team draft · validation errors](../../../../prototypes/frontend/tournament-setup-states.html?state=validation-errors) | `validation-errors` | [Desktop](tournament-setup-validation-errors-desktop.png) | [Mobile](tournament-setup-validation-errors-mobile.png) |
| [Draft · saving](../../../../prototypes/frontend/tournament-setup-states.html?state=saving) | `saving` | [Desktop](tournament-setup-saving-desktop.png) | [Mobile](tournament-setup-saving-mobile.png) |
| [Draft · save failed](../../../../prototypes/frontend/tournament-setup-states.html?state=save-failed) | `save-failed` | [Desktop](tournament-setup-save-failed-desktop.png) | [Mobile](tournament-setup-save-failed-mobile.png) |
| [Draft · revision conflict](../../../../prototypes/frontend/tournament-setup-states.html?state=revision-conflict) | `revision-conflict` | [Desktop](tournament-setup-revision-conflict-desktop.png) | [Mobile](tournament-setup-revision-conflict-mobile.png) |
| [Individual · publication preview](../../../../prototypes/frontend/tournament-setup-states.html?state=preview-individual) | `preview-individual` | [Desktop](tournament-setup-preview-individual-desktop.png) | [Mobile](tournament-setup-preview-individual-mobile.png) |
| [Team · publication preview](../../../../prototypes/frontend/tournament-setup-states.html?state=preview-team) | `preview-team` | [Desktop](tournament-setup-preview-team-desktop.png) | [Mobile](tournament-setup-preview-team-mobile.png) |
| [Draft · publishing](../../../../prototypes/frontend/tournament-setup-states.html?state=publishing) | `publishing` | [Desktop](tournament-setup-publishing-desktop.png) | [Mobile](tournament-setup-publishing-mobile.png) |
| [Draft · publication failed](../../../../prototypes/frontend/tournament-setup-states.html?state=publish-failed) | `publish-failed` | [Desktop](tournament-setup-publish-failed-desktop.png) | [Mobile](tournament-setup-publish-failed-mobile.png) |
| [Published individual · configuration](../../../../prototypes/frontend/tournament-setup-states.html?state=published-individual) | `published-individual` | [Desktop](tournament-setup-published-individual-desktop.png) | [Mobile](tournament-setup-published-individual-mobile.png) |
| [Published team · configuration](../../../../prototypes/frontend/tournament-setup-states.html?state=published-team) | `published-team` | [Desktop](tournament-setup-published-team-desktop.png) | [Mobile](tournament-setup-published-team-mobile.png) |

## Scope and source authority

Sources: [CP-01, §5.1 publication, F-02 and §7.2/D-04](../../../herald-functional-discovery.md), [visual direction](../../../herald-visual-direction.md), the [access prototype](../../../../prototypes/frontend/access-states.html), and the [task brief](../../../../.prompts/h1-tournament-setup-mockups.md).

The page loads `style.css` tokens, the access composition stylesheet and a scoped setup stylesheet. The shell follows the 10 November §9.3 refinements: graphite rail, accent brand dot, unboxed organisation name/role, Switch organisation link even with one organisation, navigation divider and quiet account disclosure. Tournaments is the selected destination. The mobile shell retains organisation identity and navigation above the stacked content. No shared stylesheets or existing access fixtures were changed.

Publication, registration and competition are separate labels. Publishing leaves registration not open; it creates no entries, pairings or play. Published configuration remains editable. No unpublish, registration-opening, entry-management, pairing, cancellation, archival, public-page or visibility-change flow is drawn. The visibility field is part of configuration, with no invented confirmation or transition policy. Individual forms and previews show no roster or lineup fields. Team capacity is in teams, with roster minimum, maximum and active players per side separate. The profile is fixed and read-only: Single round-robin · 3 / 1 / 0.

The generic game/variant is invented. Example organisation/person/tournament names are reused from access/journey fixtures: Northside Gaming, Alex Morgan, Saturday Open and Saturday Team League. List rows distinguish repeated Saturday Open names with their dates and publication labels. Published row dates/capacities match their configuration fixtures.

## Interaction model

Snapshots are independent examples, just as in the access set. Links choose a named snapshot; they do not submit or carry typed configuration between pages. The team preview and published-team states are reviewed directly through the state navigator; publishing/failure use the individual example. A real successful publication would return to the matching published tournament, after confirmation; this prototype does not perform that operation.

The entry-kind select reveals/hides team fields and changes the capacity unit without clearing other input. Online mode hides the on-site venue input. Missing-field/error-summary links focus their fields. Errors are associated with the affected controls. Save/retry and conflict controls explain the intended action in a status region while retaining input; Reload latest intentionally does not destroy or replace the local values. Busy states prevent repeat submissions, keep input visible and do not claim success. Enter/Space toggles native disclosures; Escape closes them and restores summary focus. The missing-fields Publish control and unavailable preview explain their blockers.

## Provenance and verification

The [manifest](manifest.json) records all 36 PNGs, each local source URL, viewport, full-page setting, SHA-256 and capture checks. Method mirrors access: Playwright Core with installed Google Chrome, headless, direct `file://` navigation, device scale 1, local assets and system sans-serif fallback. Desktop viewport: **1440 × 1000**; mobile: **390 × 844**. Browser locale is en-GB and reference browser time zone Europe/Madrid; native date-input presentation remains browser-dependent. PNGs are full-page, so image height can exceed viewport height.

All captures were checked for page errors, HTTP requests, horizontal document overflow, computed text/surface contrast, 44 px target height, associated field labels and duplicate IDs. The checks include input/select text, and a 3 px visible keyboard-focus outline was exercised. Field-summary focus, team toggling with retained title, online mode, retry retention, conflict explanation and keyboard account disclosure were exercised. All images were opened in labelled contact sheets; full-resolution inspection concentrated on configuration errors and preview summaries. The first inspection identified the older demo's mobile `.rail` hiding rule; the scoped stylesheet now explicitly preserves the rail.

Limitations: this is visual material, not a provider/server/application test. Screen-reader output, additional browsers, real revision reconciliation, server-side validation, receipts and persistence have not been verified. Disabled/busy controls and text contrasts are checked at this fixture scope; this is not a WCAG compliance certification. The design detector's Inter warning is accepted under the existing font contract; its repeating-gradient advisory comes from unused legacy styles imported with `style.css`, not a rendered setup surface.

## Design review

Independent finish disposition: **ship as documentation mockups pending maintainer review**. No material visual defect required fixing or recapturing in the inspected sample. The long mobile form remains an explicit composition choice for review, not a claim of approved workflow design.

Refactoring UI diagnostic: **10/10 (8 of 8 rows)** at this mockup scope. Representative list grayscale/blur checks retained hierarchy; whitespace, secondary labels versus darker values, documented spacing, constrained text, checked contrast and restrained overlay elevation passed. This score does not certify production behaviour or accessibility. Review inspected source and representative full-resolution desktop list/team preview, mobile incomplete/validation/published-team and native-size error crops alongside the capture checks.

## Visual decisions the source does not settle

- **All form states:** one scrollable form grouped into details, team structure when applicable, fixed profile, dates/location, and admission/visibility; two columns on desktop and one on mobile. Actions follow the fields rather than using a sticky overlay. Labels are secondary to entered values.
- **list-populated:** stacked operational rows rather than a table, keeping three lifecycle labels and capacity readable on mobile. Two Saturday Open examples are distinguished by date. Draft capacity 16 individual entries; published individual 8 entries; team 16 teams are illustrative values.
- **create-individual:** only the requested individual kind and fixed profile are preselected. Other fields are empty, including time zone, admission, check-in and visibility; no product defaults are inferred. Venue is shown while no location mode has been chosen, and hidden for Online.
- **draft-incomplete / validation-errors:** persistent summary before the form, field links and unavailable publication/preview with explicit reasons. The example rejects capacity below two for publication; partial drafts can still be saved. Registration closure is shown as invalid when later than the planned start; equality and other date rules remain specification decisions.
- **saving / publishing:** static progress copy with repeat submission prevented, no decorative animation or invented elapsed time. The list-loading state uses the existing static progress treatment.
- **save-failed / revision-conflict:** retained input stays editable. Reload latest explains a deliberate fetch/reconciliation step; the source does not settle a diff layout or draft export mechanism, so neither is invented here.
- **preview-individual / preview-team:** read-only definition lists instead of drawing the public page. Public and Private examples spell out their meaning; Unlisted remains available in the form. Manual admission and mandatory check-in are sample selections, not defaults. Preview-team uses a 5–7 roster with 5 active players per side.
- **published-individual / published-team:** header facts followed by editable configuration with Save changes. The source does not settle material-change announcements or visibility-change policy, so no such flow or Start tournament action is included.
