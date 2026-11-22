## 1. Review gates

- [x] 1.1 Record in proposal.md that merging the batch 3 proposals pull request approved this change, with the review's answers to Q1 and Q2 and any change it asked for (ADR 0018); verify with `openspec validate h1-api-journey`

## 2. Receipts

- [x] 2.1 `Receipt`, the `Operation-Id` middleware and `IReceiptSource` in `Herald.ModuleHosting` (design D-1, D-2); tests
- [x] 2.2 Each module maps receipts; migrations; the receipt endpoint; API tests for every `operation-receipts` scenario, including another organisation's receipts and draft deletion

## 3. Contract

- [x] 3.1 Identifier review test and fixes (D-3); problem types per operation in the OpenAPI documents; tests for the `api-description` scenarios
- [ ] 3.2 The admin `api-client` sends `Operation-Id` on mutations
- [ ] 3.3 Regenerate Wolverine code (`codegen write`) and the OpenAPI documents and client (`pnpm api:generate`); CI drift checks pass

## 4. Journey and examples

- [ ] 4.1 `docs/api/individual-league.md` and `docs/api/team-league.md`
- [ ] 4.2 Journey 30 (D-4); the suite passes
- [ ] 4.3 Test script in `e2e/scripts/`: the journey's requests and responses as text captures, and a screenshot of the admin Standings page it compares with

## 5. Validation and completion

- [ ] 5.1 `covers` markers for every scenario this change adds; `node scripts/spec-coverage.mjs` passes
- [ ] 5.2 Full run (`scripts/check all` and the e2e suite); record in design.md
- [ ] 5.3 Docs: roadmap H1 exit criteria checked against the batch, herald-reviewer review of the diff; sync the specs and archive the change in the slice's pull request
