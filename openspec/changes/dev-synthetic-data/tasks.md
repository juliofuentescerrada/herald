## 1. Approval

- [x] 1.1 Maintainer review of the proposal, specs and design, with answers to Q-1 to Q-3; record the approval in `proposal.md`

## 2. Shared test support

- [ ] 2.1 Create `tests/Herald.Testing` with `HostFactory` and `TestTokens` moved from `tests/Herald.Host.Tests`, the factory taking a target connection string and an option to keep the database; add it to `Herald.slnx`
- [ ] 2.2 Point `tests/Herald.Host.Tests` at it; all .NET tests pass unchanged

## 3. Seeding tool

- [ ] 3.1 Create `tools/Herald.Seed` (console) referencing the host and `Herald.Testing`; configuration of personas (D-3) and the production refusal (D-6), with tests
- [ ] 3.2 Scenario runner: fixed order, skip when the persona already owns the scenario's organisation (D-5), report per scenario, waiting for the outbox to drain with a timeout (D-2)
- [ ] 3.3 Fixed invented name lists and relative dates (D-4)
- [ ] 3.4 Scenarios: empty organisation; draft; published with registration not open; open with a waiting queue; closed; team tournament with incomplete and complete rosters; second organisation for isolation
- [ ] 3.5 Tests that read as sentences for the spec's scenarios, against real PostgreSQL

## 4. Local environment and CI

- [ ] 4.1 AppHost: optional persona parameters and the seeding resource that waits for the host and runs once, or shows why it is skipped (D-8)
- [ ] 4.2 CI and `scripts/check dotnet`: seed a throwaway database with every scenario (D-9)

## 5. Documents and review

- [ ] 5.1 `docs/operations/identity.md` and `CLAUDE.md`: the seeding command and the persona user secrets
- [ ] 5.2 Maintainer run through Aspire: signing in shows the seeded organisation; record it in `design.md`
- [ ] 5.3 `openspec validate dev-synthetic-data`; status documents per the `herald-docs` skill
