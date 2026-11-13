# Herald visual direction and design system

Version 0.7 · 7 November 2026 · Consolidated visual baseline for review

## 1. Purpose and status

This document translates the functional proposal into a visual direction, shared design foundations and two application experiences: tournament administration and public discovery/participation. It records the confirmed visual constraints, reviewable documentation prototypes and remaining approval gates. It does not approve product defaults or production implementation.

The baseline is `docs/herald-functional-discovery.md` v0.7. Confirmed requirements remain authoritative: individual and team entrants, implicit participation in individual 1v1, scoped permissions, distinct lifecycle dimensions, effective results, and an externally consumable API. The single decision register in discovery §15 distinguishes accepted scope from proposed rules. Wireframes use illustrative data and label pending policies; visual completeness does not settle those decisions.

The maintainer's visual direction is contemporary video-game competition and sport: neutral surfaces, strong hierarchy and one intense contrasting accent. Administration retains the proposed compact operational layout. The public experience uses more expressive composition within the same modern identity. The existing illustrated repository wordmark is not a visual constraint for this proposal; the initial mockups use a typographic HERALD wordmark without redesigning or deleting the existing asset.

## 2. Direction: contemporary competition

Herald should feel like a credible competition platform: graphite, crisp white, restrained grey and electric lime. The character comes from confident sans-serif typography, decisive spacing, clear scores and competition-focused imagery. The public experience is energetic; administration is calm and operational.

The proposed accent is electric lime, subject to visual review. It contrasts strongly with graphite and uses dark text on filled controls. Do not use lime as small text on white, as a faint form boundary or as a synonym for every successful status. Photographic/event artwork may add colour without replacing the primary visual identity.

The design has one shared system with experience-specific compositions. Admin and public are usage contexts, not two global security roles. The same user may browse, play, captain and direct. Authorisation determines actions; the selected workspace determines presentation. Public browsing does not require an account. A signed-in player still uses the public-facing experience for their next action.

| Aspect | Administration | Public and participant experience |
| --- | --- | --- |
| Primary job | Understand status and resolve operational work | Find a suitable event and know what to do next |
| Composition | Charcoal navigation rail, content header, operational tables | Top navigation, bold competition headline, event imagery and focused detail |
| Density | Compact but readable | Comfortable with stronger display hierarchy |
| Typography | Sans-serif throughout operational content | The same sans-serif family with heavier, larger display headings |
| Imagery | None required for core operations | Contemporary esports/sport or abstract competition imagery, never required for essential information |
| Main emphasis | Pending work, validation blockers, explicit actions | Tournament identity, schedule, eligibility and next action |
| Accent usage | Concentrated on the primary action and selected context | Stronger blocks of accent against graphite, with restrained supporting use |
| Mobile priority | Current round and unresolved incidents | Registration state and next match |
| Shared foundation | Colour semantics, controls, focus, feedback, terminology, status models | Same |

Administration uses light neutral content with a graphite navigation rail. Public discovery uses a graphite opening section and neutral light listing content, with electric lime as a controlled visual anchor. These are compositions, not an implicit light/dark theme toggle. A full dark theme is deferred until every component has its own tested theme mapping.

## 3. Colour foundations

The following are initial reference values. Semantic tokens, rather than raw colours, are consumed by components. Verify final combinations against their intended size and state before implementation.

| Primitive | Value | Role |
| --- | --- | --- |
| Ink 950 | `#171A1E` | Primary text, navigation rail and public masthead |
| Ink 700 | `#3F4650` | Secondary emphasis |
| Ink 600 | `#5E6673` | Secondary copy |
| Neutral 50 | `#FAFBFC` | Public light canvas |
| Neutral 100 | `#F3F4F6` | Admin canvas and neutral background |
| Surface | `#FFFFFF` | Tables, fields and elevated surfaces |
| Line | `#D8DDE4` | Non-interactive dividers and surface separation |
| Control line | `#747D89` | Input and neutral-button boundaries on light surfaces |
| Inverse control line | `#AEB6C0` | Control boundaries on graphite |
| Volt 400 | `#C7F23A` | Primary action and selected emphasis |
| Volt 500 | `#B4DD28` | Primary hover/pressed candidate |
| Volt 50 | `#F1F9D8` | Pale accent background |
| Teal 700 | `#236F69` | Informational/live accent |
| Success 700 | `#246141` | Positive completion feedback |
| Warning 800 | `#805400` | Action required or readiness warning |
| Danger 700 | `#A12632` | Destructive actions and unresolved critical issues |
| Focus | `#2559C3` | Keyboard focus indicator on light surfaces |
| Inverse focus | `#9DBBFF` | Keyboard focus indicator on graphite |

Electric lime is the brand/action accent, with graphite text on lime-filled controls. Danger red remains a semantic error/destructive colour with distinct labels and icons. Success green, warning amber and informational teal have separate meanings. Lime is not a small-text colour on white and does not replace the visible focus ring.

