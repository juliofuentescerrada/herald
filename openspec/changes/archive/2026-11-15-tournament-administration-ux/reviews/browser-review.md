# Signed-in administration browser review

Date: 15 November 2026. Completes the read-only assessment for scope discussion, not implementation acceptance or approval. Supplements [assessment.md](assessment.md); the original source inventory remains useful for states that cannot be exercised without writes or fault injection.

Subsequent maintainer authorisation identified the seed data as disposable. See [operational review](operational-review.md) for mutations actually executed, expanded coverage and the local state left changed. Statements below about no writes and blocked cancellation describe this earlier read-only round only.

## Environment and evidence

Chrome extension connected through the desktop application. Existing owner session and seeded organisation were used. Local source baseline is `cfc6fa6`; the browser application's exact build revision was not independently exposed or verified. Record names below are synthetic scenario names. No account identifiers, organisation identifiers, private route identifiers or signed-in screenshots are committed.

Method: visible accessibility trees, page screenshots inspected in the session, native link/control interaction, read-only DOM width measurements, temporary viewport overrides. The original viewport was approximately 1905 × 930; explicit checks used 1440/390/320 and 699/700 CSS px as listed below. Overrides were reset at the end and the user's tab was returned to Tournaments. There were no saved configuration/lineup/result changes, entries added/cancelled, check-ins changed, schedule changes or lifecycle operations. Local selections and search text were discarded through normal navigation.

## Screens actually inspected

| Surface | Browser evidence / outcome |
| --- | --- |
| List | Draft, published/preparing and running individual/team records; capacity/waiting facts and destinations. Wide screenshot and responsive measurements. Running lacks distinct visual emphasis; no schedule destination. |
| Running individual configuration | Registration closed, competition start record, entries/schedule summaries and editable configuration fields. “No match has started” is displayed although the same tournament's schedule contains resolved and in-play matches. |
| Running team configuration | Same operation stack plus team structure. Start record and locked-field implications remain difficult to distinguish from ordinary editable configuration. |
| Preparing configuration | Mandatory pending check-in blockers and corrective links in Lantern League; team roster bounds blocker and published schedule lock in Harbour Cup. Blockers are specific and recovery destinations are present. Start/registration actions were not executed. |
| Create / draft editor | New blank form, default reference time zone, conditional team fields, existing complete saved draft. Team selection reveals roster sizes/active players. No data was saved. |
| Leave protection | Leaving a locally edited creation form opens the named discard dialog with initial focus on Stay. Escape returns to the form; reopening and choosing Leave discards only the new unsaved selection and returns to the list. |
| Publication review | Complete saved draft, grouped read-only values, scoring, visibility, explicit publication consequences and final action. Inspected at narrow/wide widths; Publish was never activated. |
| Individual entries | Full capacity with two waiting entrants, disabled admission with reason, confirmed/pending check-in and expanded cancelled history (Autumn League). Mandatory pending check-in/absent-at-start action (Lantern League). No entries/not-open state (Spring Open). |
| Team entries | Four admitted teams with complete/incomplete/empty rosters; check-in is separate from readiness (Harbour Team League). Running entries hide mutation controls and retain roster inspection (Saltmarsh Team League). |
| Add entry drawer | Existing/new modes for a team, alias field and explicit create/enter action. Inspected only; no submission. |
| Roster drawer | Incomplete editable roster, player-search step, existing player already on another active team, frozen roster and history. At 390 px the drawer fills the screen; Escape closes and restores focus to the roster trigger in the sample. |
| Individual schedule | Published/running with resolved wins, draw, in-play and scheduled matches. Desktop result displacement and ambiguous entrant links reproduced. Responsive samples below. |
| Team schedule | Scheduled match in running competition; published/preparing odd field with separate rests. Before start, pairings are plain text; after start they become match destinations. This difference follows current capability, not an absent route defect. |
| Blocked schedule | Mandatory pending check-in blocks generation; affected entrant and Open entries link are visible. No generation was executed. |
| Individual match | In-play outcome selection and resolved read-only summary. All outcomes initially unselected; Space selects Draw and enables Record result; ArrowDown selects the next option. No result was submitted. |
| Team match | Scheduled, two empty five-player lineups from seven-player frozen rosters, blockers, start disabled and result unavailable until start. Selecting one player updates 1 of 5 and exposes Discard changes. Leaving via Back to schedule offers no warning. No lineup was saved. |

