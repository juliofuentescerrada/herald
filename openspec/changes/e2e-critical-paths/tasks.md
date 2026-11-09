## 1. Gates and spike

- [x] 1.1 Review the proposal, specs, design and ADR 0015; record approval in proposal.md and design.md. Confirm `h1-organisation-access` is merged and rebase on it.
- [x] 1.2 Spike (throwaway, results in design.md): run `mock-oauth2-server` in a container, point the admin's MSAL and the host's JWT bearer at it, sign in as an organiser persona and call `GET /api/me`. Record the MSAL settings needed, the token shape, the memory used, and whether the provider is adopted or the hand-written fallback replaces it (E-2, E-3)
- [x] 1.3 Check exact versions and licences of `@playwright/test`, `@axe-core/playwright`, `testcontainers` and the provider image; pin the image by digest

## 2. Host and admin configuration

- [x] 2.1 Host `E2E` environment: no Azure Service Bus, external transports off, migrations and Wolverine tables at start-up; start-up guard against production markers; host test for the guard
- [x] 2.2 Admin runtime configuration: optional `protocolMode` and `knownAuthorities` (written by `write-runtime-config.mjs` when set); Vitest for both defaults and overrides

## 3. Suite infrastructure

- [ ] 3.1 `e2e/` with `package.json`, lockfile, `tsconfig.json`, `playwright.config.ts` (Chromium, parallel, reserved ports, traces on failure); `.nvmrc` shared with `web/`
- [ ] 3.2 `globalSetup`/`globalTeardown`: PostgreSQL and the provider with `testcontainers`, personas as provider configuration; teardown also after failures
- [ ] 3.3 `webServer` entries for the host, the public server rendering and the admin application with readiness URLs and the provider's runtime configuration
- [ ] 3.4 Fixtures: sign in as a fresh persona, a second tab in the same context, and the `axe` check on each state
- [ ] 3.5 `e2e/README.md`: prerequisites, the command, ports, how to read a trace

## 4. Journeys

- [ ] 4.1 Public: Sign in leads to the admin application
- [ ] 4.2 Sign-in: a deep link returns to its address after sign-in; an unassigned persona sees "Herald access is by invitation"
- [ ] 4.3 Organisations: a newcomer creates an organisation (created notice, name in the rail); switching between two organisations reloads the other tab into its own; leaving the creation form with input asks, declining keeps it
- [ ] 4.4 Access: another owner's organisation shows the generic denial with nothing of it; an expiring session keeps typed input and submits nothing; sign-out reloads other tabs and asks for sign-in

## 5. CI and completion

- [ ] 5.1 Job `e2e` in the workflow: .NET, Node, pnpm, Chromium with dependencies, the suite, report and traces as artifacts on failure, one retry
- [ ] 5.2 Full run locally and in CI; record durations, memory and any retried test in design.md
- [ ] 5.3 Update ADR 0010's follow-up, README and roadmap; acceptance review against the specs in design.md
