# 0012. Host on Azure Container Apps, with managed identity and OpenTofu

- Status: Proposed
- Date: 2026-11-06

## Context

Herald is an Azure reference, so it has to run in Azure the way a production system would: infrastructure as code, no secrets in configuration, telemetry, and a pipeline that deploys on merge. It also has to cost little when nobody is using it.

Herald shares an Azure subscription with the maintainer's other projects, Arcana and Archivist. Today Arcana's OpenTofu state owns the costly shared resources (the PostgreSQL server, the Container Apps environment, the registry, Log Analytics), and Archivist reuses them through `data` sources. That already caused friction, and a third project would make it worse. The shared platform now exists as its own repository, Steward (`juliofuentescerrada/steward`), which owns the common resources and onboards each project by manifest (its ADRs 0008, 0010 and 0011, guide `docs/m3/operations.md`). Arcana and Archivist already deploy onto it.

## Decision

- **Compute:** Azure Container Apps for the .NET API host, scaling to zero when idle. The Angular admin app and prerendered corporate pages are static assets; the public/participant app also needs a server runtime for SSR routes (ADR 0011). Static-only hosting is insufficient for those routes. M4 decides runtime placement (including a Node.js container on Container Apps as an option), static/dynamic route serving and cache configuration, and measures SSR/API cold starts and their effect on initial public responses.
- **Data and messaging:** Azure Database for PostgreSQL Flexible Server (ADR 0007). Azure Service Bus (ADR 0009) only once a party leaves the process (H4, H5); until then the host runs without a broker (ADR 0019).
- **Identity and secrets:** a managed identity per slot (ADR 0019) reaching PostgreSQL with an Entra token instead of a password, as the database role Steward creates under the identity's name; no Key Vault while Herald has no secret to keep; users sign in through the External ID directory that Steward keeps as a platform resource in `rg-identity` (ADR 0014).
- **Telemetry:** OpenTelemetry from the start (through Aspire's service defaults locally), exported to Application Insights in Azure.
- **Infrastructure as code:** OpenTofu, deployed by GitHub Actions with OIDC federation as `id-herald-delivery`, never from a laptop. The state lives in Steward's management account, container `herald`; Herald finds the shared resources by their documented names and `data` sources, never by reading Steward's state.
- **Local development target:** .NET Aspire runs PostgreSQL, the broker, the host and both Angular shells. `m0-messaging` adds the Service Bus emulator to PostgreSQL and the host; `m0-web-shell` adds the Angular shells.
- **Shared platform, Herald's own resources:** Herald deploys onto Steward's platform and owns only what is specific to it:

  | Steward | Herald |
  |---|---|
  | `cae-shared`, `crjfcshared`, `log-shared` | `rg-herald` (created by Herald's `infra/bootstrap.sh`), its OpenTofu state, its container apps and jobs, Application Insights and budget |
  | `psql-jfc-shared`, and the creation of `herald_main` and `herald_preview` with one Entra role each | Its schemas and migrations, which its migrator role may drop and recreate (Steward ADR 0010) |
  | `id-herald-delivery`, its federated credentials, its state container and its scoped grants | The runtime identities of its slots |
  | The External ID directory | Its app registrations, redirect URIs and test personas |
  | Image purge, keeping two tags per repository (Steward M4, D5) | One image repository per slot, so a slot's pushes never purge the other's running image |
  | Service Bus namespace, when H4 or H5 needs it (Steward ADR 0011) | Its topics and subscriptions |

  Herald never adds resources to Arcana's or Steward's state.

## Alternatives considered

- **App Service:** simpler, but no scale to zero and less like the container platforms teams run today.
- **AKS:** far more than one host needs.
- **Bicep or Terraform:** Bicep is Azure-only; OpenTofu keeps the open licence and matches the maintainer's other projects.

## Consequences

- Positive: a deployment that reads like a production one and costs little idle.
- Negative: Service Bus and PostgreSQL have a fixed monthly cost even idle; cold starts after scale to zero.
- Negative: Herald's cloud milestone depends on work in another repository.
- Negative: SSR adds a frontend server runtime to deploy and observe alongside the API; shared caches exclude private and personalised responses and request-specific state stays isolated (ADR 0011).
- Delivery dependency: H1 identity is not delayed until M4. Select the user identity provider and organisation-isolation approach with the H1 access slice. A remote pilot needs an accessible environment; if the shared Azure platform is not ready, explicitly plan a reviewed pilot environment rather than silently bypassing the M4 platform boundary.
- Follow-ups: the platform repository is done (Steward, M1–M3: discovery by name, least-privilege onboarding, Arcana recreated). In M4: North Europe; Steward's naming `<type>-herald[-<function>]`, the `main` slot without a suffix and `preview` with `-preview` (`ca-herald-api`, `ca-herald-preview-api`); Herald's onboarding in Steward's `onboard-herald` change; the measured cost of both slots.
