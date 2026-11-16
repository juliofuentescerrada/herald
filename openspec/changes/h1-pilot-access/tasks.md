## 1. Review gates

- [x] 1.1 Record in proposal.md that merging the batch 3 proposals pull request approved this change, with the review's answers to Q1 and Q2 and any change it asked for (ADR 0018); verify with `openspec validate h1-pilot-access`

## 2. Host and Organisations

- [x] 2.1 `PilotApplication` role, `Caller` kind and the grant in `OrganisationContext` (design D-1); host tests
- [x] 2.2 `ApplicationGrant`, `GrantApplication`, `RevokeGrant`, `ListGrants`; `IOrganisationAccess` resolves grants; migration (D-2); domain and API tests
- [x] 2.3 Operation groups on every admin endpoint and the filter (D-3, D-4); a host test for missing groups; API tests for every `pilot-access` scenario, including revocation between requests and another organisation's 404s
- [x] 2.4 Regenerate Wolverine code (`codegen write`) and the OpenAPI documents and client (`pnpm api:generate`); CI drift checks pass

## 3. Admin application

- [x] 3.1 `organisations` feature: Applications page, grant dialog, revoke confirmation (D-5)
- [x] 3.2 Vitest for each Visual input state and `axe-core`; lint and boundary checks pass

## 4. End-to-end journey, procedure and seeds

- [x] 4.1 The fake identity provider issues application tokens (ADR 0015); `tools/Herald.Seed`: an organisation with an active and a revoked grant
- [ ] 4.2 Journey 29; the suite passes
- [ ] 4.3 Test script in `e2e/scripts/` (seeded data, `scriptPersona`) with a screenshot per step: empty page, grant dialog, list, revoke confirmation
- [ ] 4.4 `docs/operations/identity.md`: provisioning and revocation for interactive and server pilot applications

## 5. Validation and completion

- [ ] 5.1 `covers` markers for every scenario this change adds; `node scripts/spec-coverage.mjs` passes
- [ ] 5.2 Full run (`scripts/check all` and the e2e suite); record in design.md
- [ ] 5.3 Capture the Visual input states at 1440 and 390 px, compare with the prototypes and record the differences in design.md
- [ ] 5.4 Docs: visual direction §9.3 inventory, ADR 0014 follow-up answered, herald-reviewer review of the diff; sync the specs and archive the change in the slice's pull request
