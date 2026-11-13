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
  - `checkPrivateData(files, config)` runs on every tracked file that is not binary (a NUL byte or a binary extension), in every folder, shell scripts and `.slnx` included. Private data is as harmful in a document as in code.
  - `docs/rules/private-data.json` holds:
    - each pattern with its message;
    - the allowed email domains and directory-host placeholders;
    - the exceptions, each with a file, a value and a reason.
  - **Synthetic GUIDs:**
    - a GUID with a group of only zeros (`-0000-` or `00000000`), or made of one repeated digit, is synthetic. A random version-4 GUID almost never has a zero group, and those it might are caught by review;
    - well-known example GUIDs, such as OpenAPI's `3fa85f64-…`, are listed exceptions.
  - **Hosts:** a placeholder such as `<subdomain>.ciamlogin.com` does not match, because the pattern requires a real label.
  - **Personal paths** match `/home/<name>/`, `/Users/<name>/` and `C:\Users\<name>\`. Generic tool paths (`/home/runner/`, `/tmp/`) are not personal.
  - **Public IPv4 addresses:** private, loopback, link-local, shared, benchmarking, documentation, multicast and reserved ranges are allowed. A run of dotted numbers longer than four (an OID) and an address ending in `.0.0` (a version number) are not taken for IPs. IPv6 is out of scope.
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
  - In archived files, the personal path and the tenant domain are replaced with placeholders (approved in Q-1). The note that they were redacted lives in this change's design, below, rather than in each archived file.

## Risks / Trade-offs

- **False positives slow edits** → exceptions with reasons; the edit hook reports only the edited file.
- **A real GUID with a zero group passes** → unlikely for random GUIDs. The directory's real identifiers live in user secrets, which the agent can no longer read.
- **Gitleaks is missing on a machine** → the hook says so, and CI is the backstop.
- **Downloading gitleaks in CI adds seconds to `rules`** → measured in this change; it stays within the `rules` job.
- **Pull request text and comments are not scanned** → written rule (D-4). GitHub's secret scanning covers secrets in them; identifiers rely on the rule.

## Review (13 November 2026)

The `herald-reviewer` subagent reviewed the diff against this change. Nothing was blocking. Findings and outcomes:

1. **Gitleaks did not name the file or the rule.** **Fixed:** `--verbose`, and the test asserts the file and `aws-access-token`.
2. **Bootstrap stopped where gitleaks could not install** (Windows Git Bash, macOS's bash 3.2, no network). **Fixed:**
   - bootstrap continues with a message;
   - `scripts/gitleaks` runs under bash 3.2, falls back to `shasum`, cleans up its temporary folder and names the path for a manual install.
3. **The rule skipped scripts without an extension, `.slnx`, `.toml` and `.txt`.** **Fixed:** every tracked file that is not binary (D-1).
4. **Escaped or lower-case Windows paths, and `/home/<name>` without a slash, were missed.** **Fixed,** with tests.
5. **The secret-read denials can be worked around** (globs, `find`, `jq`), and Aspire's MCP server may show parameter values. **Left to the maintainer:** they are permission settings.
6. **The broad Bash denials also block routine commands** such as `grep UserSecretsId`. **Left to the maintainer,** with finding 5.
7. **D-3 and the gitleaks requirement no longer matched what was built.** **Fixed:** the requirement now says an allow list holds only values that are not secrets. D-3 waits for findings 5 and 6.
8. **The skip list had no reasons and skipped the rule's own file.** **Fixed:** only `pnpm-lock.yaml` is skipped, with its reason.
9. **Versions and OIDs were taken for IPs, and some reserved ranges counted as public.** **Fixed.** IPv6 is out of scope (D-1, the requirement).
10. **`icon@2x.png` was taken for an email.** **Fixed.**
11. **A force push to `main` failed the CI scan.** **Fixed:** without a reachable base, CI scans the whole history.
12. **The hook and the CI range are not tested directly, and the tests download gitleaks when it is missing.** **Accepted:**
    - the hook's two steps run in every commit of this change;
    - CI installs gitleaks before the tests, and `scripts/bootstrap` does so locally.
13. **The placeholder test copied the values.** **Fixed:** it stages the real files.
14. **The archived files carry no redaction note.** **Fixed in D-5:** the note lives in this change's design.

## Maintainer answers (13 November 2026)

- **Q-1 Archived changes:** may be edited to redact the personal paths and the tenant domain (D-5 as written).
- **Q-2 CI scan:** the pull request's commits only; the whole history is scanned once, in this change.

## Redaction (13 November 2026, task 2.3)

The rule's first full run found 323 personal paths in 14 files and the tenant domain in one archived design, the values the assessment had found, and nothing else. They were replaced:
- `file:///home/<name>/Code/herald/` and `/home/<name>/Code/herald/` became paths relative to the repository: the mockup manifests' `sourceUrl` and links in archived reviews;
- the bare checkout path became `<repository>`, and the other home paths became `<home>/`;
- the External ID domain became `<directory>.onmicrosoft.com`.

The archived changes of 8 and 9 November 2026 hold these placeholders since this date (Q-1). Their findings are otherwise unchanged.

## History scan (13 November 2026, task 3.3)

`scripts/gitleaks git --log-opts="--all" .` over every ref (208 commits on `main`'s history, about 4.7 MB) and `gitleaks dir` over the working tree: **no leaks found**. The development placeholders (`SAS_KEY_VALUE`, the E2E database password) do not trip the default rules, which `scripts/gitleaks.test.mjs` keeps proving.
