## Status

**Pending the maintainer's review** (gate 1.1). Proposed on 13 November 2026. The maintainer is making the repository public to remove the private repository's GitHub Actions limit. The assessment the same day found no secret or real identifier in the tree or its history; this change keeps it that way.

## Why

Herald becomes a public reference project. Most private data has no secret's shape, so GitHub's secret scanning cannot recognise it:
- the External ID tenant and its domain;
- the maintainer's object ID;
- an email address;
- a path on the maintainer's machine.

The agent writes most of the repository unattended, and on the maintainer's machine it could read the AppHost's user secrets and copy a value into a document, a commit or a pull request. Today no check stops that. Only GitHub's push protection catches well-known secret formats at the server.

## What Changes

- **A private-data rule in `scripts/rules.mjs`**, in its three layers (after each edit, before each commit, in CI), over every text file. It reports:
  - **GUIDs** that are not synthetic (the project's patterns with zero groups, such as `0198f…-0000-…`, `00000000-…`, `11111111-…`) and not in a list of exceptions, each with its reason;
  - **email addresses** outside `example.org`, `example.com`, `example.test` and GitHub's and Anthropic's noreply addresses;
  - **real directory hosts:** `*.onmicrosoft.com`, `*.ciamlogin.com` and `*.b2clogin.com` other than listed placeholders;
  - **personal paths:** `/home/<name>/`, `/Users/<name>/` and `C:\Users\<name>\`;
  - **public IP addresses.**

  The patterns and exceptions are data in `docs/rules/private-data.json`.
- **Gitleaks** (MIT), at a pinned version, for secrets by pattern and entropy:
  - on staged changes in the `pre-commit` hook, when `scripts/bootstrap` has installed it;
  - always in the CI `rules` job;
  - once over the whole history, with the result recorded in the change.
- **The agent cannot read local secrets:** `.claude/settings.json` denies `dotnet user-secrets list` and reading the user-secrets folders (`~/.microsoft/usersecrets/`, `%APPDATA%\Microsoft\UserSecrets\`).
- **Rules for what hooks cannot see,** in `CLAUDE.md`:
  - never copy local configuration values, or command output that carries identifiers, into files, commits, pull requests or comments;
  - act only on GitHub comments from the maintainer.
- **Screenshots come from synthetic data:** the `herald-screens` skill requires that screenshots committed to the repository come from the E2E environment's personas. A local Aspire run seeds as the maintainer, with real identifiers.
- **Clean-up of today's findings:**
  - the External ID domain in an archived design;
  - the personal paths in the mockup manifests and in the archived review inputs.

Out of scope:
- rewriting the commit authors' email addresses (the maintainer's decision, pending);
- GitHub settings (secret scanning, push protection, interaction limits), which the maintainer makes by hand.

Screens: none; mockups are not applicable. Notifiable facts: none (ADR 0017). Decision register: no product rule is involved.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `repository-rules`: the private-data rule and gitleaks.
- `agent-harness`: the denied secret reads join the declared permissions.

## Impact

- New: `docs/rules/private-data.json`, a `checkPrivateData` rule in `scripts/rules.mjs` and its tests.
- Changed:
  - `.githooks/pre-commit`, `scripts/bootstrap` and `.github/workflows/ci.yml`: gitleaks;
  - `.claude/settings.json`: deny rules;
  - `CLAUDE.md` and the `herald-screens` skill;
  - the mockup manifests and the archived files with personal paths or the tenant domain.
- Development tool: gitleaks, a single binary at a pinned version, MIT. Its exact version's licence and checksum are checked before adding it. No production dependency.
