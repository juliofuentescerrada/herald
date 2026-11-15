## 1. Review gates

- [ ] 1.1 Obtain scope and visual input for the screen/state inventory; record approved references and unresolved exceptions in design.md. Do not mark implementation ready before visual approval.
- [ ] 1.2 Record explicit implementation approval, confirm overlap/dependency baseline and split into approved slices if required by ADR 0018. Validate the change.

## 2. Navigation and phase context

- [ ] 2.1 Implement route-based tournament section navigation and published-list schedule access, preserving dirty-form and access boundaries.
- [ ] 2.2 Apply shared lifecycle emphasis, phase-correct copy and immutable configuration cues; preserve current domain rules.

## 3. Operational task composition

- [ ] 3.1 Recompose schedule pairing/outcome/state/destination records and result selection surfaces with native semantics.
- [ ] 3.2 Put result work before read-only started lineups and protect unsaved lineup changes; retain explicit save/discard and conflict handling.
- [ ] 3.3 Improve entry/roster search action hierarchy and retry, failed-load recovery, empty/history presentation and numeric/copy consistency.
- [ ] 3.4 Fix List/Entries intermediate-width reflow and inspect affected shared control/catalogue examples; update live component/icon guidance only for changed APIs or meanings.

## 4. Evidence and acceptance

- [ ] 4.1 Add meaningful unit and browser coverage for every delta scenario with covers markers; retain existing domain/permission/concurrency tests.
- [ ] 4.2 Add a synthetic seeded script in e2e/scripts with a screenshot for each changed review state; run affected creation/publication, entries/check-in, schedule/start, lineup/result journeys.
- [ ] 4.3 Compare approved visuals at 1440/390/699/700/320 px, long content and 200% zoom; keyboard/focus/Escape, axe and screen-reader spot checks; record executed versus unverified states in design.md.
- [ ] 4.4 Run repository rules, appropriate web checks, spec coverage and OpenSpec validation. If endpoints/handlers change through reviewed scope, regenerate Wolverine/OpenAPI code and test the affected backend.
- [ ] 4.5 Run UI-guidance checks if guidance/routing changes; complete read-only herald-reviewer review, resolve findings, sync implemented specifications and archive with ownership-appropriate documentation updates in the implementation PR.