### 3.1 Semantic tokens

| Token | Initial mapping |
| --- | --- |
| `color.canvas.admin` | Neutral 100 |
| `color.canvas.public` | Neutral 50 |
| `color.surface.default` | Surface |
| `color.surface.inverse` | Ink 950 |
| `color.text.primary` | Ink 950 |
| `color.text.secondary` | Ink 600 |
| `color.text.inverse` | White |
| `color.action.primary` | Volt 400 |
| `color.action.primary.hover` | Volt 500 |
| `color.action.primary.text` | Ink 950 |
| `color.brand.accent` | Volt 400 |
| `color.border.default` | Line, for non-interactive separation |
| `color.border.control` | Control line |
| `color.border.control.inverse` | Inverse control line |
| `color.focus.ring` | Focus on light surfaces |
| `color.focus.ring.inverse` | Inverse focus on graphite |
| `color.feedback.success` | Success 700 |
| `color.feedback.warning` | Warning 800 |
| `color.feedback.danger` | Danger 700 |

State backgrounds use a pale tint of the relevant semantic hue, with explicit text. Positive status does not turn an entire table row green. Every status has a readable label and, where helpful, an icon. Every status variant defines its own foreground and background: a neutral badge over event artwork must not inherit the artwork's inverse text colour. Focus and control boundaries use surface-specific mappings; decorative dividers need not look like controls.

## 4. Typography, space and geometry

| Foundation | Proposal |
| --- | --- |
| UI font | Inter, with a system sans-serif fallback |
| Public display font | Inter with bold/extra-bold display weights and a system sans-serif fallback |
| Admin title | 28–32 px, semibold sans-serif |
| Public hero title | 48–64 px desktop; 32–40 px mobile |
| Public section title | 28–36 px |
| Body | 16 px public; 14–16 px operational content |
| Secondary metadata | 13–14 px; do not shrink essential status or errors |
| Data numerals | Tabular numerals for scores, dates, standings and capacity |
| Spacing scale | 4, 8, 12, 16, 24, 32, 48, 64 px |
| Input height | 40 px admin desktop; 44–48 px public/touch |
| Table row | 48 px compact desktop; 56–64 px comfortable |
| Radius | 0 px throughout: square corners for controls, cards, dialogs, notices, status labels and avatar containers |
| Elevation | Borders first; restrained shadow for overlays and menus |
| Content width | Admin: every page fills the available width, with no maximum. Public: content capped at 1200 px. Running text about 75 characters per line in any width |
| Breakpoints | 700 px (below: one column, narrower gutters); no others |
| Motion | Short 120–180 ms feedback; reduced-motion alternative; no ornamental looping animation |

Admin pages set no maximum width: content, panels and notices fill the area beside the rail (or under the top bar on standalone pages). A summary or secondary section is stacked with the main content at every width, in the order the page states; there is no aside. A summary's action sits to the right of its text and moves under it when there is no room; a page title's status labels sit beside the title and wrap below it. Below 700 px everything stacks in one column with no horizontal scrolling. Paragraphs keep `max-inline-size: 75ch` whatever their container's width. The public width is the `ui` token `--herald-width-public`; the breakpoint is written in stylesheets because media queries cannot read custom properties.

Spacing uses the declared scale, including 12 px. Border and focus strokes (1 and 3 px), 44 px interaction targets, column/content widths, icon sizes and breakpoints are dimensions rather than spacing steps. The public shell retains a fluid `max(5vw, 24px)` outer gutter; this is an explicit responsive exception. Negative 8 px navigation alignment remains on the spacing scale.

**Confirmed geometry:** use square corners throughout both experiences. The shared `radius.default` token is `0`; do not introduce rounded or pill-shaped component variants. Existing raster mockups predate this decision; this rule takes precedence.

Use sentence case for actions and headings. **Confirmed icon library:** use Tabler Icons for application iconography, with the outline family and a consistent stroke. Use 20 px for standard controls, 24 px for navigation, 16 px for compact metadata and 32 px for the illustration above an empty panel's heading (in the secondary text colour), with an 8 px icon-to-label gap. In the admin application, navigation items, status labels, back links, links to a tournament's entries and empty panels carry an icon chosen for their meaning, not their tone; actions keep text only (`ui-icons` D-1). Decorative icons are hidden from assistive technology; icon-only actions require accessible names, and consequential actions retain visible labels. The exploratory frontend prototype is exempt and does not need the dependency installed. Pair icons with labels for unfamiliar or consequential actions. Do not encode game identity, eligibility or match status through icons alone.

## 5. Shared component contracts

