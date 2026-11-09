## Context

`h1-organisation-access` (branch `h1-organisation-access`, not yet merged) gives Herald its first complete journeys: assigned-only sign-in through MSAL against the External ID directory shared with Arcana, JWT bearer validation in the host, organisation creation and switching, isolation, and the reviewed access states. Each layer is tested on its own (domain, PostgreSQL use cases, host API tests with self-signed tokens, Vitest with stubbed MSAL), but no test runs a browser against the composed system. ADR 0010 plans Playwright "for a few complete journeys"; this change adds them.

Constraints:

- The real directory signs people in with e-mail one-time passcodes and has no disposable users; CI must not depend on it.
- The host requires an Azure Service Bus connection string; the Service Bus emulator is heavy, and the maintainer's Docker VM has 1.92 GB shared with another project.
- Tests are named as sentences (ADR 0010); dependencies must be free for an open-source personal project and checked at their exact version (ADR 0009).

## Goals / Non-Goals

**Goals:** prove the nine critical journeys end to end after every merge to `main`; run the production MSAL and JWT bearer code paths; fail on accessibility violations in visited states; keep the suite fast enough to run after every merge (target under ten minutes in CI).

**Non-Goals:** the real directory (manual check, as `h1-organisation-access` task 6.2); browsers other than Chromium; screenshot comparison with the mockups (they stay a manual review); load testing; journeys for features that do not exist yet; replacing component or API tests.

## Visual input

No screen is created or modified. Mockups are not applicable. The journeys assert on the texts of the reviewed access states (`docs/assets/mockups/access/`), already implemented by `h1-organisation-access`.

## Decisions

### E-1 A root `e2e/` folder with its own toolchain

The suite tests the whole system (host, database, both applications, an identity provider), not the front end, so it lives at the repository root next to `src/`, `tests/` and `web/`, with its own `package.json`, lockfile (pnpm, the same version as `web/`) and Node version (`web/.nvmrc`).

