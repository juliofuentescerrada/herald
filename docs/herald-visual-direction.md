# Herald visual direction and design system

Version 0.2 · 6 November 2026 · Design proposal for review

## 1. Purpose and status

This document translates the functional proposal into a visual direction, shared design foundations and two application experiences: tournament administration and public discovery/participation. It is a first design proposal, not an approved brand specification or implementation.

The baseline is `docs/herald-functional-discovery.md` v0.4. Confirmed requirements remain authoritative: individual and team entrants, implicit participation in individual 1v1, scoped permissions, distinct lifecycle dimensions, effective results, and an externally consumable API.

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
| Line | `#D8DDE4` | Dividers and input boundaries |
| Volt 400 | `#C7F23A` | Primary action and selected emphasis |
| Volt 500 | `#B4DD28` | Primary hover/pressed candidate |
| Volt 50 | `#F1F9D8` | Pale accent background |
| Teal 700 | `#236F69` | Informational/live accent |
| Success 700 | `#246141` | Positive completion feedback |
| Warning 800 | `#805400` | Action required or readiness warning |
| Danger 700 | `#A12632` | Destructive actions and unresolved critical issues |
| Focus | `#2559C3` | Keyboard focus indicator |

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
| `color.border.default` | Line |
| `color.focus.ring` | Focus |
| `color.feedback.success` | Success 700 |
| `color.feedback.warning` | Warning 800 |
| `color.feedback.danger` | Danger 700 |

State backgrounds use a pale tint of the relevant semantic hue, with explicit text. Positive status does not turn an entire table row green. Every status has a readable label and, where helpful, an icon.

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
| Radius | 6 px controls; 10–12 px event cards/dialogs; no arbitrary mix |
| Elevation | Borders first; restrained shadow for overlays and menus |
| Content width | Public max 1200 px; admin fluid with protected table readability |
| Motion | Short 120–180 ms feedback; reduced-motion alternative; no ornamental looping animation |

Use sentence case for actions and headings. Icons share one consistent outline family and stroke. Pair icons with labels for unfamiliar or consequential actions. Do not encode game identity, eligibility or match status through icons alone.

## 5. Shared component contracts

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
| Dialog | Scope, consequences, clear cancel/confirm | Finalisation, correction and cancellation | Registration confirmation or withdrawal |
| Drawer | Secondary details while preserving context | Match report, entrant or roster detail | Optional on wide screens; full-screen flow on mobile |
| Notice | State change linked to current record | Operational action or acknowledgement | Own/team next action |
| Pagination | Visible range, next/previous and current filters | Large entry/match lists | Discovery and history |

A toast confirms a completed action, but never replaces a persistent validation error or critical state. Loading buttons prevent accidental repeats without pretending that the operation has already succeeded.

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

A correction flow shows old/new result and impact before confirmation. If dependencies prevent correction, present the affected round/stage and the reason for blocking. Ordinary result entry does not expose a generic “force update” escape hatch.

### 6.4 Permission-aware next actions

Visitor: discover and read. Player: manage individual entry and permitted match actions. Captain: act for the represented team within scope. Director/referee: operate the relevant tournament. A workspace switch changes context without granting authority. Every action remains validated server-side.

## 7. Administration composition

### 7.1 Shell

A persistent graphite rail identifies Herald, organisation context and major destinations: tournaments, teams where applicable, people/access and organisation settings. Within a tournament, use a horizontal section navigation below the title. Avoid duplicating every tournament tab in the global rail.

The header includes tournament name, game/variant, individual/team mode, venue/date and separate lifecycle facts. The primary action reflects the current phase, such as close registration, publish round or finalise. It is not a permanently enabled “Start tournament” button.

### 7.2 First admin mockup: round operations

Illustrative scenario: an individual eight-entry round-robin league. Registration is closed, competition is running, the first round has four matches. The view prioritises unresolved matches, accepts operator results, and provides standings as a secondary surface. As individual 1v1, it contains no roster/lineup tab.

Suggested layout:

