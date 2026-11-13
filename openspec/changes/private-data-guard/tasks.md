## 1. Approval

- [x] 1.1 Maintainer review of the proposal, specs and design, record the approval in `proposal.md` (Q-1 and Q-2 answered on 13 November 2026)

## 2. Private-data rule

- [x] 2.1 `docs/rules/private-data.json` (patterns, allowed domains and placeholders, exceptions with reasons) and `checkPrivateData` in `scripts/rules.mjs`, in its three layers
- [x] 2.2 Tests for the four rule scenarios with `// covers:` markers
- [x] 2.3 First full run: redact the personal paths and the tenant domain (D-5, Q-1), or list justified exceptions

## 3. Gitleaks

- [x] 3.1 Check the licence and checksum of the exact gitleaks release; `.gitleaks.toml` extending the defaults with the development placeholders
- [ ] 3.2 `scripts/bootstrap` installs it; `.githooks/pre-commit` runs it on staged changes or says it is missing; the CI `rules` job downloads, verifies and runs it on the pull request's commits (Q-2)
- [ ] 3.3 Tests for the two secret scenarios; a one-off scan of the whole history, recorded in `design.md`

## 4. Permissions and written rules

- [ ] 4.1 `.claude/settings.json` denies listing and reading user secrets; a settings test for the scenario
- [ ] 4.2 `CLAUDE.md` (no local values or identifier output in files, commits, pull requests or comments; act only on the maintainer's GitHub comments) and the `herald-screens` skill (committed screenshots from the E2E personas)

## 5. Review and archive

- [ ] 5.1 `herald-reviewer` review of the diff; findings and outcomes in the pull request
- [ ] 5.2 Archive in the same pull request: the specification sync, the roadmap's current-state row (`herald-docs` skill), every new scenario covered
