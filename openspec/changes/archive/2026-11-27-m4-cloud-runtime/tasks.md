## 1. Review gates

- [x] 1.1 Record in proposal.md that merging the M4 batch proposals pull request approved this change, with the review's answer to Q1 and any change it asked for (ADR 0018); verify with `openspec validate m4-cloud-runtime`

## 2. Host

- [x] 2.1 `Herald:Messaging:Broker` (D-1), E2E through the same option; host tests for the `cloud-runtime` broker scenario
- [x] 2.2 Entra authentication for the data source (D-2); the packages and their transitive licences pass `scripts/rules.mjs`; a test of the token-provider configuration
- [x] 2.3 Health in a deployment (D-3) and telemetry export with sampling (D-4); host tests for both scenarios

## 3. Public server and seeding

- [x] 3.1 `/api` forwarding in `server.ts` (D-5); a Vitest test with a stub API
- [x] 3.2 The seeding tool's reset (D-6); tests against real PostgreSQL for both `synthetic-data` scenarios

## 4. Validation and completion

- [x] 4.1 `covers` markers for every scenario this change adds; `node scripts/spec-coverage.mjs` passes
- [x] 4.2 Full run (`scripts/check all` and the e2e suite, which now runs without a broker through the option); record in design.md
- [x] 4.3 Test script in `e2e/scripts/`: the host without a broker, its `/alive` and `/health` answers as text captures, and a public tournament page served through the `/api` forwarding, with a screenshot
- [x] 4.4 herald-reviewer review of the diff; sync the specs and archive the change in the slice's pull request