*Rejected:* `web/e2e` (reuses `web/`'s install and CI job, but suggests a front-end test and puts host orchestration inside the Angular workspace); Playwright for .NET with `Aspire.Hosting.Testing` (composes the real AppHost, but brings the Service Bus emulator into every run, which the local Docker budget cannot afford, and writes browser tests in the language furthest from the UI).

### E-2 A fake OpenID Connect provider: `navikt/mock-oauth2-server`

The suite signs in through a provider that speaks the real protocol (discovery, JWKS, authorisation code with PKCE, token endpoint, signed tokens with the request's nonce), so MSAL and JWT bearer run exactly as in production. `navikt/mock-oauth2-server` (MIT, a container image, built for tests) issues tokens with claims chosen per login or by JSON configuration, which gives the personas their `tid`, `oid`, `name` and `roles`, and can shorten token lifetime for the expiry journey. Pin the image by digest after checking the version: 6.1.4 (28 October 2026) unless a later release has had two weeks.

*Rejected:* a fake session injected into the admin application (simplest, but skips MSAL, the guard's redirect and the host's discovery, the code most likely to break between layers); MockServer (serves canned responses, but the token endpoint must sign a fresh token with the request's nonce, which canned responses cannot do); the real directory with test users (one-time passcodes cannot be automated; CI would depend on an external tenant). *Fallback:* if the spike (task 1.1) shows MSAL cannot work with this provider, a minimal provider written for the suite (discovery, JWKS, authorise with a persona picker, token), with the RFCs at hand.

### E-3 MSAL against a non-Microsoft authority

MSAL treats unknown authorities as untrusted. The admin's runtime configuration gains optional `protocolMode` and `knownAuthorities`; absent, MSAL keeps today's behaviour for the directory. The spike (task 1.1) confirms the exact settings (`protocolMode: 'OIDC'` is expected) and that the token carries what the host checks (issuer from discovery, audience, `roles`).

### E-4 The host's `E2E` environment

The host runs with `ASPNETCORE_ENVIRONMENT=E2E`:

- Azure Service Bus is not configured and external Wolverine transports are disabled, as `HostFactory` does for the host tests. Local queues and the PostgreSQL outbox still run.
- Sign-in configuration is the ordinary `Herald:Authentication:*`, pointing at the fake provider. The host has no special code for it.
- Migrations and Wolverine's tables are applied at start-up, as in Development.
- A start-up guard refuses `E2E` when the host also sees a production marker (any Azure hosting variable, or `Production` in another setting), and a host test proves it.

*Rejected:* running E2E in Development (Development expects Aspire's Service Bus emulator and user secrets).

### E-5 Starting and isolating the system

- Playwright's first `webServer` (`infrastructure.ts`) starts PostgreSQL (`postgres:18.3`) and the provider with `testcontainers` (MIT) on fixed ports and reports readiness on its output; Playwright stops it with `SIGTERM`, and testcontainers' reaper removes the containers if the run dies. *Revised in task 3.2:* Playwright 1.65 starts `webServer` entries before `globalSetup`, so containers started in `globalSetup` would come up after the host. *Rejected:* `globalSetup` spawning the servers too (reimplements `webServer`); a script around `playwright test` (the plain command no longer works).
- Playwright `webServer` starts the host (`dotnet run --project src/Herald.Host`, `E2E`), the public server rendering and the admin application, each with a readiness URL. The admin application is served by `ng serve` with its proxy, so relative `/api` calls work as in development, and its `runtime-config.json` is written for the provider.
- Each journey creates its own personas' data (new object ids and organisation names per test), so journeys can run in parallel and in any order. The provider's personas are templates; each test gets fresh identifiers.
- Fixed ports from a reserved range (for example 5480–5489) so a developer's Aspire run (4200, 4300, 5180) is unaffected.

### E-6 Journeys and assertions

One spec file per area (`public`, `sign-in`, `organisations`, `access`), test names as sentences. Locators by role and accessible name; assertions on visible text. A fixture runs `@axe-core/playwright` on every distinct state reached, disabling only `color-contrast`, as the component tests do (contrast is reviewed on the mockups). Two-tab journeys (switch, sign-out) use two pages in one browser context, which share `BroadcastChannel`. The expiry journey signs in with a short-lived persona, types into the creation form, and waits for the next API call to fail token renewal.

### E-7 CI

A workflow of its own, `e2e.yml`, on pushes to `main` only, that is after each merge (*revised in task 5.1 by the maintainer:* not on pull requests, which keep the existing CI jobs; a defect between layers is then found after the merge, not before review): checkout, .NET (from `global.json`), Node and pnpm, `pnpm install --frozen-lockfile` in `web/` and `e2e/`, Playwright's Chromium with its system dependencies, and the suite. Docker is available on GitHub-hosted runners. On failure, upload the HTML report and traces (`trace: 'retain-on-failure'`). No retries locally; one retry in CI, and a retried pass is reported so flakiness is visible.

## Risks / Trade-offs

- [MSAL may refuse the fake authority or a detail of its tokens] → the spike is the first task; the hand-written provider is the fallback, and the design is revised before any journey is written.
- [A fake provider can hide differences from External ID (claims, issuer shape, error codes such as `AADSTS50105`)] → personas copy the directory's claim names; the real directory remains a manual check before releases; unassigned-person behaviour is driven by the API's 403 in the suite, while `AADSTS50105` at sign-in stays covered by unit tests.
- [Slow or flaky suite] → Chromium only, parallel journeys with isolated data, readiness URLs instead of sleeps, one retry in CI with reporting.
- [Local Docker memory: PostgreSQL plus a JVM provider next to another project's stack] → measure in the spike; the provider's JVM heap can be capped; document the requirement.
- [An `E2E` environment reaching production] → start-up guard with its test; no deployment configuration mentions it.

## Migration Plan

New folder, new job and a new host environment; nothing existing changes behaviour. Rollback is reverting the change.

## Open Questions

- The ADR number: 0014 is taken by `h1-organisation-access` (not yet merged), so this change uses 0015.
- ~~Whether to run the suite on every pull request or only on those touching `src/`, `web/` or `e2e/`.~~ Decided in task 5.1: after merges to `main` only.

## Implementation record

### Approval and base (task 1.1, 9 November 2026)

Approved by the maintainer ("apply"). `h1-organisation-access` is not merged yet, so this branch is rebased onto it locally (one conflict, the ADR index, kept both rows); this change's pull request must follow that one.

### Spike: MSAL and JWT bearer against `mock-oauth2-server` (task 1.2, 9 November 2026)

Throwaway setup: the provider (6.1.4) and PostgreSQL 18.3 in containers, the host run with `dotnet run` without Aspire, the admin with `ng serve`, Chrome headless through `playwright-core`. Temporary code changes were reverted afterwards.

**Adopted:** a deep link to `/organisations/new` redirected to the provider, signed in through its login form, returned to `/organisations/new` signed in as the persona, and created an organisation (`GET /api/me` 200, `POST /api/organisations` 201, the new workspace with its name in the rail). Production code paths ran unchanged except the settings below.

Findings that shape the design:

- **TLS is required.** MSAL refuses any authority that is not `https` (`authority_uri_insecure`, no exception for localhost). The provider serves TLS with a generated self-signed certificate (`httpServer.ssl: {}`); the browser context sets `ignoreHTTPSErrors`, and the host needs a back-channel handler that accepts that certificate, in `E2E` only (E-4).
- **MSAL settings:** `system.protocolMode: 'OIDC'` (not under `auth`); without it MSAL appends `/v2.0` to the authority, the provider then issues tokens for another issuer and the host answers 401. `knownAuthorities` with the provider's host is accepted; MSAL's issuer check passes because the issuer has the authority's scheme, host and port.
- **Personas come from the login form, not token callbacks.** With `interactiveLogin: false` and token callbacks, the authorisation-code access token carried none of the configured claims (no `sub`, no `aud`). With `interactiveLogin: true`, the form's username and claims JSON (`oid`, `name`, `roles`, `aud`) go into the access token. The suite's sign-in fixture fills that form; personas are claim templates in the suite, not provider configuration (E-2, E-5 adjusted).
- **`tid` is the issuer id.** The provider overwrites `tid` with its issuer id, so the issuer id must be a tenant GUID: authority `https://localhost:<port>/<tenant-guid>`, the shape External ID also uses.
- **Defect found in `h1-organisation-access`:** a token whose `tid` or `oid` is present but not a GUID passes the `organiser` policy and then fails with a 500 (`Caller.From(user)!`). The real directory always issues GUIDs, but the host should answer 403. Fixed in `h1-organisation-access` (34c8475): the policy requires a parseable caller and a host test proves the 403.
- **Host without Service Bus:** with a dummy `messaging` connection string and no declared endpoints the host started and served requests; E-4 still disables external transports explicitly rather than relying on that.
- **Memory:** provider 195–223 MB with `-Xmx256m`, PostgreSQL 54–68 MB.
- **Still to solve in task 4.4:** the expiring-session journey. Token lifetime is not set per login in the form; options are a second provider issuer with a short `tokenExpiry`, or clearing MSAL's cached tokens in the page so silent renewal fails.

### Versions and licences (task 1.3, 9 November 2026)

- `@playwright/test` 1.65.0 (Apache-2.0, 5 November 2026; latest, as chosen for MSAL in `h1-organisation-access`).
- `@axe-core/playwright` 4.14.0 (MPL-2.0, as `axe-core` in `web/`; depends on `axe-core` ~4.14.0, peer `playwright-core`).
- `testcontainers` 12.2.1 (MIT).
- `ghcr.io/navikt/mock-oauth2-server:6.1.4` (MIT, 28 October 2026), pinned as `ghcr.io/navikt/mock-oauth2-server@sha256:647dd8c78a54f0e6fcd58d79c884e612f8f998a0662276f3e1db22e464a50192`.

### Host `E2E` environment and admin configuration (tasks 2.1–2.2, 9 November 2026)

- `HostEnvironments.EndToEnd` (`E2E`): `Program` skips Azure Service Bus (local queues and the PostgreSQL outbox still run), `appsettings.E2E.json` sets up the database at start-up, and the JWT bearer back channel accepts the test provider's generated certificate (`TrustTheTestProvidersCertificate`, E2E only). Wolverine loads the committed generated code, as in production. `ServiceDefaults` maps `/health` and `/alive` in E2E too, for the suite's readiness checks.
- Guard: E2E refuses to start when `CONTAINER_APP_NAME` or `WEBSITE_SITE_NAME` is set (Azure Container Apps and App Service set them).
- Host tests: `The_end_to_end_environment_runs_without_a_message_broker` (empty `messaging` connection string, `/health` 200) and `The_end_to_end_environment_refuses_to_start_in_a_deployment` (each marker). Host tests: 29 pass.
- Admin: `AuthConfig.protocolMode` (`'OIDC'`) and `knownAuthorities` are optional; absent, MSAL keeps the directory's behaviour (authority host only, Microsoft protocol). `write-runtime-config.mjs` writes them from `HERALD_AUTH_PROTOCOL_MODE` and `HERALD_AUTH_KNOWN_AUTHORITIES` (comma-separated) only when set. Vitest checks both through `getConfiguration()`. Admin tests: 96 pass; lint, admin build, Release build and generated code unchanged.

### Suite infrastructure (tasks 3.1–3.5, 9 November 2026)

- `e2e/`: `package.json` (pnpm 12.18.0, Node 26 via `.nvmrc` symlinked to `web/.nvmrc`), `@playwright/test` 1.65.0, `@axe-core/playwright` 4.14.0, `testcontainers` 12.2.1, and `typescript` 6.0.3 with `@types/node` 26.6.6 as in `web/`, for `pnpm typecheck`. Install scripts of `ssh2`'s optional native helpers are refused in `pnpm-workspace.yaml`.
- Order (E-5 revised): `infrastructure.ts` → host (`/health`) → admin → public. Ports 5480–5484. Each `webServer` waits on a readiness URL; the infrastructure on its ready line (`wait.stdout`).
- Defect found in task 2.1: `TrustTheTestProvidersCertificate` used `PostConfigure`, which runs after JwtBearer's own post-configuration has built the back channel, so discovery failed on the certificate and every token was refused as `invalid issuer` (401). It now uses `Configure`.
- `infrastructure.ts` needs a timer to keep Node alive: after its top-level `await` nothing else does, Node exited and the reaper removed the containers mid-run.
- Fixtures: `signIn` fills the provider's form (`username`, `claims`) with a fresh persona; `signIn({ on, as })` signs a second tab in as the same persona, because MSAL's cache is per tab (`sessionStorage`) and the provider keeps no single sign-on session (the directory renews silently). `expectAccessible` runs axe without `color-contrast`.
- Throwaway smoke journeys (removed): a deep link returned to `/organisations/new` with `GET /api/me` 200 and no axe violation on admin or public; an unassigned persona got 403 and "Herald access is by invitation"; a second tab signed in as the same persona; a failing test still left no container behind. A run with one journey takes about 25 seconds locally, mostly start-up.

### Journeys (tasks 4.1–4.4, 9 November 2026)

Four spec files (`public`, `sign-in`, `organisations`, `access`), nine journeys, each named as a sentence. After the fixes below, all nine pass in 63 consecutive journey runs (three runs with `--repeat-each=2` and one plain run, no retries); a run of the nine takes 37–54 seconds locally, about 20 of them start-up. Notes:

- A tab listens for context replacements once its workspace is up; the two-tab journeys wait for the second tab's workspace before acting, or the replacement reaches nobody (this made the switch journey flaky before the wait).
- The expiring session: the journey removes MSAL's cached access and refresh tokens and answers the silent `prompt=none` renewal with `login_required`, as the directory does without a session.
- The other owner's organisation is created in a separate browser context (another person); the denial page is checked for the absence of its name.

**Defects found in `h1-organisation-access`, fixed there (94fe60c) and rebased onto:**

1. **Sign-out left other tabs signed in.** Each tab keeps its own MSAL cache in `sessionStorage`; other tabs reloaded into the workspace with their session. Other tabs now forget their session before reloading. Journey 9 failed on it and now passes.
2. **Silent renewal through MSAL's hidden iframe could never succeed and took 10 seconds.** MSAL 5 expects its redirect bridge at the redirect URI inside the iframe; `/` booted the application, which MSAL refused there (`block_iframe_reload`). The admin's `main.ts` now runs only the bridge in that frame. Journey 7 needed a 15-second wait before; it now uses the default and takes about 9 seconds.

### CI workflow (task 5.1, 9 November 2026)

- `.github/workflows/e2e.yml`, on pushes to `main` only (E-7 revised): actions pinned by commit as in `ci.yml`, plus `actions/upload-artifact` v7.0.2 (7 October 2026). Installs `web/` and `e2e/` with frozen lockfiles, Chromium with its system dependencies, builds the host first so its start stays within the readiness timeout, and runs `pnpm test`; on failure it keeps `playwright-report/` and `test-results/` as `e2e-report` for 14 days. Twenty-minute job timeout.
- A local run with `CI=true` (one retry, no server reuse, HTML report): nine pass in 39 seconds, report written.
- Because the workflow runs only on `main`, its first CI run (task 5.2) happens after this change is merged.

### Acceptance review against the specs (task 5.3, 9 November 2026)

`end-to-end-journeys`:

| Requirement / scenario | Evidence | Verdict |
| --- | --- | --- |
| The suite tests the running system; one command | `pnpm test` in `e2e/` starts PostgreSQL and the provider (`infrastructure.ts`), the host, admin and public; prerequisites in `e2e/README.md` (`web/` installed, Chromium once) | Met |
| Leaves nothing running, pass or fail | Containers stopped on `SIGTERM`; checked after a deliberately failing run; the reaper covers a killed run | Met |
| Journeys do not share data | Fresh persona and organisation names per call; 63 parallel runs without interference | Met |
| Sign-in through real protocol code; a persona signs in | MSAL redirect with PKCE against `mock-oauth2-server`, JWT bearer unchanged (`GET /api/me` 200) | Met |
| Personas with identifiers, name and the organiser role | Claim templates in `fixtures.ts` (`oid`, `name`, `roles`; `tid` is the issuer id) | Met |
| The provider can issue a session that expires during a journey | **Deviation:** journey 7 ends the session in the browser (MSAL's cached tokens removed) and the silent renewal is answered with `login_required`, the directory's answer without a session; the provider does not issue a short-lived token, because token lifetime cannot be set per login in its form (spike) | Met in behaviour, not in mechanism |
| The fake provider stays out of production | Only `e2e/` names it; the host's `E2E` environment refuses Azure hosting markers (host test) | Met |
| The nine critical journeys, named as sentences | `public` 1, `sign-in` 2, `organisations` 3, `access` 3 spec files' tests | Met |
| Each journey checks what the person sees | Locators by role, label and text; journey 7 inspects requests only to prove nothing was submitted, and prepares the expiry through storage (setup, not an assertion) | Met |
| Visited pages are accessible | `expectAccessible` on each distinct Herald state reached (public page, creation, workspace with the created notice, selector, replaced-context notice, invitation, denial, session expired); the provider's own pages are not Herald's | Met |

`continuous-integration`:

| Requirement / scenario | Evidence | Verdict |
| --- | --- | --- |
| Merges to `main` run the journeys; a pull request does not | `.github/workflows/e2e.yml`, `on: push: branches: [main]` only | Met by configuration |
| A journey breaks → the workflow fails with report and trace | Artefact step on failure; locally the HTML report and traces are written under `CI=true` | Met on `main` (task 5.2): the job ran and passed; its failure path is exercised locally |
| The suite passes → no artefacts | Upload only `if: failure()` | Met by configuration |

Task 5.2 is recorded below.

### First runs on `main` (task 5.2, 10 November 2026)

- Run 42691326733 (merge of #7): the End-to-end job passed in 3 min 31 s, the suite itself in about 1.5 min; nine journeys passed with no retries.
- Locally, after the refinements of #8: nine journeys in 58 s. Containers used about 300 MB (provider 195–223 MB, PostgreSQL 54–68 MB, measured in the spike); the runner's memory was not measured separately.
- Run 42708073803 (merge of #8, with the refinements): passed, job 3 min 2 s. The CI workflow passed too.
