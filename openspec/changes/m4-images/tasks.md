## 1. Review gates

- [x] 1.1 Record in proposal.md that merging the M4 batch proposals pull request approved this change, with any change the review asked for (ADR 0018); verify with `openspec validate m4-images`

## 2. Images

- [x] 2.1 `api` and `seed` Dockerfiles (D-1, D-2, D-3) and `.dockerignore`
- [x] 2.2 `public` Dockerfile
- [x] 2.3 `admin` Dockerfile, nginx configuration with the `/api/` forwarding, and the start script that writes `runtime-config.json` (D-4)
- [x] 2.4 `deploy/images/images.test.mjs` for the `container-images` scenarios, run against locally built images

## 3. CI

- [x] 3.1 `images` job and its classification in `scripts/ci-changes.mjs` (D-5), with a `covers`-marked test of the classification

## 4. Validation and completion

- [x] 4.1 `covers` markers for every scenario this change adds; `node scripts/spec-coverage.mjs` passes
- [x] 4.2 Full run (`scripts/check all`) and the `images` job green; record image sizes in design.md
- [x] 4.3 Test script in `e2e/scripts/`: the four images started locally (admin with stub configuration), with the admin's `runtime-config.json` and the public home page as captures and a screenshot
- [ ] 4.4 herald-reviewer review of the diff; sync the specs and archive the change in the slice's pull request
