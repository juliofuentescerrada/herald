## 1. Review gates

- [x] 1.1 Record in proposal.md that merging the M4 batch proposals pull request approved this change, with any change the review asked for (ADR 0018); verify with `openspec validate m4-deploy`
- [x] 1.2 Check that `m4-cloud-runtime`, `m4-images` and `m4-infra` are merged and Steward's `onboard-herald` group 5 is done

## 2. Personas and environments (operator, with the maintainer)

- [ ] 2.1 Two owner personas in the shared directory, assigned to Herald's applications only; each slot's admin address as a redirect URI of `herald-admin`; `docs/operations/identity.md` updated
- [ ] 2.2 Variables of the `main` and `preview` GitHub environments (directory identifiers, persona object ids), never in Git

## 3. Pipeline

- [x] 3.1 `scripts/preview-slot.mjs` (D-2) and its Node tests for the four guard scenarios; the `preview` label in `scripts/github-setup`
- [x] 3.2 `.github/workflows/deploy.yml` (D-1, D-3, D-4, D-5) and a Node test reading it for the `main` and `preview` step scenarios; the public app's `NG_ALLOWED_HOSTS` (its own host name) in `infra/apps.tf`, without which the SSR server answers 400 (`m4-images` design)
- [x] 3.3 Smoke check, timings and the pull request comment (D-7), with a test that the composed comment carries no identifiers

## 4. First deployments

The slice's pull request covers 4.2 and 5.3 and is merged; 4.1, 4.3 and 5.4 follow in a second pull request, as `m4-infra`'s did (maintainer, 27 November 2026): `main` deploys only once `deploy.yml` is on it.

- [ ] 4.1 Merge deploys `main`; the owner persona signs in and finds its seeded organisation; a second merge deploys with no operator
- [ ] 4.2 This slice's own pull request labelled `preview`: deployed with a reset, and a role of `herald_preview` cannot connect to `herald_main` (Steward's task 5.1 records it); record both in design.md and in Steward's evidence
- [ ] 4.3 After a week of use: the measured monthly cost of both slots, the cold-start times and log volume in design.md, ADR 0019 and the roadmap; review `budget-herald` and the trace ratio

## 5. Documents, validation and completion

- [x] 5.1 `docs/operations/deployment.md`; `CLAUDE.md`, the pull request template and `docs/operations/delivery-tracking.md` for the preview test round
- [x] 5.2 `covers` markers for every scenario this change adds; `node scripts/spec-coverage.mjs` passes; `scripts/check all`
- [ ] 5.3 Test script in `e2e/scripts/`: on the deployed `preview`, the owner persona's seeded organisation, with screenshots of each step
- [ ] 5.4 ADRs 0012 and 0019 proposed for acceptance with what M4 measured; roadmap M4 exit criteria checked; herald-reviewer review of the diff; sync the specs and archive the change in the slice's pull request
