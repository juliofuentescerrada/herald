# Herald web

Angular workspace for Herald's two applications and their shared libraries (ADR 0011, `m0-web-shell`).

| Project | Kind | Purpose |
| --- | --- | --- |
| `admin` | Application, CSR | Organiser workspace |
| `public` | Application, SSG/SSR/CSR by route | Public and participant pages |
| `ui` | Library (`@herald/ui`) | Shared controls and tokens |
| `api-client` | Library (`@herald/api-client/*`) | Generated API contracts and clients |
| `catalogue` | Development tool, never deployed | Every `ui` control in every state |

Node 26 (`.nvmrc`) and pnpm 12.18.0 (`packageManager`), both on `PATH`. Install scripts must be approved in `pnpm-workspace.yaml`.

## Run

With the rest of Herald (PostgreSQL, Service Bus emulator, host), from the repository root:

```sh
dotnet run --project src/Herald.AppHost
```

Aspire installs the workspace once and starts admin on http://localhost:4200 and public on http://localhost:4300. Both call relative `/api` URLs: `ng serve` forwards them to the host (`proxy.conf.mjs`), and public's server rendering sends them to `HERALD_API_URL`, which Aspire sets to the host's address.

On its own, without the AppHost: `pnpm start:admin` or `pnpm start:public`. `/api` then goes to the host's launch address, http://localhost:5180.

Development-only routes in public: `/_fixtures/ssr` (rendered per request) and `/_fixtures/client` (rendered in the browser). Production builds leave them out.

## Check

```sh
pnpm lint && pnpm lint:boundaries   # ESLint and the import-boundary fixtures
pnpm test:all                       # Vitest for every project
pnpm test:ssr                       # 50 concurrent SSR requests stay isolated and anonymous
pnpm build:all                      # production builds
```

To run a built public server locally, allow the host: `NG_ALLOWED_HOSTS=localhost PORT=4000 node dist/public/server/server.mjs`. Without it, Angular answers 400 (SSRF protection).
