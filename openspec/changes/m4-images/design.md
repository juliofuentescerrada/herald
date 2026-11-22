## Context

The host targets .NET 10 and loads Wolverine's generated code statically outside Development (`Internal/Generated`). `tools/Herald.Seed` references the host and `tests/Herald.Testing`. The public application builds with `outputMode: server` to `dist/public/{browser,server}`; the admin application is CSR and reads `/runtime-config.json` at start (`authority`, `clientId`, `apiScope`, `publicUrl`; `web/projects/admin/src/main.ts`), a file ignored by Git. A local Docker build of the Angular SSR application runs out of memory on the maintainer's machine, and CI already builds everything on the runner.

## Goals / Non-Goals

**Goals:** small, non-root images whose content is exactly what each process needs; images that fail in the pull request when they break.

**Non-Goals:** registry, tags and retention (`m4-deploy`, Steward's purge); multi-architecture images; image signing.

## Decisions

- **D-1 Package, don't build, in Docker.** Each Dockerfile copies an artefact the runner has built (`dotnet publish -c Release`, `pnpm --dir web build public|admin`). The images and CI share one build; no SDK or `node_modules` in an image. *Alternative:* multi-stage builds; rejected, it repeats the build and fails locally for lack of memory.
- **D-2 Base images.** `mcr.microsoft.com/dotnet/aspnet:10.0` (non-root `app` user, port 8080) for `api`; `mcr.microsoft.com/dotnet/runtime:10.0` for `seed` unless the in-process host needs ASP.NET Core's shared framework, in which case `aspnet` (the task checks it); `node:<the repository's Node major>-slim` for `public`; `nginxinc/nginx-unprivileged:stable` for `admin`. Pinned by tag and digest in the Dockerfile; Herald has no Dependabot configuration, so a base image is updated by hand in a pull request deployed to `preview`.
- **D-3 The seeding tool stays out of `api`.** `api` copies only `src/Herald.Host`'s publish output. A test reads the image's file list and fails on `Herald.Seed` or `Herald.Testing` assemblies.
- **D-4 Admin configuration at start.** The `admin` image's start script writes `runtime-config.json` from `HERALD_AUTHORITY`, `HERALD_CLIENT_ID`, `HERALD_API_SCOPE` and `HERALD_PUBLIC_URL` (failing to start when one is missing), and nginx forwards `/api/` to `HERALD_API_URL`, the API's internal address (`m4-cloud-runtime` D-5). `.dockerignore` excludes `runtime-config.json` so a local file never enters an image.
- **D-5 CI.** An `images` job builds the four images after the build jobs, from their artefacts, with `docker build` and no push, when `scripts/ci-changes.mjs` reports changes to code or `deploy/images/`. Its tests are a Node test file (`deploy/images/images.test.mjs`) that inspects the built images (user, entry point, files present and absent).

## Risks / Trade-offs

- The image and CI depend on the same build step → intended: one build, one result.
- Base images pinned by digest go stale → updated by hand in a pull request deployed to `preview`; automating it (Dependabot) is a separate decision.
