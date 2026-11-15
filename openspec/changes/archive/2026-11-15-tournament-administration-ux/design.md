# Tournament administration UX assessment

Status: approved design, 15 November 2026. The maintainer accepted the scope and generated references and authorised implementation. The maintainer requested the complete administration assessment followed by this OpenSpec proposal.

See [the assessment](reviews/assessment.md) for route/state coverage, evidence, findings and candidate scope, and [the completed browser review](reviews/browser-review.md) for the signed-in inspection, responsive layout measurements and explicit test limits. The read-only assessment is complete for scope discussion; mutation/error/concurrency verification belongs to the subsequent synthetic test round. At assessment time no production files, product decisions or existing change approvals were modified. The subsequent approval and implementation are recorded below.

The maintainer subsequently confirmed the local seeded data is disposable and authorised mutations. [The operational follow-up](reviews/operational-review.md) records the executed cancellation/promotion, team lineup/start/result and schedule generation/publication/withdrawal checks, including the resulting local data changes. Fault injection and concurrency remain unverified.

## Proposed implementation approach

### Context and destinations

Use app-local shared presentation for the tournament title, lifecycle labels and native route links. Features retain their route/query ownership; no feature imports another feature. Configuration, Entries and Schedule are peer destinations only on published records; Match retains a Back to schedule link and Schedule context. Keep draft review's fixed-title composition. Do not create a new dashboard or fetch per-record schedule details in the list: published records can navigate to the schedule's existing empty/blocked states.

### Hierarchy and selection

Use StatusLabel's existing info tone for Running and neutral for Preparing/publication/registration, with the existing reviewed icon meanings. Keep all three dimensions visible. In schedule rows, group names and effective result together, with status and a labelled View match link; plain names imply no profile destination. Before competition start the pairing remains read-only. After team match start, move Result before compact locked-lineup evidence; before start retain two editable lineup groups then Start and the blocked Result explanation.

Result choices remain native radios inside a fieldset. Larger labelled square surfaces provide a visible checked boundary/indicator and focus without relying on colour. The separate Record result operation remains the only submission; selecting a winner never writes. Outcome selection alone needs no leave prompt; dirty lineups do. Integrate lineup dirty registration with the existing app-level unsaved-input/leave mechanism, including access replacement, without storing private data outside its current context.

### Recovery and state presentation

Use existing query refetch paths for unchanged search retry and both match/tournament load dependencies. Keep failure messages local and distinguish retry from no results. Start-fixed fields use read-only values or disabled controls with an associated explanation; match the backend's existing lock set rather than deriving authority from dates. Correct false progress copy without a new progress endpoint. Use secondary repeated search-result actions, omit empty history, collapse populated history with a count and remove redundant empty-entry prose. Preserve cancelled-roster inspection and no-toast updates.

### Responsive and shared-control boundaries

Allow text children to shrink and wrap, and row actions to wrap or stack within the available content width, including the rail at 700 px. Preserve full-width stacked groups, square geometry, tokens and the below-700 breakpoint. Apply numeric roles only to comparable values. Prefer app-local presentation when domain-specific; a genuinely reusable new control requires shared API/intent, catalogue and accessibility coverage in the same implementation. No new icon meaning is currently proposed; navigation and ordinary admin actions remain text only except existing documented cues.

## Visual review gate and state matrix

The Screens section of proposal.md plus the assessment inventory is the affected state matrix. For each modified state, obtain a reviewed wide/narrow reference and compare actual implementation using G-01–12/RU-01–10; treat loading/error/conflict/access and long-content variants explicitly rather than accepting only populated screenshots. The maintainer explicitly requested agent-generated references. See [navigable prototype](../../../../prototypes/frontend/tournament-admin-ux.html) and [state inventory](../../../../prototypes/frontend/tournament-admin-ux.md). The maintainer subsequently approved these references and opened the implementation gate; see Implementation approval below. The reviewed input can narrow which preparation screens actually change.

## Validation and implementation dependencies

The proposal initially contained artifacts and dated evidence only. The approved implementation now includes scenario tests and covers markers; execution evidence and limitations are recorded in the implementation review. Preserve current domain contracts, expected revisions, retry identities, access boundaries and notification policy. Coordinate active competition changes before choosing the implementation baseline; if their scope changes the screen inventory, update this design and review references first. No handler, event, API or database change is intended.

## Reference validation — 15 November 2026

The maintainer authorised generating the references after reviewing the assessment. The prototype has 94 deterministic fixtures across eight page families, including shared loading/failure/conflict/busy/access states. Chrome rendered all 94 at 390 px with a main region present and no page horizontal overflow. Additional List (long title), Entries (waiting), Schedule (running) and team Match (in play) samples had scrollWidth equal to clientWidth at 320/699/700/1440 px. Schedule and team-result screenshots were visually inspected at wide/narrow sizes. Temporary viewport overrides were reset. These are prototype rendering/layout checks, not production E2E, screen-reader, full keyboard or API acceptance.

The previous PR rules failure was reproduced from its CI log: the spelling check rejected several documentation words. Those words were replaced with ordinary alternatives; no dictionary exception or rule suppression was added. The full tracked-file rules command is used for validation of this update.

The reference review found five simulation inconsistencies (phase labels, unchanged search retry, staying with dirty lineups, the submitted outcome and conflict blocking). All were corrected. Chrome then confirmed that Draw resolves as Draw, Stay retains the ten selected lineup boxes, search retry retains Alex and a match conflict keeps both radios and submission disabled. These are fixture interactions only.

## Implementation approval

The maintainer approved the generated references and application of this change on 15 November 2026. Earlier pending statuses above describe proposal history; the approval gates are now satisfied. No acceptance of future domain capabilities is implied.

## Implemented composition and validation

See [implementation conformance](reviews/implementation-review.md) for the G-/RU- review, reference comparison, synthetic evidence, reviewer findings and explicit unverified states. The UI is implemented with existing controls and app-local presentation; endpoint and handler generation is not applicable because neither changed. The baseline remains main cfc6fa6.