Implementation boundary (ADR 0011): an internal Angular `ui` library supplies shared tokens and common controls to both applications. Portal compositions, feature components and app-local shared components stay within their app. Shared controls support SSR and expose presentation contracts without API, session, permission or app-routing dependencies. A component/state catalogue is development tooling introduced with the first controls, not a third product application. Its controls are built on `ng-primitives` (headless), which only `ui` may import (`m0-web-shell` W-03).

| Component | Common contract | Admin emphasis | Public emphasis |
| --- | --- | --- | --- |
| Button | Primary, secondary, quiet and destructive variants; hover, focus, loading, disabled | One primary action per operation area | One clear next action per tournament or participation state |
| Field | Label, help text, value, error and required status | Compact grouping and keyboard flow | Comfortable controls and plain explanations |
| Select/filter | Visible current value and reset | Multi-filter operational tables | Game, date, location and entry kind |
| Status label | Semantic text with optional icon | Explain blockers and pending decisions | Distinguish open entry, waiting list, live and finished |
| Tabs | Navigate sections with keyboard and meaningful active state | Overview, entries, rounds, standings, settings | Details, participants, schedule, results |
| Table | Headers, sortable columns where needed, empty/loading/error states | Main operational surface | Standings and match schedules, responsive presentation |
| Entrant identity | Name, individual/team kind and stable context | Eligibility and readiness detail | Public identity and relevant participation information |
| Score | Outcome, score unit and cause; pending/effective distinction | Edit/correct with authority | Read and report with permission |
| Alert | Severity, explanation and next action | Persistent blockers near the affected operation | Explain failed or unavailable user actions |
| Dialog | Modal; title is the question; consequence and effect on other records; confirming action (destructive when it destroys) and a leaving action; Escape leaves; focus trapped and returned; busy state that cannot close or repeat; errors inside with a retry; full width at the bottom on narrow screens | Cancelling an entry, out-of-order admission with a reason, discarding typed input, leaving a form with unsaved input, finalisation and correction | Registration confirmation or withdrawal |
| Drawer | The dialog's rules with a side placement: about 480 px from the right on wide screens, the page visible behind its backdrop; full screen below 700 px; keeps typed input when a request fails | Adding a player or team; match report, entrant or roster detail | Optional on wide screens; full-screen flow on mobile |
| Toast | Outcome of the person's own completed action; success and info tones only; one stack, bottom right on wide screens and along the bottom on narrow ones without covering the primary action; at most three, older ones leave first; at least 5 seconds, paused on hover and focus; dismissible; polite announcement; never rendered on the server | Entry added, admitted or cancelled; changes saved | Reserved for later personal actions |
| Notice | State change linked to current record | Operational action or acknowledgement | Own/team next action |
| Pagination | Visible range, next/previous and current filters | Large entry/match lists | Discovery and history |

Loading buttons prevent accidental repeats without pretending that the operation has already succeeded.

**Feedback placement.** Every message goes where its cause is:

| Message | Where | Stays until |
| --- | --- | --- |
| Outcome of the person's own completed action | Toast | It times out or is dismissed; cleared on a change of organisation or person |
| Field error | At the field and in the form's error summary | The value is corrected |
| Failed action started in a dialog or drawer | Danger notice inside it; it stays open with what was typed and offers a retry | Retry succeeds or the person leaves |
| Failed page load | The page's failed state with a retry, no stale or partial records | Retry succeeds |
| Conflict, or a state that blocks actions (over capacity) | Persistent notice on the page with its next action ("Reload latest") | Resolved or the page is reloaded |

An error is never only a toast, and a toast never holds the only copy of information needed later or the only path to an action: the page also shows the outcome (the entry moves group, the form shows the saved values).

**Confirmation pattern.** An action with consequences that can be decided with one question and at most a short input confirms in a modal dialog. A flow of several steps that benefits from keeping the page in view opens in a drawer. A review of many values before a consequential action is its own page (review before publishing). An action that is reversible and changes nothing else acts at once with no confirmation (admitting in order, opening or closing registration). Browser `confirm` prompts are not used inside the applications; only closing or reloading the tab keeps the browser's own prompt.

**Visual weight follows actionability.** Records a person can act on come first at full weight. Read-only history follows them compactly, collapsed by default when it would compete with them, with its count visible while collapsed (“Cancelled · 5”), one line per record and no row actions, and it is omitted when empty. A summary states what waits for the person's decision when there is something (“Manual admission · 2 pending your decision”, “Automatic admission · 2 waiting for a slot”).

### 5.1 Required component states

Every implemented interactive component must cover default, hover, keyboard focus, pressed, disabled and loading where applicable. Data views cover loading, empty, populated, stale/updating and failure with retry. Forms preserve valid input after failure. Actions unavailable because of permissions or tournament state must expose an explanation when useful, rather than an unexplained disabled control.

## 6. Domain-specific visual rules

### 6.1 Separate lifecycle dimensions

A tournament header can show `Published`, `Registration closed` and `Preparing` together. Do not compress these into one ambiguous “Active” badge. Public listings may show a simplified competitive status with explicit registration availability, but detail views preserve the distinction.

