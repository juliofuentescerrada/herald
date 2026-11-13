## Status

**Approved for implementation on 13 November 2026** (gate 1.1). The maintainer asked for it the same day: pin the version, add the precedence line to `CLAUDE.md`, and propose, implement and archive it in one pull request.

## Why

The maintainer uses the ponytail plugin locally, which steers the agent towards the simplest solution that works. The cloud sessions that implement slices unattended (ADR 0018) do not load it, because a plugin installed at user scope stays on the maintainer's machine. Code generated remotely should follow the same discipline as code generated locally.

## What Changes

- **The plugin is declared in the repository:** `.claude/settings.json` gains:
  - the `ponytail` marketplace (GitHub `DietrichGebert/ponytail`), pinned to the tag `v5.3.3`;
  - `ponytail@ponytail` in `enabledPlugins`.

  Every Claude Code session that opens the repository, cloud or local, loads it at that version. A new version enters only through a pull request.
- **Herald's rules win:** `CLAUDE.md` states that the plugin's minimalism never removes what the change's specifications, tests, folder rules or ADRs require.
- **Checked in a session:** the declaration is validated with the Claude Code CLI, and a fresh cloud session is checked to load it.

Out of scope:
- the plugin's optional webhook and board, which stay off;
- other plugins.

Screens: none; mockups are not applicable. Notifiable facts: none (ADR 0017). Decision register: no product rule is involved.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `agent-harness`: a requirement that the coding plugin is declared, pinned and subordinate to the repository's rules.

## Impact

- Changed: `.claude/settings.json`, `CLAUDE.md`, `scripts/settings.test.mjs`, `scripts/harness.test.mjs`.
- Development tool: ponytail 5.3.3 (MIT), a Claude Code plugin with Node hooks; no package dependency.
- No change to the host, modules, contracts or web applications.
