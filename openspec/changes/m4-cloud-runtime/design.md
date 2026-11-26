## Context

ADR 0019 runs two slots, `main` and `preview`, each with one managed identity that is its database's only role (Steward's ADR 0010), no broker and no Key Vault (ADR 0012). The host today: `Program.cs` adds Service Bus unless the environment is `E2E`; `AddNpgsqlDataSource("herald")` reads a connection string with a password; `ServiceDefaults.MapDefaultEndpoints` maps health only in Development and E2E; telemetry is exported only when `OTEL_EXPORTER_OTLP_ENDPOINT` is set. Outside Development, `db-apply` and the modules' migrations are deployment steps (`m0-messaging`); the seeding tool's in-process host (`HostFactory`) already sets `Herald:Database:SetUpOnStartup`, so the job that seeds also migrates. The web servers reach the API through `proxy.conf.mjs` locally.

## Goals / Non-Goals

**Goals:** the host and the public server run in a slot with no secret, no broker and probes; `preview` can be reset by its own identity.

**Non-Goals:** images, Azure resources, the pipeline; Service Bus in Azure; production.

## Decisions

- **D-1 Broker option.** `Herald:Messaging:Broker` (`AzureServiceBus` by default, or `None`). `E2E` sets `None` through its settings instead of the `endToEnd` check in `Program.cs`, so one path covers both. *Alternative:* a separate "cloud" environment name; rejected, the environment already means Development/E2E/Production and the broker is an independent fact.
- **D-2 Entra token.** `Herald:Database:Authentication` = `Password` (default) or `Entra`, with `Herald:Database:Identity` (the user-assigned identity's client id) and the username in the connection string. Implementation picks the smaller of `Aspire.Azure.Npgsql` (`AddAzureNpgsqlDataSource`, which wires `ManagedIdentityCredential`) and Npgsql's `UsePeriodicPasswordProvider` with `Azure.Identity`; both are MIT, checked with `scripts/rules.mjs` including transitive packages. Token scope `https://ossrdbms-aad.database.windows.net/.default`.
- **D-3 Health.** `MapDefaultEndpoints` also maps `/alive` and `/health` when `HostEnvironments` detects Azure hosting (the markers it already uses). Probes: liveness on `/alive`, readiness on `/health` (`m4-infra`). The OpenAPI documents stay Development-only: the generated client is built from them in CI.
- **D-4 Telemetry.** When `APPLICATIONINSIGHTS_CONNECTION_STRING` is set, `ServiceDefaults` adds the Azure Monitor exporter and a parent-based ratio sampler from `Herald:Telemetry:TraceSampleRatio` (default 1.0; 0.25 in the slots). Logs and metrics are not sampled.
- **D-5 `/api` forwarding in the public server.** `server.ts` forwards `/api/*` to `HERALD_API_URL` with Node's `fetch`, streaming the body and passing the status, headers and `Authorization` unchanged (the browser's own requests; the server's rendering keeps sending none, W-05). No new dependency. The admin container's nginx does the same (`m4-images`). The API's ingress is then internal to `cae-shared`. *Alternative:* a public API with CORS; rejected, it widens the surface and changes both clients' base URLs.
- **D-6 Reset.** `tools/Herald.Seed` with `Herald:Seed:Reset=true` drops the schemas `organisations`, `tournaments`, `registration`, `competition`, `standings` and `wolverine` (`DROP SCHEMA … CASCADE`, read from the modules' constants, not a copied list) before its host starts and migrates. It refuses when the environment is production (as today) and needs no server privilege: the migrator owns the schemas it created (Steward's ADR 0010).

## Questions for the review

- **Q1** D-5: forwarding `/api` through each web server keeps the API internal. Accept, or a public API with CORS?

## Risks / Trade-offs

- Forwarding adds a hop and cold starts in series (web app, then API) → measured in `m4-deploy`; ADR 0012 already asks for the SSR/API cold-start measurement.
- The seed tool's in-process host migrates `main` → acceptable while every slot is a preview (ADR 0019); production needs its own migration step.
- A token outlives a connection pool's idle time → the periodic provider refreshes it; tested by a unit test of the provider's refresh interval, verified in a slot by `m4-deploy`.

## Validation (task 4.2)

- `scripts/check all`: 742 of 743 tests pass. `LocalSeedingTests.Without_an_object_id_the_seeding_resource_has_no_persona_and_reports_itself_skipped` fails only on a machine whose AppHost user secrets set `seed-object-id`, which the test assumes absent; a local-environment limitation, not a defect of this change (CI has no such secret).
- E2E suite (broker `None` through `appsettings.E2E.json`): 30 of 30 journeys pass with `--workers=2`. With the default workers on a 16-thread local machine, 3 to 10 different journeys ran out of the 30 s test timeout each run (load average about 18; every trace shows steady progress and no failed assertion), so the local evidence is the two-worker run; CI's run is the reference.
- Test scripts: 22 of 22 pass with `--workers=2`, including `seeded-cloud-runtime` (task 4.3).
