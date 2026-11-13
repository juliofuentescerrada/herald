## Context

Ponytail (`DietrichGebert/ponytail`, MIT) is a Claude Code plugin. Its Node hooks inject "laziest solution that works" instructions:
- at session start, resume, clear and compact;
- when a subagent starts;
- on each prompt.

A module also records each turn's cost and tests in `~/.config/ponytail/band/`. It sends them to a webhook only if one is configured, and none is by default. The maintainer runs it locally at user scope, which cloud sessions never see. Its latest tag on 13 November 2026 is `v5.3.3`, commit `96608e078b2d5ea607c5c3b8b5a54d1c1fba6846` (29 October 2026). Its `marketplace.json` points the plugin at `./`, the same repository, so the marketplace's pin also pins the plugin's code.

## Goals / Non-Goals

**Goals:**
- The same plugin, at the same version, in every session that works on Herald.
- Herald's rules take precedence over the plugin's.

**Non-Goals:**
- Configuring its webhook or board.
- Evaluating other plugins.

## Decisions

- **D-1 Project-scope declaration, pinned.**
  - `.claude/settings.json` declares the marketplace with `extraKnownMarketplaces` (a GitHub source at `ref: v5.3.3`) and enables `ponytail@ponytail`.
  - The declaration is written with `claude plugin marketplace add … --scope project` and `claude plugin install … --scope project`, so its shape is the one Claude Code reads.
  - *Alternative:* installing it in the cloud environment's setup script. Rejected: it would live outside the repository, apply to one environment only and escape review.
- **D-2 Precedence.**
  - `CLAUDE.md` gains one line: the plugin's minimalism never removes what the change's specifications, tests, ADRs or the rules of any `CLAUDE.md` require.
  - The plugin's subagent hook also reaches the `herald-reviewer`, the check meant to catch what minimalism drops. Its definition therefore says the plugin's instruction does not apply to reviewing.
  - The harness metrics show the plugin's effect.
- **D-3 Third-party code in every session.**
  - The plugin's hooks run with the session's repository access, outside the deny rules.
  - Pinning to a tag means a new version enters through a pull request that changes the tag. That pull request looks at the new hooks, re-checks the licence and records the tag's full commit here.
  - The marketplace's `ref` takes a branch or a tag, not a commit: Claude Code clones it by name. A commit pin was tried and refused.
  - The committed settings hold no plugin configuration. The plugin's optional webhook stays empty, so its per-turn records stay in the session's `~/.config/ponytail/`.

- **D-4 The bootstrap installs it** (found by task 2.3).
  - A fresh cloud session does not install a plugin its project settings declare.
  - With an empty home, `claude plugin install` does not find the project's marketplace either, until `claude plugin marketplace add` registers it.
  - `scripts/bootstrap`, which the cloud environment's setup script runs before Claude Code starts, therefore adds the marketplace and installs the plugin at local scope (`.claude/settings.local.json`, ignored by git). It reads the repository and tag from `.claude/settings.json`, so the version stays in one place.
  - The step never stops the bootstrap. It was run twice from an empty home: both runs succeeded and installed 5.3.3.

## Risks / Trade-offs

- **A moved tag changes the code without a pull request** → accepted. The marketplace cannot pin a commit, and the author's tags are the published versions. The full commit is recorded here, so a session can compare it with `git ls-remote` if a version looks wrong.
- **The plugin's instructions conflict with Herald's** → D-2, the reviewer and the metrics.
- **The maintainer's own user-scope install may shadow the pinned one locally:** both marketplaces are named `ponytail`, and the user-scope one tracks the default branch. The maintainer removes the user-scope marketplace and plugin, so local sessions load the project's pinned version too (a step after merging, in the pull request).
- **Anyone who clones the public repository is offered the plugin** → it is declared, not forced: Claude Code asks before trusting a project's plugins.
- **Cloud sessions may not install project-declared plugins on their own** → task 2.3 checks a fresh session; if they do not, the environment's setup script installs it as a fallback, recorded here.

## Review (13 November 2026)

The `herald-reviewer` subagent reviewed the diff. Nothing was blocking. Findings and outcomes:

1. **The plugin's subagent hook also reaches the reviewer,** the check meant to catch what minimalism drops. **Fixed (D-2):** the reviewer's definition says the instruction does not apply to reviewing, with a test.
2. **The maintainer's user-scope install may shadow the pinned one locally.** **Recorded in the risks:** the maintainer removes the user-scope install after the merge.
3. **A tag can move.** **Accepted (D-3, risks):** the marketplace's `ref` refuses a commit (tried); the full commit is recorded.
4. **The plugin entry might not be covered by the pin.** **Checked:** `marketplace.json` points it at `./`, the same repository.
5. **The precedence line did not name the root `CLAUDE.md`.** **Fixed:** "the rules of any `CLAUDE.md` (this one included)", with the test updated.
6. **Nothing enforced that no webhook or plugin configuration is committed.** **Fixed:** the settings test asserts it.
7. **No check would notice a licence change.** **Fixed (D-3):** an upgrade re-checks the licence.

## Fresh-session checks (13 November 2026, task 2.3)

1. **A fresh cloud session on the branch, with only the project settings:** `claude plugin list` showed no plugins, no ponytail instruction reached the session, and no hook error appeared. This led to D-4.
2. **A second fresh session, after D-4:** still no plugin. The environment restored its setup checkpoint from the first check ("Setup script cached from previous run"), so the new bootstrap step never ran: the checkpoint follows the environment's setup script, not the bootstrap it calls.
3. **After the maintainer approved a change to the environment's setup script** (its comment now names the plugin, which forces a fresh run), a third fresh session showed:
   - `ponytail@ponytail` 5.3.3 at local scope, enabled;
   - "PONYTAIL MODE ACTIVE — level: full" injected at session start;
   - no hook error.
   - **Consequence:** a change to the bootstrap reaches cloud sessions only when the setup checkpoint is rebuilt. A future version change of the plugin therefore also edits the environment's setup script, or waits for the checkpoint to expire.
