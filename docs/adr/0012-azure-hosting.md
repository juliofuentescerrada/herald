# 0012. Host on Azure Container Apps, with managed identity and OpenTofu

- Status: Proposed
- Date: 2026-11-06

## Context

Herald is an Azure reference, so it has to run in Azure the way a production system would: infrastructure as code, no secrets in configuration, telemetry, and a pipeline that deploys on merge. It also has to cost little when nobody is using it.

Herald shares an Azure subscription with the maintainer's other projects, Arcana and Archivist. Today Arcana's OpenTofu state owns the costly shared resources (the PostgreSQL server, the Container Apps environment, the registry, Log Analytics), and Archivist reuses them through `data` sources. That already causes friction, and a third project makes it worse. The plan is a separate infrastructure repository for a shared platform that the projects deploy onto. It is not designed yet.

## Decision

- **Compute:** Azure Container Apps for the host, scaling to zero when idle; the Angular app as static files (Static Web Apps, or served by the host; decided in the cloud milestone).
- **Data and messaging:** Azure Database for PostgreSQL Flexible Server and Azure Service Bus (ADRs 0007, 0009).
- **Identity and secrets:** a managed identity per app reaching PostgreSQL, Service Bus and Key Vault without passwords; users sign in with Entra ID (the tenant type decided with the sign-in change).
- **Telemetry:** OpenTelemetry from the start (through Aspire's service defaults locally), exported to Application Insights in Azure.
- **Infrastructure as code:** OpenTofu, deployed by GitHub Actions with OIDC federation, never from a laptop.
- **Local development:** .NET Aspire runs PostgreSQL, the broker and the host.
- **Shared platform, Herald's own resources:** Herald deploys onto the shared platform once it exists, and owns only what is specific to it:

  | Shared platform (planned repository) | Herald |
  |---|---|
  | Container Apps environment, container registry, Log Analytics | Its resource group, OpenTofu state and GitHub identity |
  | PostgreSQL Flexible Server | Its database and an Entra role with rights on it only |
  | Service Bus namespace (Standard: Basic has no topics) | Its topics and subscriptions |
  | Budget | Its container apps, managed identity, Key Vault and Application Insights |

  Herald doesn't deploy to Azure before the platform exists (M4 waits for it), and doesn't add new resources to Arcana's state.

## Alternatives considered

- **App Service:** simpler, but no scale to zero and less like the container platforms teams run today.
- **AKS:** far more than one host needs.
- **Bicep or Terraform:** Bicep is Azure-only; OpenTofu keeps the open licence and matches the maintainer's other projects.

## Consequences

- Positive: a deployment that reads like a production one and costs little idle.
- Negative: Service Bus and PostgreSQL have a fixed monthly cost even idle; cold starts after scale to zero.
- Negative: Herald's cloud milestone depends on work in another repository.
- Follow-ups: the platform repository and its ADR (the split above, how projects find the platform: `data` sources by name or a versioned lookup module rather than reading its state, the least privilege each project's pipeline needs on shared resources, and whether Arcana's server and environment are imported or recreated with platform names); then region (North Europe, as Arcana), naming and a cost estimate for Herald, in M4.
