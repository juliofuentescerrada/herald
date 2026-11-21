## 1. Review gates

- [x] 1.1 Record in proposal.md that merging the batch 3 proposals pull request approved this change, with the review's answers to Q1 and Q2 and any change it asked for (ADR 0018); verify with `openspec validate h1-public-read`

## 2. Standings and Tournaments

- [ ] 2.1 Standings publishes `TournamentStandingsChanged` v1 through the outbox; tests for the `standings` scenario
- [ ] 2.2 Tournaments projections of schedule, results and standings; `ChangeVisibility`; migration (design D-1, D-3)
- [ ] 2.3 `GetPublicTournament` (public document) and `GetPublicPreview` (admin); API tests against PostgreSQL for every `public-tournament-page` scenario, including private, draft and unknown links and the absence of private fields
- [ ] 2.4 Regenerate Wolverine code (`codegen write`) and the OpenAPI documents and clients (`pnpm api:generate`); CI drift checks pass

## 3. Public and admin applications

- [ ] 3.1 Public app: `/tournaments/:id` server-rendered page with Overview, Rounds, Standings and Changes, and the not-available page (D-5)
- [ ] 3.2 Admin `tournaments` feature: Visibility panel, change dialog, preview
- [ ] 3.3 Vitest for each Visual input state and `axe-core`; lint and boundary checks pass

## 4. End-to-end journey and seeds

- [ ] 4.1 `tools/Herald.Seed`: a public running tournament, an unlisted finalised one and a private one
- [ ] 4.2 Journey 28; the suite passes
- [ ] 4.3 Test script in `e2e/scripts/` (seeded data, `scriptPersona`) with a screenshot per step: public page before start, running with standings, explanation, final, visibility change, not available

## 5. Validation and completion

- [ ] 5.1 `covers` markers for every scenario this change adds; `node scripts/spec-coverage.mjs` passes
- [ ] 5.2 Full run (`scripts/check all` and the e2e suite); record in design.md
- [ ] 5.3 Capture the Visual input states at 1440 and 390 px, compare with the prototypes and record the differences in design.md
- [ ] 5.4 Docs: visual direction §8 and §9.3 inventory, herald-reviewer review of the diff; sync the specs and archive the change in the slice's pull request
