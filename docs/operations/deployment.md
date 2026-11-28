# Deployment: the `main` and `preview` slots

Herald runs in two slots on Steward's shared platform ([ADR 0012](../adr/0012-azure-hosting.md), [ADR 0019](../adr/0019-preview-environments-and-synthetic-data.md)). `infra/` defines them and `.github/workflows/deploy.yml` deploys them (change `m4-deploy`). This guide says what a deployment does and what the maintainer does around it.

## What deploys when

| Slot | Deployed by | Data |
|---|---|---|
| `main` | Every merge to `main` | Kept: the seeding job migrates and adds only the scenarios not yet present |
| `main`, reset | *Actions → Deploy → Run workflow* with **reset** checked | Herald's schemas dropped, then migrated and seeded |
| `preview` | A slice pull request with the `preview` label, and every push to it | Reset and seeded on every deployment |

A deployment builds the four images, pushes them as `herald/<slot>/<image>:<commit>`, applies `infra/` (`main` only), runs the slot's seeding job and waits for it, then points the three apps at the new images (`deploy/deploy-slot`). A failed job stops the deployment before any app changes. A smoke check follows (`deploy/smoke-check`), and its run summary records how long each request took to answer the first time, which measures the cold start.

## Testing a slice on `preview`

1. Add the `preview` label to the slice's pull request once it is ready for a test round.
2. The `Deploy` workflow deploys it and comments with the slot's addresses and the personas to sign in as. If another pull request holds the slot, it removes the label and names the holder instead.
3. Test with the slice's test script (`e2e/scripts/`) as the personas, with the passwords in the password manager.
4. Remove the label or merge/close the pull request: the slot is released for the next slice.

## Variables

The workflow signs in as `id-herald-delivery` through the `main` and `preview` GitHub environments. Everything below is set at the repository's level, because `infra.yml` runs without an environment, and never appears in Git; [identity](identity.md#8-deployed-slots) says where each value comes from.

- **Secrets:** `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, and the personas' `HERALD_PERSONA_MAIN_OBJECT_ID` and `HERALD_PERSONA_RIVAL_OBJECT_ID`. The object ids are secrets because a step prints its variables in the run log, which is public, and only secrets are masked.
- **Variables:** `HERALD_AUTH_*`, which the admin publishes anyway in its `runtime-config.json`, and `HERALD_DATABASES_ONBOARDED`.

The `main` environment allows deployments from the `main` branch only (*Settings → Environments → main → Deployment branches and tags*). Without that, a branch could edit `deploy.yml` so that a job declares `environment: main` and deploys it from a pull request. It is not the boundary, though: `id-herald-delivery` also trusts a plain `pull_request`, so a branch's job with no environment signs in with the same roles, and every secret is set at the repository's level. What keeps the slots safe is who can push to this repository: the maintainer only.

## When a deployment fails

- **The seeding job failed:** the apps still run the previous images. Its logs are in the slot's Application Insights (`appi-herald[-preview]`). Fix the cause and push again, or run the workflow again.
- **The smoke check failed:** the apps run the new images but do not answer as expected. The summary names the request; the app's logs show why.
- **`preview` is stuck with a forgotten pull request:** remove its label.
- **Two pull requests labelled within seconds:** each guard sees the other's label, so both are refused and the slot stays free. Label one of them again.
- **A labelled pull request with a merge conflict:** GitHub runs no workflow for it, so it is not deployed, yet its label refuses the others. Resolve the conflict or remove the label.
- **A deployment queued behind another when its label was removed:** it still deploys once the slot's running deployment ends. Remove the label again, or label the next pull request, which redeploys the slot.
