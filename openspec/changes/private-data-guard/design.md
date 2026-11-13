## Context

On 13 November 2026 the repository was assessed before being made public:
- **No secret and no real tenant, client or object ID** in the tree or its 225 commits. They live in the AppHost's user secrets, and the documentation uses placeholders.
- **The real identifiers found** were the External ID domain shared with Arcana, in one archived design, and personal paths (`/home/<name>/…`) in 7 mockup manifests and 6 archived files.
- **The emails in the tree** are `example.*`, and the only IP is `127.0.0.1`.
- **Commit metadata** carries the maintainer's personal addresses in 56 commits. That is metadata, outside this change.

`scripts/rules.mjs` already checks forbidden terms from data (`docs/rules/forbidden-terms.json`), spelling and licences, in three layers (harness-engineering D-1). GitHub's secret scanning with push protection recognises known secret formats, but not identifiers.

## Goals / Non-Goals

**Goals:**
- No real identifier, personal address, personal path or secret reaches a commit unnoticed.
- The agent cannot read the local secrets it would copy.
- The rules for what hooks cannot see (pull request text, comments, screenshots) are written where the agent reads them.

**Non-Goals:**
- Rewriting history.
- GitHub settings.
- Scanning images.

## Decisions

- **D-1 Private data as a rule of `scripts/rules.mjs`.**
  - `checkPrivateData(files, config)` runs on every text file the rules already read, in every folder. Private data is as harmful in a document as in code.
  - `docs/rules/private-data.json` holds:
    - each pattern with its message;
    - the allowed email domains and directory-host placeholders;
    - the exceptions, each with a file, a value and a reason.
  - **Synthetic GUIDs:**
    - a GUID with a group of only zeros (`-0000-` or `00000000`), or made of one repeated digit, is synthetic. A random version-4 GUID almost never has a zero group, and those it might are caught by review;
    - well-known example GUIDs, such as OpenAPI's `3fa85f64-…`, are listed exceptions.
  - **Hosts:** a placeholder such as `<subdomain>.ciamlogin.com` does not match, because the pattern requires a real label.
  - **Personal paths** match `/home/<name>/`, `/Users/<name>/` and `C:\Users\<name>\`. Generic tool paths (`/home/runner/`, `/tmp/`) are not personal.
  - **Public IPs:** private ranges, loopback and documentation ranges are allowed.
  - *Alternative:* gitleaks custom rules for identifiers. Rejected: the exceptions would live in another tool's format, outside the three layers' single script, and the agent's edit hook would not see them.
- **D-2 Gitleaks for secrets.**
  - A pinned release binary with its checksum:
    - `scripts/bootstrap` installs it where it can;
    - `.githooks/pre-commit` runs `gitleaks git --staged` when it is installed, and says so when it is not;
    - the CI `rules` job downloads and verifies it and scans the pull request's commits.
  - Its configuration extends the default rules, with an allow list only for the known development placeholders (`SAS_KEY_VALUE`, the E2E database password).
  - A one-off scan of the whole history is recorded here.
  - **As implemented:** gitleaks 8.30.1 (MIT, checked in its release archive), installed by `scripts/gitleaks`, which holds the version and the SHA-256 of the Linux and macOS archives. The default rules found nothing, the development placeholders included, so `.gitleaks.toml` only extends them.
  - *Alternative:* the gitleaks GitHub Action. Rejected: it adds a third-party action, and its terms vary by account type.
  - *Alternative:* TruffleHog. Rejected: AGPL-3.0.
- **D-3 Denied secret reads.** `.claude/settings.json` denies, in every permission mode:
  - `Bash(dotnet user-secrets list*)`;
  - `Read(~/.microsoft/usersecrets/**)`;
  - `Read(**/AppData/Roaming/Microsoft/UserSecrets/**)`.

  The agent can still set a secret when the maintainer dictates it, and it never needs to read one: the AppHost reads them.
- **D-4 Written rules where hooks cannot reach.**
  - `CLAUDE.md` forbids copying local configuration values, or output with identifiers, into files, commits, pull requests and comments. It also says to act only on GitHub comments from the maintainer.
  - The `herald-screens` skill requires committed screenshots to come from the E2E environment's personas.
- **D-5 Clean-up.**
  - The manifests' `sourceUrl` becomes a path relative to the repository (`prototypes/frontend/…`).
  - In archived files, the personal path and the tenant domain are replaced with placeholders, with a note that the values were redacted on 13 November 2026 (approved in Q-1).

## Risks / Trade-offs

- **False positives slow edits** → exceptions with reasons; the edit hook reports only the edited file.
- **A real GUID with a zero group passes** → unlikely for random GUIDs. The directory's real identifiers live in user secrets, which the agent can no longer read.
- **Gitleaks is missing on a machine** → the hook says so, and CI is the backstop.
- **Downloading gitleaks in CI adds seconds to `rules`** → measured in this change; it stays within the `rules` job.
- **Pull request text and comments are not scanned** → written rule (D-4). GitHub's secret scanning covers secrets in them; identifiers rely on the rule.

## Maintainer answers (13 November 2026)

- **Q-1 Archived changes:** may be edited to redact the personal paths and the tenant domain (D-5 as written).
- **Q-2 CI scan:** the pull request's commits only; the whole history is scanned once, in this change.

## Redaction (13 November 2026, task 2.3)

The rule's first full run found 323 personal paths in 14 files and the tenant domain in one archived design, the values the assessment had found, and nothing else. They were replaced:
- `file:///home/<name>/Code/herald/` and `/home/<name>/Code/herald/` became paths relative to the repository: the mockup manifests' `sourceUrl` and links in archived reviews;
- the bare checkout path became `<repository>`, and the other home paths became `<home>/`;
- the External ID domain became `<directory>.onmicrosoft.com`.

The archived changes of 8 and 9 November 2026 hold these placeholders since this date (Q-1). Their findings are otherwise unchanged.