## Responsive measurements

Widths are DOM measurements, not inferred from screenshot dimensions. `clientWidth` excludes the vertical scrollbar, so overflow compares `scrollWidth` to `clientWidth`, not to `innerWidth`.

| Screen | innerWidth | clientWidth | scrollWidth | Result |
| --- | ---: | ---: | ---: | --- |
| List | 320 | 305 | 305 | No page overflow in sample |
| List | 390 | 375 | 375 | No page overflow in sample |
| List | 699 | 684 | 684 | No page overflow in sample |
| List | 700 | 685 | 782 | **Gap: 97 px overflow** |
| List | 1440 | 1425 | 1425 | No page overflow in sample |
| Individual entries, admitted/waiting | 320 | 305 | 305 | No page overflow in sample |
| Individual entries, admitted/waiting | 699 | 684 | 684 | No page overflow in sample |
| Individual entries, admitted/waiting | 700 | 685 | 697 | **Gap: 12 px overflow** |
| Individual entries, admitted/waiting | 1440 | 1425 | 1425 | No page overflow in sample |
| Running individual schedule | 320 | 305 | 305 | No page overflow in sample |
| Running individual schedule | 390 | 375 | 375 | No page overflow in sample |
| Running individual schedule | 699 | 684 | 684 | No page overflow in sample |
| Running individual schedule | 700 | 685 | 685 | No page overflow in sample |
| Running individual schedule | 1440 | 1425 | 1425 | No page overflow in sample |
| Publication review | 320 | 305 | 305 | No page overflow in sample |
| Publication review | 700 | 685 | 685 | No page overflow in sample |
| Publication review | 1440 | 1425 | 1425 | No page overflow in sample |
| Scheduled team match | 320 | 305 | 305 | No page overflow in sample |
| Scheduled team match | 390 | 375 | 375 | No page overflow in sample |
| Scheduled team match | 700 | 685 | 685 | No page overflow in sample |
| Scheduled team match | 1440 | 1425 | 1425 | No page overflow in sample |

No overflow does not establish good hierarchy, target size, all-content responsive layout or accessibility. In the 390 px schedule screenshot, the first round only begins near the bottom of an 844 px viewport: shell, account, record lifecycle, summary and notice consume most of the initial view. Creation has similar shell/context overhead. The computed font stack requests Inter first; this does not prove which font rendered.

## Findings updated by browser evidence

| Finding | Updated disposition |
| --- | --- |
| TA-01 navigation | Confirmed. List lacks Schedule; peer navigation detours through configuration. Correction to the initial source-summary wording: the running entries notice refers to “round operations”, not Schedule, and supplies no link. Round operations is pending on this checkout. Avoid directing people to unavailable work. |
| TA-02 lifecycle | Confirmed visually: neutral header/list Running versus stronger Competition-area Running. Preserve lifecycle dimensions while unifying treatment. |
| TA-03 phase hierarchy | Confirmed operational friction: published configuration stacks registration, competition, entries, schedule and the full editor. Define the useful next action by phase without creating a new dashboard by default. |
| TA-04 start copy | Confirmed current-state contradiction within the same tournament. Treat as a content fix, not a request to fetch new match counts solely for this sentence. |
| TA-05 schedule rows | Confirmed desktop displacement; one pairing link visually resembles entrant links. Keep pairing, effective result, match state and destination in one understandable row/group. |
| TA-06 result task | Single-choice semantics and keyboard selection pass in the sampled in-play individual state. Visual choice hierarchy still needs improvement. Team result priority after start remains source-inspected only: the available team example was scheduled and no start was executed. |
| TA-09 history | Cancelled entries start collapsed and expand correctly; roster history starts collapsed. Empty roster history and initially open schedule history remain source findings, not browser-reproduced samples. |
| TA-10 responsive layout | Upgrade from risk to **should fix / P1** for List and Entries at 700 px. The current wide layout and rail leave too little width for fixed row actions. Preserve the breakpoint; allow safe row/group responsive layout within it. Other sampled pages do not reproduce overflow. |
| TA-12 unsaved work | Upgrade lineup navigation to **should fix / P1**: a one-player local selection is abandoned by Back to schedule without warning, unlike creation. Outcome choice also leaves without warning; whether that needs the same treatment is a product/interaction choice. Conflict reload rules remain source-inspected. |
| TA-13 content | Confirmed product-facing “Corrections come later” wording. The two-team schedule also says “1 rounds · 1 matches”; include singular/plural polish in affected summaries. Numeric font behaviour still needs dedicated verification. |

