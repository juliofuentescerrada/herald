# Tournament administration UX assessment

Status: proposed design, 15 November 2026; not approved for implementation and pending visual input. The maintainer requested the complete administration assessment followed by this OpenSpec proposal.

See [the assessment](reviews/assessment.md) for route/state coverage, evidence, findings and candidate scope, and [the completed browser review](reviews/browser-review.md) for the signed-in inspection, reflow measurements and explicit test limits. The read-only assessment is complete for scope discussion; mutation/error/concurrency verification belongs to the subsequent synthetic test round. No production files, product decisions or existing change approvals are modified. Visual input and implementation tasks remain for the subsequent proposal stage.

The maintainer subsequently confirmed the local seeded data is disposable and authorised mutations. [The operational follow-up](reviews/operational-review.md) records the executed cancellation/promotion, team lineup/start/result and schedule generation/publication/withdrawal checks, including the resulting local data changes. Fault injection and concurrency remain unverified.

## Proposed implementation approach

### Context and destinations

Use app-local shared presentation for the tournament title, lifecycle labels and native route links. Features retain their route/query ownership; no feature imports another feature. Configuration, Entries and Schedule are peer destinations only on published records; Match retains a Back to schedule link and Schedule context. Keep draft review's fixed-title composition. Do not create a new dashboard or fetch per-record schedule details in the list: published records can navigate to the schedule's existing empty/blocked states.

### Hierarchy and selection

Use StatusLabel's existing info tone for Running and neutral for Preparing/publication/registration, with the existing reviewed icon meanings. Keep all three dimensions visible. In schedule rows, group names and effective result together, with status and a labelled View match link; plain names imply no profile destination. Before competition start the pairing remains read-only. After team match start, move Result before compact locked-lineup evidence; before start retain two editable lineup groups then Start and the blocked Result explanation.

Result choices remain native radios inside a fieldset. Larger labelled square surfaces provide a visible checked boundary/indicator and focus without relying on colour. The separate Record result operation remains the only submission; selecting a winner never writes. Outcome selection alone needs no leave prompt; dirty lineups do. Integrate lineup dirty registration with the existing app-level unsaved-input/leave mechanism, including access replacement, without storing private data outside its current context.

### Recovery and state presentation

Use existing query refetch paths for unchanged search retry and both match/tournament load dependencies. Keep failure messages local and distinguish retry from no results. Start-fixed fields use read-only values or disabled controls with an associated explanation; match the backend's existing lock set rather than deriving authority from dates. Correct false progress copy without a new progress endpoint. Use secondary repeated search-result actions, omit empty history, collapse nonempty history with a count and remove redundant empty-entry prose. Preserve cancelled-roster inspection and no-toast updates.

### Responsive and shared-control boundaries

Allow text children to shrink and wrap, and row actions to wrap or stack within the available content width, including the rail at 700 px. Preserve full-width stacked groups, square geometry, tokens and the below-700 breakpoint. Apply numeric roles only to comparable values. Prefer app-local presentation when domain-specific; a genuinely reusable new control requires shared API/intent, catalogue and accessibility coverage in the same implementation. No new icon meaning is currently proposed; navigation and ordinary admin actions remain text only except existing documented cues.

## Visual review gate and state matrix

The Screens section of proposal.md plus the assessment inventory is the affected state matrix. For each modified state, obtain a reviewed wide/narrow reference and compare actual implementation using G-01–12/RU-01–10; treat loading/error/conflict/access and long-content variants explicitly rather than accepting only populated screenshots. No replacement mockups have been supplied or approved. Under herald-screens, the maintainer is asked to supply mockups for those screens/states; this proposal remains pending visual input. The reviewed input can narrow which preparation screens actually change.

## Validation and implementation dependencies

This PR adds proposal artifacts and dated evidence only. Delta scenarios are future acceptance requirements; their tests and covers markers are tasks, not executed implementation evidence. Preserve current domain contracts, expected revisions, retry identities, access boundaries and notification policy. Coordinate active competition changes before choosing the implementation baseline; if their scope changes the screen inventory, update this design and review references first. No handler, event, API or database change is intended.
