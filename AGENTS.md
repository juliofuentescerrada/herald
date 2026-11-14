# Agent entry point

Read `CLAUDE.md` before working in this repository; its workflow, product-decision boundaries, privacy rules and checks apply to every agent. Read the folder's `CLAUDE.md` when working in `src/`, `tests/` or `web/`. Use the existing OpenSpec change and preserve its approval status.

For UI proposals, mockups, implementation and reviews, load these repository-owned skills:

- `.agents/skills/herald-screens/SKILL.md`: visual-input and screenshot process.
- `.agents/skills/refactoring-ui/SKILL.md`: Refactoring UI practices with Herald's constraints.
- `.agents/skills/herald-docs/SKILL.md`: documentation ownership and decision status.

Their `SKILL.md` entry points are links to the canonical `.claude/skills/` sources; edit the source once. Claude Code discovers those sources directly. OpenSpec routes to them through `openspec/config.yaml`. No external design plugin is required.

Start UI work at `docs/ui/style-guide.md`, then read the relevant component intent and icon guidance it links. Record implementation-conformance findings in the owning change, using the guide's criteria and distinguishing source inspection from executed browser checks.

Run `node --test scripts/ui-guidance.test.mjs` after changing the guide or routing. Use the root procedure's read-only `herald-reviewer` subagent before opening the change's pull request; give it the diff and change name, and resolve/report its findings.