### 6.2 Individual and team participation

An individual 1v1 tournament hides all roster/lineup settings and navigation. Its player comes directly from its entrant. Empty arrays, missing roster warnings and one-member team setup must not appear.

A team tournament labels capacity as teams, exposes eligible roster size, active players per side and readiness, and permits the authorised representative to select a lineup. `Team checked in` and `5 eligible starters ready` are separate facts. Five players winning a shared map produce one team outcome.

A composite team encounter later adds submatch/board navigation. The direct 5v5 view does not display five invented duel rows.

### 6.3 Pending results and corrections

Pending reports display `Awaiting confirmation`, with reporting source and time where visible. Effective results alone drive standings. A dispute remains visibly unresolved until a decision. `No-show`, `Concession` and `Bye` have explicit causes rather than fabricated scores.

New-result entry starts with no selected outcome and keeps confirmation unavailable until an explicit selection. A correction starts from the existing effective result. A correction flow shows old/new result and impact before confirmation. If dependencies prevent correction, present the affected round/stage and the reason for blocking. Ordinary result entry does not expose a generic “force update” escape hatch.

### 6.4 Permission-aware next actions

Visitor: discover and read. Player: manage individual entry and permitted match actions. Captain: act for the represented team within scope. Director/referee: operate the relevant tournament. A workspace switch changes context without granting authority. Every action remains validated server-side.

## 7. Administration composition

### 7.1 Shell

A persistent graphite rail identifies Herald, organisation context and major destinations: tournaments, teams where applicable, people/access and organisation settings. Within a tournament, use a horizontal section navigation below the title. Avoid duplicating every tournament tab in the global rail.

The header includes tournament name, game/variant, individual/team mode, venue/date and separate lifecycle facts. The primary action reflects the current phase, such as close registration, publish round or finalise. It is not a permanently enabled “Start tournament” button.

### 7.2 Page compositions

Every admin page uses the full width and one column.

| Page | Order |
| --- | --- |
| Tournament list | Title and "Create tournament", then the list |
| Tournament entries | Title with its labels beside it; summary (counts, what waits, terms update) with "Add player"/"Add team" on its right and the reason under it when unavailable; admitted and waiting groups; the collapsed cancelled group |
| Configuration of a published tournament | Title with its labels; "Published · configuration remains editable"; registration area; entries summary with "View entries" on its right; the form |
| Configuration of a draft, and creating a tournament | Title with its labels; the missing-for-publication summary above the form, next to the fields its links lead to; the form |
| Review before publishing | Title, lead and labels; the summary and its actions |
| Organisation selector, not found | The list or message across the width |
| Organisation creation | One panel: the form, then "A workspace of your own" |

New admin pages fill the width and stack secondary content with the main content, putting what a person acts on first. The captures in `docs/assets/mockups/feedback-layout/` show the earlier named widths and asides; for composition the rules above supersede them. Captures are kept as delivered and not regenerated; a prompt for new mockups states the rules of §4 and this section.

### 7.3 First admin mockup: round operations

Illustrative scenario: an individual eight-entry round-robin league. Registration is closed, competition is running, the first round has four matches. The view prioritises unresolved matches, accepts operator results, and provides standings as a secondary surface. As individual 1v1, it contains no roster/lineup tab.

Suggested layout:

1. Organisation rail and tournament title/context.
2. Tournament section tabs, with Rounds selected.
3. Current-round summary and unresolved count.
4. Match table with table number, opposing entrants, outcome and next action.
5. Secondary provisional standings panel or adjacent column where width allows.

Do not imply that resolving round one is required before any later round can be played in every league. The particular schedule and operational policy determine availability.

### 7.4 Team variation

The same match table uses team names as its opposing entries. Rows can expose `Lineup ready` or `4 of 5 eligible` and open a team detail drawer. Roster management appears in Entries or an applicable team section. Only team profiles introduce these controls. A seven-member roster selects five starters without changing capacity or entrant identity.

## 8. Public and participant composition

### 8.1 Shell

A compact top navigation contains Herald, tournaments and an account or sign-in action. Organising is a secondary route for users with restricted administrator eligibility. Open participant registration grants neither administrator access nor organisation creation (D-30); a staff invitation alone does not enable administrator sign-in. The public experience is not a marketing site requiring a large hero on every page. Public content is capped at 1200 px and centred, with the fluid `max(5vw, 24px)` outer gutter; toasts follow §5 and appear only in the browser, never in server-rendered output.

### 8.2 First visitor mockup: discovery

Use a concise, bold competition introduction on graphite, with crisp neutral listing content and one electric-lime action. Filters identify game title, individual/team mode, date and on-site/online mode. Event cards show title, game/variant, organiser, date/time zone, venue, entry unit, availability and an appropriate details action. Images may add atmosphere but must not contain the only readable title or essential rule.

