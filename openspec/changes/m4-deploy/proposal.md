## Status

**Proposed in the M4 batch's proposals pull request, 22 November 2026.** The technical decisions come from the batch's decision session of the same day ([M4 batch](../../../docs/roadmap.md#batch-main-and-preview-on-azure), ADRs 0012, 0018 and 0019). It depends on `m4-cloud-runtime`, `m4-images`, `m4-infra` and Steward's `onboard-herald` group 5. Merging the proposals pull request approves this change (ADR 0018); task 1.1 records that approval.

**Approved for implementation on 22 November 2026**, when the maintainer merged the M4 batch proposals pull request (#95) (ADR 0018). The review's answers concerned `m4-cloud-runtime` and `m4-infra`; it asked for no change to this proposal.

## Why

M4's exit criteria (roadmap): deploy on merge, protected credentials, the `main` environment and a `preview` slot for the slice pull request with seeded data and a test account per persona, and the measured cost of both. From H2, ADR 0018 tests every slice on `preview`.

## What Changes

- **`deploy.yml`**, signed in as `id-herald-delivery` through the slot's GitHub environment (`main`, `preview`), one deployment per slot at a time (a concurrency group per slot):
  - **`main`, on every merge:** build, push the four images to `herald/main/<image>:<commit>`, `tofu apply`, run `caj-herald-seed` (migrations, Wolverine's tables and the scenarios not yet present), then point the three apps at the new images and wait until they answer.
  - **`preview`, for the slice pull request that holds the `preview` label:** the same build and push to `herald/preview/<image>`, then the job with the reset (`preview` is recreated and seeded on every deployment, ADR 0019), then the apps. No `tofu apply`: infrastructure changes apply from `main` only.
  - **A smoke check** after each deployment: the public home page and an `/api` request through it, and the admin's `runtime-config.json`, each answering 200; the first response's time is recorded in the run (ADR 0012's cold-start measurement).
- **Taking and releasing `preview` (decision session):** adding the `preview` label to a slice pull request deploys it and every push redeploys it; the workflow refuses, with a comment, while another open pull request holds the label; removing the label or closing the pull request releases the slot. `scripts/github-setup` creates the label.
- **The pull request comment:** the slot's addresses, the personas to sign in with (names only, never passwords or object ids), the seeded scenarios and the slice's test script.
- **Personas and redirect URIs (operator, `docs/operations/identity.md`):** the owner and a second owner of another organisation (D-21), created in the shared directory and assigned to Herald's applications only; each slot's admin address registered once in `herald-admin`; the object ids and the directory's identifiers as variables of each GitHub environment, never in Git. Passwords stay in the maintainer's password manager.
- **Cost:** after some days of use, the measured monthly cost of `main` and `preview` recorded beside the base cost (ADR 0019, roadmap), and `budget-herald` and the trace ratio reviewed against it.
- **Documents:** `CLAUDE.md` (labelling `preview` before a test round), the pull request template (the test round on the preview), `docs/operations/delivery-tracking.md`, a deployment guide `docs/operations/deployment.md`; ADRs 0012 and 0019 proposed for acceptance once both slots have run.

Out of scope: production, a second preview slot, Service Bus, a custom domain.

Screens: none created or modified; mockups are not applicable.

Notifiable facts: none introduced (ADR 0017's inventory is unchanged).

Decision register: D-21 (identity keyed by directory and object identifiers, confirmed) shapes the personas; no undecided rule is needed.

## Capabilities

### New Capabilities

- `deployment-pipeline`: how `main` and `preview` are deployed, who may hold `preview`, what a deployment checks and reports.

### Modified Capabilities

None.

## Impact

- New: `.github/workflows/deploy.yml`, `scripts/preview-slot.mjs` and its tests, `docs/operations/deployment.md`.
- `scripts/github-setup` (the `preview` label), `CLAUDE.md`, `.github/pull_request_template.md`, `docs/operations/delivery-tracking.md`, `docs/operations/identity.md`, `docs/roadmap.md`, ADRs 0012 and 0019.
- GitHub: variables of the `main` and `preview` environments.
