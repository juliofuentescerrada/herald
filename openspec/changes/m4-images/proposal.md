## Status

**Proposed in the M4 batch's proposals pull request, 22 November 2026.** The technical decisions come from the batch's decision session of the same day ([M4 batch](../../../docs/roadmap.md#batch-main-and-preview-on-azure), ADRs 0012 and 0019). Merging the proposals pull request approves this change (ADR 0018); task 1.1 records that approval.

## Why

Each slot runs four things (ADR 0019 and the decision session): the host, the public SSR server, the admin application and the job that resets, migrates and seeds. None has an image. The seeding tool must never be part of the host's image (ADR 0019), and the admin's directory identifiers stay out of the repository and of the image (`docs/operations/identity.md`).

## What Changes

- **Four images**, each with a Dockerfile under `deploy/images/` and a non-root user:
  - `api`: the published host, nothing from `tools/` or `tests/`.
  - `seed`: the published seeding tool with the host it runs in process; its entry point runs the tool.
  - `public`: Node running the built SSR server (`dist/public/server/server.mjs`) with its browser files.
  - `admin`: unprivileged nginx serving the built admin application, forwarding `/api/` to the API's address, and writing `runtime-config.json` at start from environment variables; the image contains no `runtime-config.json`.
- **Built from the pipeline's own build output:** `dotnet publish` and `pnpm build` run on the runner, as in CI, and the images only package their output. Nothing builds inside Docker.
- **CI builds the four images** when their sources or Dockerfiles change, without pushing, so a broken image fails the pull request. Pushing to the registry, one repository per slot (`herald/main/<image>`, `herald/preview/<image>`), is `m4-deploy`'s.

Out of scope: pushing and tags (`m4-deploy`), Azure resources (`m4-infra`), runtime behaviour (`m4-cloud-runtime`).

Screens: none created or modified; mockups are not applicable.

Notifiable facts: none introduced (ADR 0017's inventory is unchanged).

Decision register: none; the rules here are technical (no §15 row).

## Capabilities

### New Capabilities

- `container-images`: what each of Herald's images contains, how it is built and what it must never contain.

### Modified Capabilities

- `continuous-integration`: CI builds the images when their inputs change.

## Impact

- New: `deploy/images/{api,seed,public,admin}/Dockerfile`, the admin's nginx configuration and start script, a `.dockerignore`.
- `.github/workflows/ci.yml` and `scripts/ci-changes.mjs`: an `images` job and its classification.
- No change to the host, the tool or the web applications' code.
