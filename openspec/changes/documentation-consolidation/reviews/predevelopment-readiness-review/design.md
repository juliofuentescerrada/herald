# Pre-development readiness review

> Historical review snapshot (7 November 2026), before consolidation. Findings refer to the original inputs recorded alongside this review. See the [consolidation record](../../design.md) for maintained resolutions and remaining gates.

7 November 2026. Review only. Findings and closure criteria do not approve product defaults or production implementation.

## Assessment

The domain baseline is strong enough to continue bounded M0 foundations and prepare H1 specifications. It is not yet a complete, consistently illustrated contract for implementing all H1 journeys. The highest-risk gaps concern unresolved rules and authority, exceptional outcomes, finalisation consistency, and the absence of a reviewable team operator flow.

Preserve the existing distinctions: entrant versus player/account, individual play without roster work, direct team play versus composite submatches, registration versus readiness, effective results versus reports, and locked lineups versus actual appearances. These are already documented and should not be rediscovered during implementation.

The review uses **Refactoring UI** as its primary visual framework, with the repository's confirmed design choices taking precedence. Square corners, Tabler outline icons for the eventual application, and the declared spacing scale including 12 px remain valid. The electric-lime accent is still a proposal. No visual redesign or product-rule change is made here.

## Reviewed baseline and evidence

The reviewed source checkout is `/home/julio/Code/herald` at HEAD `08c3308dcf775bc03add59a768303d7d07cd1bc0`, **including its existing uncommitted documentation and prototype changes**. The report lives in a separate worktree created from HEAD. Those source changes were neither copied into this worktree nor modified. Consequently, evidence below refers to the source checkout, not the older tracked copies beside this report.

| Key | Source | Review method |
| --- | --- | --- |
| D | [Functional discovery v0.6](/home/julio/Code/herald/docs/herald-functional-discovery.md) | Full requirements, decision and journey review |
| V | [Visual direction](/home/julio/Code/herald/docs/herald-visual-direction.md) | Tokens, states, compositions and acceptance requirements |
| R | [Roadmap](/home/julio/Code/herald/docs/roadmap.md), [ADR 0013](/home/julio/Code/herald/docs/adr/0013-functional-delivery-scope.md), [README](/home/julio/Code/herald/README.md) | Scope and decision-status comparison; supporting ADRs consulted |
| P | [Domain presentation](/home/julio/Code/herald/docs/herald-domain-overview.pptx) | All 12 slides, speaker notes and rendered pages |
| M | [Round management](/home/julio/Code/herald/docs/assets/mockups/herald-round-management.png), [outcomes and standings](/home/julio/Code/herald/docs/assets/mockups/herald-match-outcomes-and-standings.png), [discovery](/home/julio/Code/herald/docs/assets/mockups/herald-tournament-discovery.png) | Direct visual inspection of all three PNGs |
| X | [Prototype review notes](/home/julio/Code/herald/openspec/changes/frontend-visual-prototype/design.md), [frontend prototype](/home/julio/Code/herald/prototypes/frontend/index.html) | Current exploratory implementation and declared limitations |

Line references such as `D:595` identify lines in this reviewed snapshot. PPT references use slide numbers; notes are explicitly identified. Known gaps G-01–06 are consolidated below rather than counted again as new discoveries.

## Prioritised findings

**P1:** resolve before implementing the affected H1 slice or using the artefact as its acceptance reference. **P2:** resolve during design of that surface, before its implementation or pilot. These priorities do not make every finding a blocker for every M0 task.

### R-01 · P1 · Decision status and scope are inconsistent across artefacts

**Evidence:** D:595 requires H0 decisions to be settled, while D:716–733 still lists several as Proposed or Partially confirmed. D-16 remains Proposed despite ADR 0013 accepting H1 direct teams. README:9 still describes three competition systems in v1, and README:54 illustrates a test that prohibits registration closure with fewer than two players, contrary to CP-02 at D:131. P uses v0.4 throughout; slide 11 notes still call the sequence proposed and slide 12 presents ownership as open although D-08 is settled.