Public discovery belongs to H2. This mockup communicates future direction; it is not an expansion of H1's implementation scope.

### 8.3 Tournament detail and next action

The detail page leads with identity and key conditions. Registration panel shows actual state: apply, join waiting list, admitted, check-in required, registration closed or cancelled. A signed-in player sees their next match when appropriate. A captain's panel names the represented team. No financial price/payment control is introduced in initial designs.

### 8.4 Mobile

Public navigation collapses into a labelled menu. Filters use a compact summary and full-screen filter sheet. Cards stack, while standings keep rank/name/points visible and expose additional details on demand. Admin mobile prioritises pending matches and incidents as stacked operational rows; it need not reproduce a wide desktop table at reduced scale. Consequential actions remain labelled and touch-friendly.

## 9. Visual references, journeys and state coverage

### 9.1 Reference authority

- **Canonical individual round/outcome concept:** [match outcomes and standings](assets/mockups/herald-match-outcomes-and-standings.png). Its explicit winners, 3/1/0 points and shared positions are the consistent scene to review.
- **Superseded historical image:** [original round management](assets/mockups/herald-round-management.png). Keep for provenance only. Its ambiguous Win/Loss labels, points and ranks are not an acceptance reference.
- **H2 public direction:** [tournament discovery](assets/mockups/herald-tournament-discovery.png). It does not add discovery or self-service to H1.

All raster concepts predate the confirmed square geometry and exact tokens. This guide governs geometry, controls and state semantics; the functional decision register governs which rules are confirmed. The canonical image is a composition and coherent-data reference, not a production screen or a complete workflow.

### 9.2 Deterministic documentation prototypes

- [H1 operator journeys](../prototypes/frontend/journeys.html): navigable individual and direct-team variations, from organisation access through setup, entries, readiness, rounds, result, correction, final review and public following. Jumping to a step loads an illustrative snapshot. No command, account creation or publication is executed.
- [H1 state review](../prototypes/frontend/review-states.html): twelve named fixtures for missing, blocked, current, stale and unavailable states. Each names its functional sources and pending policies.
- [Individual results demo](../prototypes/frontend/index.html): the existing eight-entrant in-memory league, with six-matches-per-four-entry semantics preserved in the separate journey fixtures. Includes H2 discovery direction, labelled as such in the prototype notes.
- [Browser captures and provenance](assets/mockups/journeys/README.md): representative desktop/mobile, grayscale and blur views; validation scope is explicit.
- [Opening instructions and scope](../prototypes/frontend/README.md), [validation and Refactoring UI diagnostic](../openspec/changes/archive/2026-11-08-frontend-visual-prototype/design.md).

The prototypes are documentation assets. They do not create an Angular workspace, a third product application, an API, authentication, permission enforcement or persistence. Their existence supplies review material; it does not approve all H1 screens. Exact component technology, interaction/accessibility verification and affected OpenSpec approval remain required before production implementation.

### 9.3 H1 screen/state inventory

“Represented” means there is a deterministic view to inspect. It does not mean the policy is accepted or the operation implemented. Query parameters below select a fixture in the linked HTML.

