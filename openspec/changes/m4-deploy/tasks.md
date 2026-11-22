## 1. Review gates

- [ ] 1.1 Record in proposal.md that merging the M4 batch proposals pull request approved this change, with any change the review asked for (ADR 0018); verify with `openspec validate m4-deploy`
- [ ] 1.2 Check that `m4-cloud-runtime`, `m4-images` and `m4-infra` are merged and Steward's `onboard-herald` group 5 is done

## 2. Personas and environments (operator, with the maintainer)

- [ ] 2.1 Two owner personas in the shared directory, assigned to Herald's applications only; each slot's admin address as a redirect URI of `herald-admin`; `docs/operations/identity.md` updated
- [ ] 2.2 Variables of the `main` and `preview` GitHub environments (directory identifiers, persona object ids), never in Git

## 3. Pipeline

- [ ] 3.1 `scripts/preview-slot.mjs` (D-2) and its Node tests for the four guard scenarios; the `preview` label in `scripts/github-setup`
- [ ] 3.2 `.github/workflows/deploy.yml` (D-1, D-3, D-4, D-5) and a Node test reading it for the `main` and `preview` step scenarios
- [ ] 3.3 Smoke check, timings and the pull request comment (D-7), with a test that the composed comment carries no identifiers

## 4. First deployments

- [ ] 4.1 Merge deploys `main`; the owner persona signs in and finds its seeded organisation; a second merge deploys with no operator
- [ ] 4.2 This slice's own pull request labelled `preview`: deployed with a reset, and a role of `herald_preview` cannot connect to `herald_main` (Steward's task 5.1 records it); record both in design.md and in Steward's evidence
- [ ] 4.3 After a week of use: the measured monthly cost of both slots, the cold-start times and log volume in design.md, ADR 0019 and the roadmap; review `budget-herald` and the trace ratio

## 5. Documents, validation and completion

- [ ] 5.1 `docs/operations/deployment.md`; `CLAUDE.md`, the pull request template and `docs/operations/delivery-tracking.md` for the preview test round
- [ ] 5.2 `covers` markers for every scenario this change adds; `node scripts/spec-coverage.mjs` passes; `scripts/check all`
- [ ] 5.3 Test script in `e2e/scripts/`: on the deployed `preview`, the owner persona's seeded organisation, with screenshots of each step
- [ ] 5.4 ADRs 0012 and 0019 proposed for acceptance with what M4 measured; roadmap M4 exit criteria checked; herald-reviewer review of the diff; sync the specs and archive the change in the slice's pull request
