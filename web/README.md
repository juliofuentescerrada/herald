# Herald web

Angular workspace for Herald's two applications and their shared libraries (ADR 0011, `m0-web-shell`).

| Project | Kind | Purpose |
| --- | --- | --- |
| `admin` | Application, CSR | Organiser workspace |
| `public` | Application, SSG/SSR/CSR by route | Public and participant pages |
| `ui` | Library (`@herald/ui`) | Shared controls and tokens |
| `api-client` | Library (`@herald/api-client/*`) | Generated API contracts and clients |
| `catalogue` | Development tool, never deployed | Every `ui` control in every state |

Node 26 (`.nvmrc`) and pnpm 12.18.0 (`packageManager`). Install scripts must be approved in `pnpm-workspace.yaml`.

```sh
pnpm install --frozen-lockfile
pnpm ng build <project>
pnpm ng test <project> --watch=false
```