**Consequence:** a developer can implement an obsolete rule, or infer approval of all detailed defaults from approval of the delivery scope.

**Closure:** reconcile README, decision table, roadmap and PPT against ADR 0013. For partially approved decisions, record the accepted clauses, remaining question, decision owner and accepted example. Mark old material as superseded. Preserve historical ADR content and use the existing supersession mechanism. Acceptance of H1 teams does not automatically settle every roster, representation or sanction rule.

**Owner:** maintainer/product owner. **Gate:** H0 handoff and each affected slice.

### R-02 · P1 · H1 has no complete table of terminal match outcomes

**Evidence:** D:223 requires every pairing to reach a valid terminal resolution; D:274 covers played and future unplayed matches on withdrawal. G-06 at D:910 already recognises double no-show without withdrawal and voided encounters. Withdrawal during play and finalisation when all entrants withdraw or are disqualified remain insufficiently specified.

**Scenario:** both entrants miss their match but remain in the league; or one withdraws after play starts; or every entrant leaves before the league ends. Implementers cannot derive uniquely whether the encounter is replayed, voided or administratively resolved, what points it awards, and whether finalisation is possible.

**Closure:** extend G-06 into a matrix of prior state, cause and whether play occurred, with resulting points, appearances, terminal status and finalisation effect. Include both orders of withdrawal, preserving revisions and the same eventual double-absence result. Do not invent numeric scores or count an administrative award as play.

**Owner:** product/domain. **Gate:** H1 outcomes, withdrawal and finalisation slices.

### R-03 · P1 · Leaving a team has ambiguous eligibility consequences

**Evidence:** D:346 says a departing team member causes eligibility and future lineups to be reassessed; D:349, TM-05 at D:404 and UJ-03 at D:809 say general membership changes do not rewrite the frozen tournament roster.

**Scenario:** a player leaves the club after roster freeze but before their next match, possibly after the lineup has locked. One interpretation preserves eligibility; another blocks the match.

**Closure:** distinguish persistent-team membership departure, withdrawal from the tournament roster, and sanction. Specify the authorised actor and effect on the frozen roster, a submitted/locked lineup, future start permission and historical participation. This is an H1 rule, not a request to bring H6 substitution workflows forward.

**Owner:** product/domain. **Gate:** H1 team readiness.

### R-04 · P1 · Finalisation needs an observable revision barrier

**Evidence:** CP-05 at D:137 and consistency at D:482 require an accurate review; G-05 at D:909 explicitly records the missing barrier.

**Scenario:** the director reviews provisional standings while another operator corrects the last effective result. The standings projection still shows the previous revision when finalisation is requested.

**Closure:** specify which result/standings revision the director approves, when it is safe to finalise, and the UI/API response to stale or concurrent changes. Finalisation must never publish a table omitting an effective result. Include an updating state, a persistent explanation and a way to review again. A revision mechanism is required; its implementation remains a design choice.

**Owner:** product and engineering. **Gate:** H1 standings/finalisation.

### R-05 · P1 · The pilot identity and authority workflow remains incomplete

**Evidence:** UJ-01 at D:779 leaves organisation onboarding policy open. API requirements at D:507–515 require scoped, revocable access, while D-12 at D:727 remains Proposed. G-01/G-04 at D:905/908 cover private access and guest identity. General application management is later scope.

**Scenario:** a first organiser has no membership; an authorised external client needs to create guests and report results; another organisation must be denied even when it knows identifiers.

**Closure:** agree the H1 operator onboarding/recovery path, a minimal permission matrix and an operational procedure to provision/revoke a pilot API client. Define organisation scope for guest identities and the private-read policy. Include denied direct links, lost access and revoked-client recovery. Invitations, account claims and advanced team representation can remain H2; a general third-party application console is not required in H1.

