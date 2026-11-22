## Status

**Proposed in the M4 batch's proposals pull request, 22 November 2026.** The technical decisions come from the batch's decision session of the same day, recorded in the roadmap's [M4 batch](../../../docs/roadmap.md#batch-main-and-preview-on-azure) and in ADRs 0012 and 0019. Merging the proposals pull request approves this change (ADR 0018); task 1.1 records that approval.

## Why

The host and the web servers only run locally today. Outside the `E2E` environment the host requires Service Bus, it reaches PostgreSQL with a password, it maps `/health` and `/alive` only in Development and E2E, and it exports telemetry only where Aspire sets an OTLP endpoint. The web servers reach the API through the Angular dev-server's proxy. ADR 0019 needs every slot to run without a broker, as its slot's managed identity, with no password and no secret, and `preview` must be reset without server privileges (Steward's ADR 0010).

## What Changes

- **No broker by configuration:** `Herald:Messaging:Broker` is `None` or `AzureServiceBus` (the default, which keeps the AppHost as it is). With `None` the host registers no transport: durable local queues and the PostgreSQL outbox carry the integration events between modules (ADR 0016), as in `E2E`. `E2E` keeps working without a broker through the same option.
- **PostgreSQL as a managed identity:** with `Herald:Database:Authentication` set to `Entra`, the host's data source takes an Entra access token as its password, for the user-assigned identity named in configuration, refreshed before it expires. The username is the identity's name, which is the role Steward creates. Locally nothing changes.
- **Health in a deployment:** where Azure hosting is detected (`CONTAINER_APP_NAME`), the host maps `/alive` and `/health` for Container Apps' probes. The OpenAPI documents stay in Development.
- **Telemetry to Application Insights:** with `APPLICATIONINSIGHTS_CONNECTION_STRING` set, the host exports logs, metrics and traces to Application Insights, traces sampled at a configured ratio (25 % in the slots, decision session); logs and metrics unsampled. Without it, the OTLP behaviour of today.
- **`/api` on the web servers' origin:** the public SSR server forwards the browser's `/api/` requests to the API's address (`HERALD_API_URL`), the same address its server rendering already uses, so the API needs no public ingress and no CORS. The admin application's container does the same (`m4-images`).
- **Resetting a slot's schemas:** the seeding tool gains a reset that drops Herald's schemas (its modules' and Wolverine's) in the target database before migrating and seeding. It runs only when the configuration asks for it explicitly, and never in production. The database itself is never dropped (ADR 0019).

Out of scope: images (`m4-images`), Azure resources (`m4-infra`), the pipeline (`m4-deploy`), Service Bus in Azure (H4, H5), the SSR server's own telemetry.

Screens: none created or modified; mockups are not applicable.

Notifiable facts: none introduced (ADR 0017's inventory is unchanged).

Decision register: none; the rules here are technical (no §15 row).

## Capabilities

### New Capabilities

- `cloud-runtime`: how the host and the web servers run in a deployed slot: no broker, PostgreSQL as a managed identity, health for probes, telemetry export, `/api` forwarding.

### Modified Capabilities

- `synthetic-data`: the tool can reset Herald's schemas in its target database before seeding, only when asked and never in production.

## Impact

- `src/Herald.Host/Program.cs`, `src/Herald.ServiceDefaults`: configuration options; `Aspire.Azure.Npgsql` (or Npgsql's password provider with `Azure.Identity`) and `Azure.Monitor.OpenTelemetry.Exporter`, MIT, checked against `docs/rules/licences.json` with their transitive packages.
- `tools/Herald.Seed`: the reset.
- `web/projects/public/src/server.ts`: `/api` forwarding, no new dependency.
- Tests: host tests for the options, the seed tool's reset, a Vitest test for the forwarding.
- No change to endpoints, modules, migrations or integration contracts, so no Wolverine code or OpenAPI client regeneration.