1. Organisation rail and tournament title/context.
2. Tournament section tabs, with Rounds selected.
3. Current-round summary and unresolved count.
4. Match table with table number, opposing entrants, outcome and next action.
5. Secondary provisional standings panel or adjacent column where width allows.

Do not imply that resolving round one is required before any later round can be played in every league. The particular schedule and operational policy determine availability.

### 7.3 Team variation

The same match table uses team names as its opposing entries. Rows can expose `Lineup ready` or `4 of 5 eligible` and open a team detail drawer. Roster management appears in Entries or an applicable team section. Only team profiles introduce these controls. A seven-member roster selects five starters without changing capacity or entrant identity.

## 8. Public and participant composition

### 8.1 Shell

A compact top navigation contains Herald, tournaments and an account or sign-in action. Organising is a secondary route for authorised users or an invitation to create an organisation. The public experience is not a marketing site requiring a large hero on every page.

### 8.2 First visitor mockup: discovery

Use a concise, bold competition introduction on graphite, with crisp neutral listing content and one electric-lime action. Filters identify game title, individual/team mode, date and on-site/online mode. Event cards show title, game/variant, organiser, date/time zone, venue, entry unit, availability and an appropriate details action. Images may add atmosphere but must not contain the only readable title or essential rule.

Public discovery belongs to H2. This mockup communicates future direction; it is not an expansion of H1's implementation scope.

### 8.3 Tournament detail and next action

The detail page leads with identity and key conditions. Registration panel shows actual state: apply, join waiting list, admitted, check-in required, registration closed or cancelled. A signed-in player sees their next match when appropriate. A captain's panel names the represented team. No financial price/payment control is introduced in initial designs.

### 8.4 Mobile

Public navigation collapses into a labelled menu. Filters use a compact summary and full-screen filter sheet. Cards stack, while standings keep rank/name/points visible and expose additional details on demand. Admin mobile prioritises pending matches and incidents as stacked operational rows; it need not reproduce a wide desktop table at reduced scale. Consequential actions remain labelled and touch-friendly.

## 9. First mockup set and review criteria

### Concept images

- [Admin round management](assets/mockups/herald-round-management.png)
- [Match outcomes and standings](assets/mockups/herald-match-outcomes-and-standings.png)
- [Public tournament discovery](assets/mockups/herald-tournament-discovery.png)

Initial generated mockups are concept references with illustrative data, not implemented screens or exact component measurements. This specification governs exact semantics and token values if raster rendering introduces small deviations. Final logo treatment requires a separate identity decision; the current concept uses a typographic wordmark and does not assume the illustrated repository asset belongs in the interface.

| Mockup | Purpose | Questions to review |
| --- | --- | --- |
| Admin round operations | Validate compact operational composition and individual flow | Are pending work and the next action obvious? Are results readable? Is the interface calm enough for long sessions? |
| Visitor discovery | Validate the public tone and discovery hierarchy | Is it welcoming across game types? Can entry mode, timing and availability be understood quickly? Does it share the admin identity? |

Before implementation, follow with deterministic layout prototypes and a component/state catalogue. After approving the direction, prioritise H1 screens: tournament configuration, entries/check-in, team roster/lineup variant, round operations and final standings. Add the H2 public detail and participant journey next. A mobile next-action screen should accompany those prototypes.

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

## 11. Decisions to validate

1. Graphite/neutral/electric-lime identity as the baseline direction.
2. Light neutral operational content with graphite navigation, plus a bolder competition-focused public masthead.
3. A shared sans-serif family with heavier public display headings.
4. Operational density and secondary standings placement on desktop.
5. Use of public event imagery versus a primarily typographic directory.
6. Initial reusable component technology after the visual/functional contracts are stable. This document does not select a frontend component library.

The maintainer should review both first mockups together. Approving separate appearances without comparing their shared controls risks producing two products rather than two experiences of Herald.


The neutral, modern competition direction is confirmed by the maintainer. Electric lime is the initial accent proposal, not yet approved. Admin composition remains compact and operational.

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
