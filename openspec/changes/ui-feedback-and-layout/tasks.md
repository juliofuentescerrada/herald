## 1. Review gates

- [x] 1.1 Maintainer supplies the mockups listed in design.md (Visual input); record their references in design.md
- [x] 1.2 Maintainer reviews the proposal, specs and design (D-1 to D-7, A-1 to A-4) against the mockups; record implementation approval in proposal.md and design.md
- [x] 1.3 Record the rules in `docs/herald-visual-direction.md`: §4 named widths, aside, breakpoints and line length; §5 feedback matrix, Dialog, Drawer and Toast contracts, and the actionability rule; §7 and §8 admin and public compositions

## 2. `ui` controls and tokens

- [x] 2.1 Width and aside tokens; breakpoints documented
- [x] 2.2 `Dialog` on `ng-primitives` (title as question, consequence, confirm/destructive and leave actions, Escape, focus trap and return, busy state that cannot close or repeat, error content, full width on narrow screens)
- [x] 2.3 `Drawer` on the same primitive (side placement, full screen below 700 px, same focus and busy rules)
- [x] 2.4 Toast service and outlet (success and info, polite announcement, at least 5 seconds, pause on hover and focus, dismiss, at most three, nothing rendered on the server)
- [x] 2.5 Catalogue entries for each control and state; Vitest with `axe-core`; lint and boundary checks pass

## 3. Admin application

- [x] 3.1 Platform: toast outlet in the shell; toasts cleared on a change of organisation or person; `CONFIRM` opens the dialog (`confirmLeave` and "Reload latest")
- [x] 3.2 Layout classes in the global stylesheet; tournament list (`wide`), review (`form`), organisation selector and creation and not-found pages (`focused`); 900 px breakpoint removed
- [x] 3.3 Tournament configuration: `form` width with an aside for registration and entries; "Changes saved" as a toast; draft composition as the mockups show
- [x] 3.4 Entries page: `wide` with aside; cancellation and out-of-order admission dialogs; add drawer; toasts for additions, admissions and cancellations; cancelled entries collapsed, compact and omitted when empty; pending decisions in the summary
- [x] 3.5 Vitest updated and extended for every state of design.md's Visual input, with `axe-core`

## 4. Public application

- [x] 4.1 Toast outlet (client-side only); home content capped at 1200 px; SSR isolation check passes

## 5. End-to-end journeys

- [x] 5.1 Update journeys whose confirmations or messages change (8, 11, 13, 14 and any other found by the run); the suite passes

## 6. Validation and completion

- [x] 6.1 Full run: format, build, all .NET tests, web lint/tests/boundaries/builds, SSR check, codegen and API drift checks, e2e suite; record in design.md
- [ ] 6.2 Capture the Visual input states at 1440 and 390 px and compare with the mockups; maintainer run through Aspire; record differences in design.md
- [x] 6.3 Update `docs/herald-visual-direction.md` §9.3, `docs/roadmap.md`, `README.md`, `CLAUDE.md` status and `openspec/config.yaml`; acceptance review against the specs in design.md