| Journey / surface | Represented references and states | Still required before the affected production slice |
| --- | --- | --- |
| UJ-01 organisation and access | [Access state review](../prototypes/frontend/access-states.html) and [24-state desktop/mobile capture table](assets/mockups/access/README.md): signed-out/in navigation; sign-in redirect/return/failure/cancellation; unassigned account; empty/required/too-long/submitting/failed/created organisation; owner shell; one/several organisations; switching/switched/other-tab context replacement; revoked landing/write; session expiry; provider/support recovery; generic private denial. Refines earlier `onboarding`, `private-denied` and journeys `step=access` under confirmed D-21 | Implemented by `h1-organisation-access` and run against the real directory (10 November 2026). Refinements decided in that run, which supersede the captures: the account menu is a quiet name-and-chevron control without a box; the rail's organisation block has no box (bold name, muted role, a small "Switch organisation" link shown with one organisation too, a divider before the navigation); another organisation is created from the selector, not the overview; the creation form offers "Cancel" back to a workspace instead of "Back to public page"; selector rows read "Switch" as secondary buttons; the admin brand has the accent dot. Not built: the intermediate switching screen (the full load starts at once) and `public-signed-in` (H2). The provider shows its own page for an unassigned account; Herald's not-assigned state covers a missing organiser role |
| UJ-02 setup (individual and team) | [Tournament setup state review](../prototypes/frontend/tournament-setup-states.html) and [18-state desktop/mobile capture table](assets/mockups/tournament-setup/README.md): list empty/populated/loading/failed; new, saved individual and team drafts; publication blocked; validation errors; saving, save failed, revision conflict; individual and team review; publishing, publication failed; published individual and team. Replaces journeys `step=setup` and state `configuration` for these screens | Implemented by `h1-tournament-setup` (11 November 2026) with corrections V-1 to V-6 and deviation Q-1 of its design, which supersede the captures: no draft sentence on a published tournament; the error summary is as wide as the form and reads "Correct N fields to save"; each date-time is also written as "14 November 2026, 10:00"; a field in error has a danger border, an icon and "Error:"; the rail has no Organisation destination; the time zone is proposed from the browser. Also differing: the action reads "Review and publish"; the review names the tournament, not the organisation; the published notice uses the information tone. Still required: visibility effects and the public page; cancellation/archival and deadline-change states under D-27 |
| UJ-02 registration window | [Registration window state review](../prototypes/frontend/registration-window-states.html) and [11-state desktop/mobile capture table](assets/mockups/registration-window/README.md): not open ready and with missing dates, unsaved changes, opening, open, open failed, closing, closed, conflict, a date removed while open; list with the three registration labels | Implemented by `h1-registration-window` (11 November 2026) with corrections W-1 to W-3 of its design, which supersede the captures: the last change names no person; the shell and help texts are the implemented ones; list rows keep their capacity line. Also differing: notices use `herald-notice`; the action keeps its own width on narrow screens. Still required: entries and their effect on capacity and entry kind |
| UJ-02 guest entries | [Entries state review](../prototypes/frontend/entries-states.html) and [22-state desktop/mobile capture table](assets/mockups/entries/README.md): empty, not open, automatic full, manual team, closed; add existing/new/possible duplicate/adding/failed; admission unavailable and out of order; cancellation open and closed; conflict, over capacity, loading, failed; entries link, locked fields, capacity rejected; list with entries | Implemented by `h1-entries` (11 November 2026) with corrections V-1 and V-2 of its design, which supersede the captures: a guest has no human reference and same-name guests are told apart by creation date; the shell is the implemented one. Also differing: "Entry terms updated" instead of "Counts and entry terms updated"; an already-entered guest is marked in search results; notices keep the `ui` width; the entries link sits beside its summary on desktop. Still required: check-in, guest editing and aliases |
| UJ-02/03 team rosters | [Team rosters state review](../prototypes/frontend/team-rosters-states.html) and [38-capture desktop/mobile table](assets/mockups/team-rosters/README.md): team rows with readiness (incomplete, complete, above maximum, waiting and cancelled); roster drawer empty, incomplete, complete, full, above maximum; add existing (one player on another team), new, possible duplicate, adding, failed; removal in progress; possible-duplicate member; history expanded; cancelled read only; awaiting terms; conflict; loading; failed | Implemented by `h1-team-rosters` (11 November 2026); differences recorded in its design, which supersede the captures: one status while a member is removed; "Roster sizes not available" when the bounds are unknown; a search result's action under its name; member times written without a time zone; shorter empty and loading texts. Still required: freeze at start, lineups, captains (H2) and the sanctions and departures of D-23 |
| UJ-02 check-in | [Check-in state review](../prototypes/frontend/check-in-states.html) and [22-capture desktop/mobile table](assets/mockups/check-in/README.md): check-in mandatory and optional, no admitted entries, checking in, checked in with toast, undo, failed, conflict, cancelled entry checked in, team check-in apart from readiness, policy locked in the configuration | Implemented by `h1-check-in` (12 November 2026); differences recorded in its design, which supersede the captures: house error, busy and disabled styles; the cancelled row's label after its cancellation time; the existing empty-field panel. Still required: a check-in window, absences at start and participant self-check-in (H2) |
| Feedback and layout (all admin screens, public home, `ui` catalogue) | [Feedback and layout state review](../prototypes/frontend/feedback-layout-states.html) and [38-state desktop/mobile capture table](assets/mockups/feedback-layout/README.md): entries wide with aside (superseded), cancelled collapsed and expanded, pending decisions; cancellation and out-of-order admission dialogs (open, closed, busy, failed, reason empty and typed); add drawer (search, create, duplicate, adding, failed); toasts (one, stacked and focused); conflict, over capacity, loading, failed; configuration published, saved, rejected, conflict, reload and leave dialogs, draft; list wide and empty; review; organisation selector, creation, not found; public home at 1920 px; catalogue dialog, drawer and toast | Implemented by `ui-feedback-and-layout` (11 November 2026), with the rules in §4, §5, §7.2 and §8.1; differences recorded in its design, which supersede the captures: after the maintainer's run (design D-9) admin pages fill the width with no aside, labels beside the title, summary actions on the right and notices filling their container; the public hero band stays full width with its content capped; the catalogue opens the real overlays instead of inline specimens; a toast can briefly sit over content near the bottom of the screen. Earlier captures of the entries, setup and registration slices remain valid for content and states only |
| Icons (admin shell, list, configuration, entries, roster drawer, access) | No mockups: `ui-icons` D-1's icon table and before/after captures at 1440 and 390 px | Implemented by `ui-icons` (12 November 2026); status labels wrap more often at 390 px, accepted by the maintainer. Still required: icons on screens added later follow §4 |
| UJ-02 entries/check-in | Journeys `step=entries`; state `entries`: admitted/confirmed, pending check-in, waiting after final-slot conflict, explicit review action | Guest creation/duplicate review and alias editor under D-22; confirmation of the admission/promotion policy |
| UJ-03 team preparation | Journeys `kind=team&step=setup` and `step=readiness`; states `team-blocked`/`team-ready`: one team slot, roster seven, five starters/two reserves, freeze, 4-of-5 blocker and both valid locks | Identity conflict and competitive sanction/departure variants under D-23; valid lock is not evidence of play |
| UJ-02/03 rounds and results | Journeys `step=rounds`/`step=result`; individual demo; state `administrative-result`: played versus pre-play no-show, no fabricated score or appearances | Draft/published pairing revision changes and remaining D-25 terminal outcomes, including double absence/no contest |
| UJ-06 correction and recovery | Journeys `step=correction`; new-result form has no default winner; states `correction` and `recovery`: finalised blocker, reasoned reopening entry point, retained input and uncertain-response reconciliation | Published-dependency and stale-impact-review fixtures with the actual affected dependency; no invented sequential dependency between round-robin rounds |
| UJ-02/06 finalisation | Journeys `step=finalise`; states `finalisation-stale`/`finalisation-current`: separate facts, standings and reviewed revisions, disabled stale finalisation and review-again action | Decide D-24; verify concurrent correction, recovery and reasoned reopening end to end |
| UJ-07 public following | Journeys `step=public`; states `public-following`/`private-denied`: aliases, current revision, shared position, revised final result and no private content | Public loading/failed refresh/cancellation and visibility-transition variants; confirm D-21/D-27 |
| UJ-08 independent API | Functional journey and AT-14; state `recovery` illustrates receipt semantics without an extra API console | Worked individual/team requests, receipt/error examples and revocation scenarios in the API specification |

