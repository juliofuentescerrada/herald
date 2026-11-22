## Status

**Proposed in the M4 batch's proposals pull request, 22 November 2026.** The technical decisions come from the batch's decision session of the same day ([M4 batch](../../../docs/roadmap.md#batch-main-and-preview-on-azure), ADRs 0012 and 0019) and Steward's onboarding of Herald (`onboard-herald`, groups 1–4; #86). Merging the proposals pull request approves this change (ADR 0018); task 1.1 records that approval.

**Approved for implementation on 22 November 2026**, when the maintainer merged the M4 batch proposals pull request (#95). Review answer: Q1 accepted, a second AcrPull-only identity per slot for the web apps. The review asked for no other change.

## Why

Steward has onboarded Herald: `rg-herald` (created by `infra/bootstrap.sh`), `id-herald-delivery` with its federations and grants, and the `herald` state container. Herald's own resources do not exist yet, and Steward's group 5 (the slot databases) needs the object ids of the slot identities that this change creates.

## What Changes

- **OpenTofu in `infra/`**, as Archivist's: `versions.tf` (OpenTofu 1.13, azurerm ~> 5.12, providers registered by the bootstrap), `backend.tf` (Steward's `stjfcmanagement`, container `herald`, Entra only), and `main.tf` finding the shared resources by their documented names (`cae-shared`, `crjfcshared`, `log-shared`, `psql-jfc-shared`), never by reading Steward's state.
- **Per slot** (`main` without a suffix, `preview` with `-preview` before the function, decision session: `ca-herald-api`, `ca-herald-preview-api`):
  - `id-herald[-preview]-api`: the slot's identity, its database's only role (Steward's ADR 0010), used by the API and the job; AcrPull on the registry through Steward's delegation.
  - `id-herald[-preview]-web`: the identity the two web apps pull their images with, AcrPull only (Q1).
  - `ca-herald[-preview]-api`: the host, internal ingress, probes on `/alive` and `/health`, minimum zero replicas, maximum one.
  - `ca-herald[-preview]-public` and `ca-herald[-preview]-admin`: external ingress on Container Apps' default addresses, minimum zero replicas.
  - `caj-herald[-preview]-seed`: a manually triggered job running the `seed` image as the slot's identity.
  - `appi-herald[-preview]`: Application Insights on `log-shared`.
  - Configuration as environment variables: broker `None`, Entra database authentication, trace ratio 0.25, the directory's identifiers taken from GitHub environment variables (never from Git); `preview`'s job with the reset on, `main`'s without.
- **Images:** created with a placeholder image and ignored afterwards (`ignore_changes`); `m4-deploy` sets them.
- **Databases:** once Steward's operator has created `herald_main` and `herald_preview` (group 5), a `databases_onboarded` variable imports them into this state, protected from destruction.
- **`budget-herald`:** 10 EUR a month on `rg-herald`, alerting at 80 % and 100 % actual and 100 % forecast (decision session).
- **`infra.yml`:** on pull requests that change `infra/`, `tofu fmt -check`, `validate` and a plan signed in as `id-herald-delivery` through its `pull_request` federation, summarised in the run. The first `apply` is run by the maintainer from `main` through `m4-deploy`'s workflow, or by hand once, as Steward's guide says (step 9).

Out of scope: the deployment workflow and images (`m4-deploy`, `m4-images`), Key Vault (no secret; ADR 0012), Service Bus (H4, H5), a custom domain.

Screens: none created or modified; mockups are not applicable.

Notifiable facts: none introduced (ADR 0017's inventory is unchanged).

Decision register: none; the rules here are technical (no §15 row).

## Capabilities

### New Capabilities

- `cloud-infrastructure`: Herald's Azure resources per slot, how they find Steward's, what each identity may do, and how a plan is checked.

### Modified Capabilities

None.

## Impact

- New: `infra/{versions,backend,main,variables,outputs}.tf`, `.github/workflows/infra.yml`, `infra/infra.test.mjs`.
- `scripts/ci-changes.mjs`: `infra/` classified so that `infra.yml` runs and the code jobs do not.
- Cost: identities, Application Insights and the container apps at zero replicas cost nothing idle; usage is measured by `m4-deploy`.
