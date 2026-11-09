# Herald end-to-end journeys

Playwright journeys against the composed system: the host in its `E2E` environment, PostgreSQL, both web
applications and a test OpenID Connect provider (`mock-oauth2-server`), so MSAL and JWT bearer run their
production code paths (ADR 0015, change `e2e-critical-paths`).

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

The trace of each failed test is kept under `test-results/` (in CI, an artefact of the `e2e` job):

```sh
pnpm exec playwright show-trace test-results/<test>/trace.zip
```

It shows each step with the page, the console and the network. For the servers' output, run with
`DEBUG=pw:webserver`.