H2 discovery, participant admission/check-in, team representation and report/confirm/dispute journeys remain separate follow-up work. The existing directory is a future composition reference. H1 public detail/read-by-link is already required and is represented above.

Review desktop and mobile next actions for each affected slice. Loading, empty, populated, blocked, stale and failure states should be added to the component/state catalogue where applicable; this inventory does not claim that twelve fixtures exhaust that catalogue.

### 9.4 H2 screen/state inventory

The [H2 discovery](herald-h2-functional-discovery.md) owns functional rules and target acceptance. These are future surfaces for reviewed slices, not approved mockups or implemented screens. This documentation update changes no UI.

| Surface | Required states and boundary evidence |
| --- | --- |
| Account/sign-in and private invitations | Open participant registration; restricted admin denial; valid/expired/used/revoked invitation; accepted access does not reserve a place; guest linkage pending/conflicting/verified |
| Directory and detail | Filters, no results, full/waiting/open/closed/cancelled; minimum and deadline/time zone; public/unlisted/private isolation |
| My competitions and own entry | Waiting reasons, admitted, cancelled/rejected, check-in pending/confirmed, next action, pairing publication and withdrawal request |
| Teams/representation | Responsible person/captain/member, invitation acceptance, transfer, revoked authority, guest linkage, personal versus represented context |
| Roster and lineup | Pending member acceptance, invalid/incomplete/eligible, deadline freeze, draft/submitted/locked, denied correction and no appearance inferred from lock |
| Match/report/dispute | No report, pending confirmation, identical/different response, stale revision, disputed, independent-referee blocker, effective outcome and correction request |
| Administration scheduling and delegation | Automatic/manual registration, early close protection, minimum/reminder/cancellation, obsolete deadline, processing failure; pending admin habilitation, tournament-scoped roles and revocation |
| Inbox and protected history | Empty/unread/read, no duplicate notice, revoked target, guest communication work; reserve versus actual play, revised/cancelled outcomes and private-history denial |

For each surface include desktop/mobile, keyboard, loading, failed/uncertain-save and stale states as applicable. Reuse the discovery concept only for composition; each production screen slice requires specific mockup review under the `herald-screens` skill. The H2 discovery scenarios identify behavioural acceptance; screenshots alone do not prove authority, scheduling or durable audit.

### 9.5 H3 screen/state inventory

The [H3 discovery](herald-h3-functional-discovery.md) owns functional rules and target acceptance. These are future surfaces for reviewed slices, not approved mockups or implemented screens. This documentation update changes no UI.

