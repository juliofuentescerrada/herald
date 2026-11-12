# Herald end-to-end journeys

Playwright journeys against the composed system: the host in its `E2E` environment, PostgreSQL, both web
applications and a test OpenID Connect provider (`mock-oauth2-server`), so MSAL and JWT bearer run their
production code paths (ADR 0015, change `e2e-critical-paths`).

CI runs the suite after each merge to `main` (`.github/workflows/e2e.yml`), not on pull requests: run it locally
before asking for review when a change touches sign-in, the host's API or the admin application.

## Prerequisites

- Docker (PostgreSQL and the provider run in containers; about 300 MB together).
- The .NET SDK from `global.json`.
- Node from `.nvmrc` (shared with `web/`) and pnpm 12.18.0.
- `web/` installed: `cd web && pnpm install`.

## Running

```sh
cd e2e
pnpm install
pnpm exec playwright install chromium   # once, or with --with-deps on a fresh machine
pnpm test                               # all journeys
pnpm test journeys/sign-in.spec.ts      # one file; add -g "<name>" for one journey
pnpm typecheck
```

Playwright starts everything and stops it at the end, in this order:

| Server | Port | Ready when |
| --- | --- | --- |
| `infrastructure.ts`: PostgreSQL and the provider | 5480, 5481 (https) | it prints that it is ready |
| Host (`dotnet run`, `E2E`) | 5482 | `/health` answers |
| Admin (`ng serve`, with the API proxy) | 5483 | `/` answers |
| Public (`ng serve`, server rendering) | 5484 | `/` answers |

The ports are reserved for the suite and do not clash with an Aspire run (4200, 4300, 5180). Locally, a server
already listening on its port is reused. The admin's start writes `web/projects/admin/public/runtime-config.json`
for the provider; the next Aspire start writes it back for the directory.

Containers are stopped when the run ends, and testcontainers' reaper removes them if the run is killed.

## Personas

`fixtures.ts` signs in through the provider's login form with a fresh persona per call (new object id and name),
so journeys run in parallel and in any order. `signIn({ assigned: false })` gives a person without the `Organiser`
role. `signIn({ on: secondPage, as: persona })` signs a second tab in as the same person: MSAL keeps its cache per
tab and the provider has no single sign-on session. `expectAccessible()` runs axe on the current state.

## When a journey fails

The trace of each failed test is kept under `test-results/` (in CI, the `e2e-report` artefact of the End-to-end workflow, with the HTML report):

```sh
pnpm exec playwright show-trace test-results/<test>/trace.zip
```

It shows each step with the page, the console and the network. For the servers' output, run with
`DEBUG=pw:webserver`.

## Test scripts

`scripts/` holds each slice's executable test script (harness-engineering D-14): the steps the maintainer will take
on its preview, which the agent runs first against the local application. Unlike the journeys, they start from
seeded data: `scripts/seed.ts` runs `tools/Herald.Seed` once the host is up, for the persona in
`environment.ts` (`scriptPersona`), and the script signs in as it. `screen(page, info, step)` saves a full-page
screenshot at device scale factor 2 under `test-results/screens/<script>/`.

```sh
pnpm test:scripts
```

CI runs them on every pull request and uploads the screenshots as the `test-script-screens` artefact. Where the
preinstalled Chromium does not match the pinned Playwright (cloud sessions), `HERALD_CHROMIUM` names it.
A script is promoted to `journeys/` only if its flow becomes a critical path.
