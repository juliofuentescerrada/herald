## 1. Review gate

- [x] 1.1 Maintainer reviews the proposal, the spec and design D-1 to D-5 (the icon table, R-1 and R-2); record the answers and implementation approval in proposal.md and design.md; `openspec validate ui-icons`

## 2. ui library

- [x] 2.1 Add the table's icons to the `herald-icon` registry, the `empty` size (32 px) and a `data-icon` attribute; `StatusLabel` and `NavLink` take an optional `icon`
- [x] 2.2 Specs for the new inputs, the size and the decorative icons; the catalogue's controls page shows them

## 3. Admin application

- [x] 3.0 Capture the screens of design.md's Visual input at 1440 and 390 px before any change
- [x] 3.1 Rail navigation icons; `lifecycleLabels` with icons in the list, configuration form and entries page; check-in label icons
- [x] 3.2 Back and entries links, and the empty panels' icons
- [x] 3.3 Page specs for each `interface-icons` scenario, with `covers` markers; axe passes; lint and boundary checks pass

## 4. Test script and validation

- [x] 4.1 Test script in `e2e/scripts/` (seeded data, `scriptPersona`) with a screenshot of the shell, the tournament list and the entries page with their icons
- [x] 4.2 Full run (`scripts/check all`, e2e suite), the admin bundle size before and after; record in design.md
- [ ] 4.3 Capture the same screens after the change and compare with 3.0; maintainer run through Aspire; record differences in design.md
- [ ] 4.4 Update `docs/herald-visual-direction.md` §4 (empty-state size) and §9.3, `docs/roadmap.md` and `README.md`; acceptance review in design.md

## Workflow follow-up

- Archive `ui-icons` in a separate PR after merge.
