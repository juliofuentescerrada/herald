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
- **D-6 Personas.** Two owners of different organisations now (D-21's isolation); the player, captain and referee personas are added with H2. Their object ids are the seed tool's `Herald__Seed__Personas__Main__ObjectId` and `…__Rival__ObjectId`, from the repository's secrets `HERALD_PERSONA_MAIN_OBJECT_ID` and `…_RIVAL_…` (repository level because `infra.yml` runs with no environment, and secrets because a step prints its variables in the public run log; review of 27 November 2026); display names are the tool's invented ones.
- **D-7 Smoke check and cold starts.** `curl` with timing on the public home page, `/api/…` through it and the admin's `runtime-config.json`, each retried until it answers or a timeout (implemented in `deploy/smoke-check`: the API request is `/api/public/tournaments/<empty id>`, whose 404 problem document only the API produces, so it proves the forwarding without depending on a seeded identifier); the first response's time is written to the run's summary and, after a week, the measured values to `design.md` and ADR 0012.

## Risks / Trade-offs

- `id-herald-delivery` also trusts a plain `pull_request` (`infra.yml`'s plan), so a branch's job with no environment signs in with Contributor and AcrPush, and the `main` environment's branch policy closes only one route → the boundary is write access to the repository, the maintainer's only (`docs/operations/deployment.md`); a read-only identity for `pull_request` would be a Steward change.
- Cold starts in series (web app, then API) after zero replicas → measured (D-7); a minimum replica above zero would break ADR 0019's cost estimate and needs a decision.
- A pull request that keeps `preview` and is forgotten blocks the slot → the guard's refusal comment names the holder; removing its label releases it.
- The first `main` deployment seeds the persona organisations; later scenario additions seed on the next merge.

## Evidence

- **Infrastructure applied by hand (task 4.2, maintainer, 28 November 2026):** from `slice/m4-deploy` with OpenTofu 1.13.9 and the maintainer's own sign-in, the directory and persona values passed as `TF_VAR_`s as `infra.yml` passes them: `0 added, 4 changed, 0 destroyed`, every change in place. The shared registry answers the maintainer's Entra sign-in (`az acr login --expose-token`); a plain `az acr login` stops only at the local Docker credential store, which the workflow does not use.
- **First `preview` deployment (task 4.2, 28 November 2026):** this slice's pull request (#101) labelled `preview` deployed `af91fc0` with the job's reset and seeding, the smoke check passed and the comment named the addresses and personas only; the slot job took about 6.5 minutes. The first label found no `Deploy` run: `deploy.yml` had not parsed since it was written (an unquoted `: ` in the release step's `run`), which the Node tests, reading it as text, did not catch; fixed in `af91fc0`.
- **Slot isolation (task 4.2, maintainer as the server's Entra administrator, 28 November 2026):** `has_database_privilege('id-herald-preview-api', 'herald_main', 'CONNECT')` and `has_database_privilege('id-herald-api', 'herald_preview', 'CONNECT')` are both false; `\l` shows `CONNECT` on each database for its own slot's role and the administrator only, with no `PUBLIC` entry. This checks the grant rather than a connection as the identity, whose token only Azure can issue.
