## Context

After `m4-infra` and Steward's group 5, each slot has its apps and job at zero replicas with placeholder images, its identity with a role in its database, and Application Insights. `id-herald-delivery` signs in from the `main` and `preview` GitHub environments and from `pull_request` (Steward's evidence, group 4); it has AcrPush, Contributor on `rg-herald` and no database role, so the job, not the runner, touches the databases. Steward's purge keeps two tags per repository, which is why each slot has its own repositories.

## Goals / Non-Goals

**Goals:** a merge deploys `main` with no operator; a labelled slice pull request deploys `preview` seeded; a reset needs no server privilege; the maintainer knows where to test and as whom.

**Non-Goals:** production, approvals on environments (none configured; Steward's ADR 0004), blue-green or revision traffic splitting.

## Decisions

- **D-1 One workflow, two triggers.** `push` to `main` deploys `main`; `pull_request` (`labeled`, `synchronize`, `unlabeled`, `closed`) deploys or releases `preview`. Each job declares `environment: <slot>`, which is both its OIDC subject and its configuration. Concurrency groups `deploy-main` and `deploy-preview`, not cancelling a running deployment.
- **D-2 The label guard.** `scripts/preview-slot.mjs` decides, from the event and the open pull requests with the label, whether to deploy, refuse (another holder) or release; the workflow comments its answer. A Node test covers each case. *Alternative:* deploying every ready slice pull request; rejected in the decision session.
- **D-3 Order of a deployment.** Build and push; `tofu apply` (`main` only); update the job's image and start it, waiting for success (reset on `preview` by its configuration, `m4-infra`); update the apps' images; smoke check. A failed job stops the deployment before the apps change, so the apps never run against a half-migrated database.
- **D-4 Tags.** `<commit sha>`; Steward's purge keeps the last two per repository, so the running image and the previous one survive.
- **D-5 Seeding `main`.** The job runs the scenarios not yet present (the tool skips seeded ones), so `main` keeps its data; a manual `workflow_dispatch` input runs it with the reset, the "manual reset" of ADR 0019.
- **D-6 Personas.** Two owners of different organisations now (D-21's isolation); the player, captain and referee personas are added with H2. Their object ids are the seed tool's `Herald__Seed__Personas__Main__ObjectId` and `…__Rival__ObjectId`, from the environment's variables; display names are the tool's invented ones.
- **D-7 Smoke check and cold starts.** `curl` with timing on the public home page, `/api/…` through it and the admin's `runtime-config.json`, each retried until 200 or a timeout; the first response's time is written to the run's summary and, after a week, the measured values to `design.md` and ADR 0012.

## Risks / Trade-offs

- Cold starts in series (web app, then API) after zero replicas → measured (D-7); a minimum replica above zero would break ADR 0019's cost estimate and needs a decision.
- A pull request that keeps `preview` and is forgotten blocks the slot → the guard's refusal comment names the holder; removing its label releases it.
- The first `main` deployment seeds the persona organisations; later scenario additions seed on the next merge.