**Owner:** product and engineering. **Gate:** H1 access, guests and API writes.

### R-06 · P2 · H1 promises announcements without defining their delivery

**Evidence:** cancellation and material/publication changes require announcements at D:139, 157 and 201. F-10 at D:245 describes in-app notices; D:624/702 places notices in H2/H5. H1 uses guests without accounts and does not depend on email.

**Scenario:** the organiser changes the venue or start time for guest teams whose representatives cannot access an in-app inbox.

**Closure:** decide whether H1 supplies a visible change record with organiser-managed communication, or a minimal notice capability. Specify recipients, where the current information appears and what evidence of publication is retained. Do not silently require email or a participant portal.

**Owner:** product. **Gate:** H1 publication/cancellation and pilot instructions.

### R-07 · P2 · Lifecycle names do not yet define all legal transitions

**Evidence:** state table D:117, cancellation D:139, finalised reopening D:333, and existing G-02/G-03 at D:906–907.

**Scenarios:** cancel with admitted and waiting entries plus published pairings; reopen a finalised tournament; archive during preparation; change public to private after publication; postpone after roster freeze. The league also allows matches from different rounds to progress without a universal sequential-round gate.

**Closure:** add an action/actor/precondition/result/effects/retry table. Resolve pending applications, registration availability, pairings and lineups on cancellation. Define archival semantics, visibility/cache effects, revised deadlines and the explicit round-start/completion rules. Changing a start date must not silently unlock a roster.

**Owner:** product/domain. **Gate:** the corresponding editor and operations slices.

### R-08 · P1 · Two active mockup references contradict each other

**Evidence:** `herald-round-management.png` shows three resolved first-round matches but Casey and Riley each have 2 points, Jordan has 1 and Taylor has 0. It also displays distinct ranks for equal points. `herald-match-outcomes-and-standings.png` corrects the same scene to Alex/Taylor 3, Casey/Jordan 1 and shared positions. Both remain linked by README and V §9.

**Consequence:** the older mockup is an unsafe acceptance reference for 3/1/0 scoring, outcome orientation and shared ranks. An illustrative-data label does not resolve a contradiction in the behaviour under review.

**Closure:** designate the corrected image as the authoritative scene, label the earlier one superseded, and maintain a shared fixture for any future rendering. Use explicit winner names rather than an unqualified Win/Loss for a two-sided row. Rounded corners in these raster concepts are already superseded by V's square-corner decision; that is a documented historical difference, not a new product decision.

**Owner:** product/design. **Gate:** before round/standings screen approval.

### R-09 · P1 · The visual set cannot validate the complete H1 operator journey

**Evidence:** D §11/§17 requires organisation context, configuration, entry readiness, teams and public following. The three PNGs show individual round operations and H2 discovery. X explicitly starts with an individual league already running and excludes authentication, team operation and registration submission.

**Closure:** produce deterministic mockups for the missing H1 surfaces and states in the coverage matrix below, especially roster freeze, 4-of-5 blocked starters, a valid locked lineup, administrative outcomes and finalisation. Reuse the current individual shell; an absent backend or persistence in a disposable prototype is not a defect. A browser preview of the individual success path cannot approve the team journey.

**Owner:** product/design. **Gate:** affected screen proposals, not all foundation work.

### R-10 · P2 · Corrections and operational recovery need decision-ready states

**Evidence:** UJ-06 at D:848–860 requires revision/evidence, impact review and dependency blocking. V §5.1 requires empty/loading/stale/failure states. X explains that its correction flow replaces in-memory points and does not implement production revision history.

**Closure:** review the old/new outcome and cause, actual-play/appearance impact, standings revision and any affected published dependency. Add designs for stale edit, denied permission, failed save with retained input, retry after an uncertain response, and reopening a finalised tournament. H2 report/dispute screens can wait; H1 operator incidents cannot. The prototype's limited audit behaviour should remain visibly labelled as exploratory.

