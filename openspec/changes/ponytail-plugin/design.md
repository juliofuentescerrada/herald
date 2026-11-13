## Context

Ponytail (`DietrichGebert/ponytail`, MIT) is a Claude Code plugin. Its Node hooks inject "laziest solution that works" instructions:
- at session start, resume, clear and compact;
- when a subagent starts;
- on each prompt.

A module also records each turn's cost and tests in `~/.config/ponytail/band/`. It sends them to a webhook only if one is configured, and none is by default. The maintainer runs it locally at user scope, which cloud sessions never see. Its latest tag on 13 November 2026 is `v5.3.3` (commit `96608e0`, 29 October 2026).

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
- **D-2 Precedence.** `CLAUDE.md` gains one line: the plugin's minimalism never removes what the change's specifications, tests, folder rules or ADRs require. The `herald-reviewer` checks against those, and the harness metrics show its effect.
- **D-3 Third-party code in every session.** The plugin's hooks run with the session's repository access. Pinning to a tag means a new version enters only through a pull request that changes the tag, after a look at its hooks.

## Risks / Trade-offs

- **A moved tag changes the code without a pull request** → the commit is recorded here; an upgrade checks the tag's commit.
- **The plugin's instructions conflict with Herald's** → D-2, the reviewer and the metrics.
- **Anyone who clones the public repository is offered the plugin** → it is declared, not forced: Claude Code asks before trusting a project's plugins.
- **Cloud sessions may not install project-declared plugins on their own** → task 2.3 checks a fresh session; if they do not, the environment's setup script installs it as a fallback, recorded here.