| Surface | Required states and boundary evidence |
| --- | --- |
| Configuration/profile selection | Elimination/single match, individual/team, supported combinations, profile/version, required winner, incompatible draw/detail and unsupported field size |
| Field/seeding/bracket preview | Empty/ineligible field, explicit draw, initial byes, reproducible revision, changed-field/stale review, fixed bracket and denied regeneration/replacement |
| Desktop bracket/mobile round list | Planned source, unresolved origin, current derived entrant, published opponent, bye versus administrative advance, no qualifier, blocked/complete round; no colour-only meaning |
| Match/result/incident | Outcome-only/aggregate Bo3, invalid terminal score, retained partial-play evidence, pending/disputed/effective, team understrength, one series lineup and independent-referee blocker |
| Round operations and correction | Ready for review versus published, updating projections, old/new result/participation impact, unpublished draft invalidated, named published dependency, concurrent conflict and recoverable receipt |
| Final review, history and notices | Current/stale review, ordinary shared places, exceptional no-champion policy pending decision, reopened/revised result, no fabricated appearance, visibility/representation revoked and guest communication work |

Include desktop/mobile, keyboard, empty/loading, denied/revoked, failed-save with retained input and uncertain-response recovery where applicable. Future screen slices require specific visual review under the `herald-screens` skill and executable scenarios linked to H3 §12. The existing league concepts do not approve an elimination bracket or exceptional-closure presentation.

## 10. Accessibility and semantic acceptance

- Target WCAG 2.2 AA. Verify normal text at least 4.5:1 and large text at least 3:1. Validate control boundaries, focus visibility, non-text contrast and states separately before implementation.
- Touch controls aim for 44 px targets. Dense desktop views can use smaller visual controls while preserving an adequate interaction area and spacing.
- Focus uses a visible ring with separation from the control boundary. Never remove focus styling for aesthetic reasons.
- Errors include text and field association. Live updates announce meaningful changes without continually interrupting screen-reader users.
- Entry, match and result states always have text. Colour is a reinforcement.
- Tables use semantic headers and understandable sorting. Reading order follows visual order.
- Preserve user input and current filters across errors and appropriate navigation.
- A private tournament is never exposed by design convenience in profile cards, search suggestions or team history.

The accessibility target is a design requirement, not a compliance claim for unimplemented mockups. Reference: [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) and [Understanding Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum). The 44 px touch target is a product design target, not a statement that AA requires every target to be 44 px.

## 11. Confirmed constraints and remaining visual decisions

Confirmed constraints: modern neutral competition identity, compact operational administration, square corners throughout, a shared visual foundation and Tabler outline icons for the eventual application. The documentation prototypes can retain their dependency-free icon/text treatment.

Still proposed: the exact electric-lime accent, detailed density and standings placement, public imagery, and complete typography/interaction states. Review the admin/public compositions together, then approve each affected journey and its exception states. A polished example does not imply approval of every screen, proposed policy or dependency.

The v0.7 consolidation preserves these decisions while correcting contradictory references and adding deterministic review surfaces. The current Refactoring UI assessment and its exact render/test scope are recorded in the prototype change's design note rather than repeated as a product-wide quality claim.

## Appendix: initial text contrast checks

Calculated from the proposed hexadecimal values using relative sRGB luminance. These checks cover only the listed text pairs, not all components, focus indicators or generated mockup pixels.

| Pair | Ratio | Normal text at 4.5:1 |
| --- | --- | --- |
| Primary text on public light surface | 16.85:1 | Pass |
| Secondary text on admin canvas | 5.27:1 | Pass |
| Primary action text on lime | 13.46:1 | Pass |
| Inverse navigation text | 17.46:1 | Pass |
| Lime on graphite | 13.46:1 | Pass |
| Lime on white | 1.30:1 | Do not use for normal text |
| Informational teal on white | 5.92:1 | Pass |
| Danger text on white | 7.40:1 | Pass |

### Surface-specific mappings checked on 7 November 2026

Calculated from CSS tokens using relative sRGB luminance. These are pair checks for the named contexts, not certification of every rendered state, raster image or accessibility requirement.

| Pair / purpose | Ratio | Interpretation |
| --- | --- | --- |
| Neutral status `#171A1E` on `#E7EAF0` | 14.49:1 | Explicit text mapping also works over inverse artwork |
| Control border `#747D89` on white | 4.17:1 | Control boundary, distinct from decorative Line |
| Control border on admin canvas | 3.79:1 | Control boundary on the sampled light canvas |
| Inverse control border `#AEB6C0` on graphite | 8.52:1 | Inverse neutral control boundary |
| Focus `#2559C3` on white | 6.37:1 | Light-surface focus indicator |
| Inverse focus `#9DBBFF` on graphite | 9.13:1 | Graphite-surface focus indicator |
| Inverse focus on inverse hover `#30363E` | 6.38:1 | Sampled inverse hover context |

The previous blue-on-graphite combination was 2.74:1 and the neutral badge inherited text produced 1.13:1; they are replaced in the documentation prototypes. Validate actual adjacent colours, keyboard visibility, focus restoration and all component states when implementing the shared controls.