**Owner:** product/design and engineering. **Gate:** H1 result/correction surface.

### R-11 · P2 · The presentation needs clearer H1 hierarchy and updated review agenda

**Evidence:** P slide 8 gives the competitor-confirmation/dispute path the full connected diagram, while the H1 operator route appears only as side text without a connection to Effective result. Slide 7 visually omits cancellation/reopening, although its notes explain them. Slide 10 summarises H1 but does not visually expose team readiness and current-standings review gates. Slide 12 still leads with settled ownership.

**Closure:** connect and emphasise the H1 operator route and label the other path H2. Mark simplified diagrams as such and add the relevant exception callouts; do not claim those rules are absent from the speaker notes. Update the agenda to the actual open decisions R-02–07 and add a compact journey/state coverage slide or companion table. The PPT is a synthesis, not a requirement to duplicate every detailed rule.

**Owner:** product/design. **Gate:** next domain review.

### R-12 · P2 · Visual verification is incomplete

**Evidence:** the current prototype render exposes an almost invisible **Registration closed** badge: `.cover` supplies `#DDDDDD` text inherited by `.tag` on `#E7EAF0`, approximately **1.13:1**. See `prototypes/frontend/style.css:1`, `app.js:13`, and [the desktop capture](evidence/prototype-public-desktop.png). The open-registration tag sets an explicit text colour, so the defect is state-specific. Focus blue on graphite calculates to 2.74:1 and the default border on white to 1.37:1; these combinations need contextual review wherever focus or a boundary is the sole indicator.

PPT text colour `#9A6B2F` on `#F6F2E9` measures approximately **4.16:1**, below the project's 4.5:1 normal-text target for “Prepare and direct” on slide 2 (17.25 pt regular) and “Assigned match” on slide 9 (16.5 pt regular). The same colour on sufficiently large headings is a separate case.

**Closure:** give every status explicit foreground/background tokens, including statuses placed over inverse artwork. Introduce tested focus/boundary mappings per surface and darken the small PPT labels. This review supplies desktop/mobile and blur/grayscale renders that were previously missing; keyboard/focus restoration, long names, zoom, every interactive contrast state and screen-reader announcements still require validation. Static screenshots and token calculations do not establish full accessibility. Use the Refactoring UI diagnostic below for evidence, not a blanket certification.

**Owner:** design/frontend. **Gate:** screen approval and first shared controls.

### R-13 · P2 · New result entry selects a winner before the operator makes a choice

**Evidence:** `prototypes/frontend/app.js:17` and [the new-result dialog](evidence/dialog-new.png) initialise an unresolved match with the first entrant winning, show the resulting points and enable confirmation.

**Scenario:** the operator opens the next match and confirms immediately or by keyboard, inadvertently accepting a plausible default as an observed result.

**Closure:** review an explicit unselected “Select outcome” state for a new result and require a deliberate choice before confirmation. Preserve the existing result when opening a correction, with the previous/new review visible. This is an interaction recommendation for the H1 operator surface; no automatic scoring-policy change is implied.

**Owner:** product/design. **Gate:** H1 result-entry screen.

## Existing open gaps and their closure work

| Existing gap | Consolidated finding | Deliverable |
| --- | --- | --- |
| G-01 Private access | R-05 | H1 operational read scope; H2 invitation expiry and rights separately |
| G-02 Publication changes | R-07 | Visibility-transition table and public/private cache examples |
| G-03 Postponed deadlines | R-07 | Explicit deadline/freeze change policy and review screen |
| G-04 Guest identity | R-05 | Organisation identity scope, duplicate handling and deferred claim policy |
| G-05 Finalisation freshness | R-04 | Observable revision barrier and concurrent-correction acceptance |
| G-06 Match exceptions | R-02 | Terminal outcome matrix including double absence and voiding |