Additional scope candidates:

| ID | Criteria / severity | Evidence / expected direction |
| --- | --- | --- |
| TA-15 | G-06–07, G-10 / should fix, P2 | Running configuration exposes capacity/check-in and team-size controls as ordinary editable fields; some help says to cancel entries to unlock a setting even though running entries cannot be cancelled there. Domain policy forbids changing start-fixed values. Make immutable fields and the reason explicit; no rejected save was attempted. Preserve editable descriptive details. |
| TA-16 | G-01, G-04–05; RU-02–04 / review candidate, P2 | At 390 px the shell/account and repeated lifecycle/summary/notice push operational content down considerably. Review contextual density, especially for Schedule and Match, within current foundations; this does not approve a global shell redesign. |
| TA-17 | G-01, G-10; RU-03 / minor, P3 | Empty entries shows No entries yet followed by separate Admitted · 0 / No admitted entries and Waiting · 0 / No waiting entries. Reduce redundant empty-state copy while retaining useful capacity/action guidance. |

## Scope recommendation

Prioritise three coherent areas for the subsequent visual proposal:

1. **Tournament context and movement:** consistent lifecycle emphasis, direct schedule access, peer-section navigation and phase-aware hierarchy. Review the current hub and header density; use existing destinations first.
2. **Operational records and decisions:** readable schedule rows, clear match destination/outcome, more recognisable result choices, lineup/result priority and protection of unsaved lineup work. Keep preparation, started and resolved variants explicit.
3. **Preparation quality and resilience:** state-appropriate editor locks/help, entry/roster drawer action hierarchy, search retry and load recovery, empty/history copy, and the reproduced 700 px responsive layout failures.

Creation/publication need targeted consistency and recovery review, not a new wizard. Do not add standings, exceptional results, corrections, finalisation or departure operations through this UX change; coordinate their active changes separately. Existing screen content and domain rules remain authoritative until reviewed replacement visuals and specification deltas are approved.

## Remaining verification and limits

Not executed: save/publish/start/check-in/admit/cancel/withdraw/result writes, invalid submissions, request failures/retries, revision conflicts, uncertain-response reconciliation, duplicate creation, busy overlays, cross-tab/access replacement, complete focus cycling/trapping, screen-reader checks, axe, 200% zoom, long-content fixtures, every hover/focus colour pair and composed E2E. These need synthetic test scenarios, not writes to the owner's current examples. Selected Space/ArrowDown/Escape and focus-return observations are not a general keyboard/accessibility pass.

Opening the cancellation confirmation was rejected by automatic approval review because it was classified as risking a consequential entry cancellation while data was to remain unchanged. No alternate path was attempted. The confirmation therefore remains source-inspected only; this does not block scope assessment. Any later interactive cancellation test should use an explicitly disposable synthetic scenario.

The browser review establishes sufficient scope evidence to proceed to a visual proposal. It does not assert that all error/mutation states were manually tested or that current screens meet accessibility acceptance. Follow the existing visual-input process before implementation and run the affected synthetic journeys for the final accepted design.
