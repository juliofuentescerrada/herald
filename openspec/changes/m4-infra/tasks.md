## 1. Review gates

- [x] 1.1 Record in proposal.md that merging the M4 batch proposals pull request approved this change, with the review's answer to Q1 and any change it asked for (ADR 0018); verify with `openspec validate m4-infra`

## 2. Infrastructure

- [x] 2.1 `versions.tf`, `backend.tf`, the shared resources by name (D-1)
- [x] 2.2 Slot identities and their AcrPull (D-2); Application Insights per slot
- [x] 2.3 The container apps and the job per slot, ingress, probes and configuration (D-3, D-4), placeholder images
- [ ] 2.4 The databases' import behind `databases_onboarded` (D-5); `budget-herald` with its three alerts
- [ ] 2.5 `infra/infra.test.mjs` for the `cloud-infrastructure` scenarios; `tofu fmt -check` and `tofu validate` locally

## 3. Plan on pull requests

- [ ] 3.1 `.github/workflows/infra.yml` (D-6) and its classification in `scripts/ci-changes.mjs`, with a `covers`-marked test; the plan on this slice's pull request creates only `rg-herald`'s resources

## 4. First apply and Steward

- [ ] 4.1 After merge, with the maintainer's authorisation: the first `apply` from `main`; the slot identities' object ids handed to Steward's operator outside Git, for `onboard-herald` group 5
- [ ] 4.2 After group 5: `databases_onboarded` set and a plan that only imports the two databases

## 5. Validation and completion

- [ ] 5.1 `covers` markers for every scenario this change adds; `node scripts/spec-coverage.mjs` passes
- [ ] 5.2 Full run (`scripts/check all`); record the plan's summary in design.md
- [ ] 5.3 Test script in `e2e/scripts/`: the plan's summary and `az resource list -g rg-herald` (names only) as text captures
- [ ] 5.4 herald-reviewer review of the diff; sync the specs and archive the change in the slice's pull request