## Minimum visual coverage before each slice

“Partial” means useful composition exists, not that the flow is accepted or implemented.

| Journey/surface | Existing support | Missing review evidence | Delivery |
| --- | --- | --- | --- |
| UJ-01 access and organisation context | Admin organisation label only | First organisation, no membership, context switch, access lost/denied | H1 |
| UJ-02 tournament preparation | Overview for an existing running individual league | Empty dashboard; individual/team editor; profile/visibility preview; invalid or incomplete configuration | H1 |
| UJ-02 entries/check-in | Read-oriented entry composition | Add guest/alias; last slot; waiting versus admitted; failed admission; absence review; explicit field change after publication | H1 |
| UJ-03 direct teams | PPT conceptual roster/lineup diagram | Team-slot capacity; seven-person roster with five starters; freeze; 4-of-5 blocker; valid lock; sanction/departure consequence | H1 |
| UJ-02 rounds/results | Two PNG variants and individual prototype | Canonical consistent fixture; draft/published transitions; no-show/concession/double absence; cross-round availability | H1 |
| UJ-06 correction/incidents | Basic correction dialog composition | Previous/new effective versions; actual-play impact; stale save; blocked dependency; reopening | H1 operator; reports/disputes H2 |
| UJ-07 public read by link | Public detail/standings direction | Alias-only identity; no private roster leak; stale/updating/failure; cancellation/revised final result; private denial | H1 |
| UJ-08 independent API journey | Written API rules and conceptual PPT | Worked request/receipt/error examples; lost response; stale revision; revoked scope; individual/team variants | H1, no extra app UI required |
| UJ-04/05 discovery/self-service | Discovery PNG and partial browsing prototype | Own entry, admission/check-in next action, represented team, report/confirm/dispute and personal history | H2, not an H1 blocker |

For each affected H1 surface, review desktop and a deliberate mobile next-action composition, with empty, loading, populated, blocked, stale and failed states where applicable. A state catalogue should grow with the first shared controls rather than becoming a third product application.

## Refactoring UI diagnostic

The current **admin/discovery compositions score 8/10**: six of eight diagnostic rows pass. **Including the result dialogs, the reviewed set scores 6/10**: five of eight pass, using `round(passed / 8 × 10)`. This is a scoped visual diagnostic, not a functional-completeness score or accessibility certification. The older prototype note's 5/10 was a pre-refinement source assessment and should not be reused as the current score.

| Diagnostic | Current assessment | Evidence and action needed |
| --- | --- | --- |
| Hierarchy survives blur | Pass for sampled views | One lime next-result action, quiet corrections and clear public heading remain distinguishable in [admin blur](evidence/admin-blur.png) and [discovery blur](evidence/discover-blur.png). Keep the important action above competing decoration. |
| Works in grayscale | Pass for sampled views | Labels and grouping preserve meaning in [admin grayscale](evidence/admin-grayscale.png) and [discovery grayscale](evidence/discover-grayscale.png). Status meaning is textual. The closed-status contrast defect still fails the separate contrast row. |
| Enough white space | Pass for sampled views | Sections and table groups are distinct; mobile uses stacked match cards. Verify long names and lower-page states before generalising beyond these examples. |
| Labels subordinate to values | Pass in tables; fail in dialogs | Table metadata is quieter than opponents/outcomes. Dialog Outcome/Correction reason labels are 14 px semibold while input values are 14 px regular (`style.css:11` and `:1`). Give selected competitive facts more emphasis without making labels unreadable. |
| Consistent spacing scale | Fail | Most spacing is normalised, but `.profile` retains 80 px top padding (`style.css:1`) and the footer 28 px margin (`app.js:10`), outside the declared scale. Review whether these need scale tokens or a documented layout exception; arbitrary one-offs should not become shared defaults. |
| Constrained text width | Pass for sampled views | Public content, supporting prose and result dialogs use bounded widths. Preserve this in missing configuration/error states. |
| Sufficient contrast | Fail | Closed-registration badge 1.13:1; focus/boundary combinations need inverse/default-surface verification. Fix R-12 and test states, not only the palette. |
| Appropriate elevation | Pass for sampled views | Flat tables/cards and separated modal overlays give depth a purpose; square geometry is consistent. |

