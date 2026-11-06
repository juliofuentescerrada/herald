# 0012. Host on Azure Container Apps, with managed identity and OpenTofu

- Status: Proposed
- Date: 2026-11-06

## Context

Herald is an Azure reference, so it has to run in Azure the way a production system would: infrastructure as code, no secrets in configuration, telemetry, and a pipeline that deploys on merge. It also has to cost little when nobody is using it.

## Decision

- **Compute:** Azure Container Apps for the host, scaling to zero when idle; the Angular app as static files (Static Web Apps, or served by the host; decided in the cloud milestone).
- **Data and messaging:** Azure Database for PostgreSQL Flexible Server and Azure Service Bus (ADRs 0007, 0009).
- **Identity and secrets:** a managed identity per app reaching PostgreSQL, Service Bus and Key Vault without passwords; users sign in with Entra ID (the tenant type decided with the sign-in change).
- **Telemetry:** OpenTelemetry from the start (through Aspire's service defaults locally), exported to Application Insights in Azure.
- **Infrastructure as code:** OpenTofu, deployed by GitHub Actions with OIDC federation, never from a laptop.
- **Local development:** .NET Aspire runs PostgreSQL, the broker and the host.

## Alternatives considered

- **App Service:** simpler, but no scale to zero and less like the container platforms teams run today.
- **AKS:** far more than one host needs.
- **Bicep or Terraform:** Bicep is Azure-only; OpenTofu keeps the open licence and matches the maintainer's other projects.

## Consequences

- Positive: a deployment that reads like a production one and costs little idle.
- Negative: Service Bus and PostgreSQL have a fixed monthly cost even idle; cold starts after scale to zero.
- Follow-ups: region, naming, resource groups and a cost estimate, in the cloud milestone.
