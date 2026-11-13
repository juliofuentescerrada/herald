## 1. Approval

- [x] 1.1 Maintainer review of the proposal, specs and design, with answers to Q-1 to Q-3; record the approval in `proposal.md`

## 2. Decision and procedure

- [x] 2.1 ADR 0018 revised (D-1 to D-3): scope from H1's remaining slices, the local test round until M4, two slices in progress with declared dependencies, serial test rounds and merges, the follow-ups; its status as Q-1 decides
- [x] 2.2 `CLAUDE.md`: the batch steps of the slice procedure (merge `main` and regenerate before a test round; at most two slices in progress)

## 3. Tracking

- [x] 3.1 `scripts/github-setup [--dry-run]` with its test (`// covers:` the dry-run scenario)
- [x] 3.2 `docs/operations/delivery-tracking.md`: running the script, the board's columns and the labels' meaning
- [x] 3.3 Issue templates (slice "Depends on", batch order and dependencies) and the pull request template's sections, with a test reading them (`// covers:` the template scenarios and "Two independent slices")

## 4. Skills, configuration and status

- [x] 4.1 `herald-screens` (prototypes in batched work), `herald-docs` (archive in the slice's pull request, status in issues), `openspec/config.yaml`
- [ ] 4.2 `README.md` and `docs/roadmap.md` point to the board for status; the roadmap's delivery-process row

## 5. Review and archive

- [ ] 5.1 `herald-reviewer` review of the diff; findings and outcomes in the pull request
- [ ] 5.2 Archive in the same pull request: the specification sync, every new scenario covered
- [ ] 5.3 After merging, the maintainer runs `scripts/github-setup` and creates the board; the agent then creates the H1 batch map's documentation pull request
