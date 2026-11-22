## Context

Archivist's `infra/` is the reference: `data` sources for the shared environment, IDs composed from Steward's documented names, providers registered by the bootstrap, a placeholder image ignored by OpenTofu, and its database imported once Steward has onboarded it. Herald's delivery identity has Contributor on `rg-herald`, Reader on `rg-shared`, the environment joiner role on `cae-shared`, AcrPush and a delegation limited to AcrPull for service principals on `crjfcshared`, and blob data access to its own state container (Steward's evidence, group 4).

## Goals / Non-Goals

**Goals:** both slots' resources from one state; least privilege per identity; a plan on every pull request that changes them.

**Non-Goals:** the workflow that deploys (`m4-deploy`); production; network isolation inside `cae-shared` (Steward's ADR 0004: shared network scope).

## Decisions

- **D-1 One state, slots as a map.** `locals.slots = { main = "", preview = "-preview" }` and `for_each` over it, so both slots are always equal except for their names and the job's reset. *Alternative:* a state per slot; rejected, the slots share everything but data, and two states double the plans.
- **D-2 Identities.** The slot identity is the API's and the job's, and the role Steward creates in the slot's database. The web apps pull their images with a second, AcrPull-only identity per slot (Q1), so the internet-facing containers hold no identity that reaches a database. AcrPull is assigned on the registry by the delivery identity, as Steward's delegation allows.
- **D-3 Ingress.** The API is internal (`m4-cloud-runtime` D-5); the web apps are external with Container Apps' managed TLS on their default addresses. Their `HERALD_API_URL` is the API's internal address in the environment.
- **D-4 Configuration.** Non-secret values only, as environment variables: the database host, name (`herald_main`, `herald_preview`) and username (the slot identity's name); the identity's client id; `Herald__Messaging__Broker=None`; the trace ratio; the Application Insights connection string, which is not a secret (it allows sending telemetry only); the directory's tenant and client ids and the persona object ids, from the GitHub environments of each slot as `TF_VAR_`s. No Key Vault (ADR 0012).
- **D-5 Images and databases.** Placeholder image with `ignore_changes` on the image, as Archivist. The databases are `azurerm_postgresql_flexible_server_database` resources imported (`import` blocks) when `databases_onboarded` is true, with `prevent_destroy` and their charset and collation ignored.
- **D-6 Plans.** `infra.yml` on pull requests touching `infra/` or the workflow, on GitHub's hosted runners (Steward's ADR 0004), with the plan's summary in the run and the full plan folded; the plan file is not uploaded. A Node test (`infra/infra.test.mjs`) checks statically what the specification requires of the code: names per slot, minimum replicas, ingress, no secrets in variables, `prevent_destroy` on the databases.

## Implementation notes

- **Names (22 November 2026):** the proposal and specification first put `-preview` after the function (`ca-herald-api-preview`); the decision session, ADR 0012 and Steward's `onboard-herald` design put it before (`ca-herald-preview-api`, `id-herald-preview-api`). Both artefacts were corrected to the decision before any resource existed.
- **The static test** lives in `scripts/infra.test.mjs`, not `infra/infra.test.mjs` (D-6): CI's `rules` job runs `scripts/*.test.mjs`, so a test elsewhere would never run.
- **Directory identifiers** are the same for both slots (one directory, one `herald-admin` and `herald-api`, the same personas), and one state plans both slots, so they are repository variables passed as `TF_VAR_`s rather than per-environment ones (D-4). Their names follow the AppHost's (`HERALD_AUTH_AUTHORITY`, `HERALD_AUTH_CLIENT_ID`, `HERALD_AUTH_API_SCOPE`, `HERALD_API_URL`, `HERALD_PUBLIC_URL`), which `m4-images`' admin start script should read too.
- **No principal id in the outputs:** apply logs are public; Steward's operator reads the slot identities with `az identity show`.

## Questions for the review

- **Q1** D-2: a second, pull-only identity per slot for the web apps, or the slot identity for all four (fewer resources, but the public server could reach the database)?

## Risks / Trade-offs

- The first apply depends on Steward's group 5 for the databases → the API and job exist but stay at zero replicas until `m4-deploy` runs after group 5.
- Placeholder images listen on port 80 and the host on 8080 → the target port is set to Herald's ports from the start; the placeholder fails its probes until the first deployment, which is harmless at zero replicas.