To reach **10/10 for this sampled set**, resolve dialog label/value hierarchy, remaining scale exceptions and contrast, then repeat the same views and states. Passing this diagnostic does not close the absent H1 journeys in R-09.

The three PNG mockups have useful hierarchy, whitespace and textual statuses, but their raster form cannot certify a component scale, focus behaviour or interactive states. They are not assigned an implementation-quality score. R-08's contradictory fixture must be resolved independently of appearance.

## Recommended closure sequence

1. **Reconcile the baseline:** R-01/R-08. Mark the authoritative docs, accepted scope, proposed clauses and superseded visual references. Update the PPT's version and real review questions.
2. **Close the H1 rule decisions:** R-02–07. Assign one decision owner and a before-development gate to each. Record expected outcomes for exceptions, team eligibility, private reads and finalisation races.
3. **Review the missing H1 flow states:** R-09/R-10/R-13. Prioritise one individual flow and one direct-team flow, then safe correction, finalisation and public following. Apply Refactoring UI to those compositions before decorative polish of H2 discovery.
4. **Prepare bounded OpenSpec slices:** trace each accepted rule to an acceptance scenario and its visual reference where applicable. Then validate the relevant proposal. This review is a design note, not an approved implementation proposal.

Suggested acceptance fixtures include four individuals/six matches, five entrants with zero-point rests, four five-player teams/six aggregate matches, seven-player roster with two unused reserves, 4-of-5 blocked start, same-name guests in different organisations, the final-slot race, both withdrawal orders, withdrawal during play, zero remaining active entrants, lost-response retry, revoked access, public-to-private transition, postponed freeze, concurrent finalisation/correction, and actual-play versus administrative participation. Expected outcomes that remain open must be decided explicitly before those fixtures become executable specifications.

## Deliberate deferrals

Do not expand H1 to solve participant self-service, independent dispute confirmation, broad invitations and account claims, full Swiss pairing, composite encounters, in-match substitutions, webhook delivery, circuits or a general application-management console. Their absence is documented sequencing, not an H1 defect. The H1 API still needs a pilot authority procedure and examples; it does not need a real H4 game-engine integration to demonstrate the operator league.

## Verification and limits

- Reviewed the current uncommitted baseline, not only HEAD.
- Read all 12 PPT slides and their speaker notes; rendered the deck through LibreOffice to PDF and page images. No material clipping or overlaps were observed. Font substitution remains a limitation of this renderer compared with the author's PowerPoint installation.
- Inspected all three mockup PNGs directly. They are conceptual rasters, not measurable component implementations.
- Rendered admin and discovery in headless Chrome at 1600×1100 and 390×844. Rendered new-result and correction dialogs at 1600×1100 only. Created grayscale/blur desktop views from temporary HTML copies referencing the original CSS/JS. These are rendering checks, not an interaction test. The local server was stopped afterwards. Manual keyboard/screen-reader testing and a complete interaction suite were not performed.
- Preserved representative [desktop admin](evidence/prototype-admin-desktop.png), [mobile admin](evidence/prototype-admin-mobile.png), [desktop discovery](evidence/prototype-public-desktop.png), [mobile discovery](evidence/prototype-public-mobile.png), [new result](evidence/dialog-new.png), [correction](evidence/dialog-correction.png), and PPT contact sheets in `evidence/`. Mobile captures show the viewport, not proof of every below-fold state.
- The report changes no product code, source document, PPT or mockup. It adds this review note, an input manifest and review captures in the new worktree. No product test run is warranted by a documentation-only review.

