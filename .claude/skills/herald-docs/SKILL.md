---
name: herald-docs
description: Herald's rules for maintaining documentation and decisions. Use when writing or revising an ADR, the README, the roadmap, the functional discovery or the visual direction, when recording a product decision, when archiving an OpenSpec change (including /opsx:archive), and when updating status after a change is merged.
---

# Herald documentation

## One maintained source per responsibility (ADR 0001)

| Responsibility | Source |
|---|---|
| Orientation and status | `README.md` |
| Delivery order, milestone status and exit criteria | `docs/roadmap.md` |
| Shared product rules, journeys and the single decision register (§15) | `docs/herald-functional-discovery.md` |
| Detailed H2 participant rules and target acceptance | `docs/herald-h2-functional-discovery.md`, linked from the baseline and its register |
| Architecture decisions | `docs/adr/` |
| Visual contracts and screen/state coverage | `docs/herald-visual-direction.md` |
| A change's design notes, measurements and reviews | the change's `design.md` |
| What is implemented | `openspec/specs/` |

State each fact in its source and link to it elsewhere; do not restate it.

## Decisions and ADRs

- A hard-to-reverse or debatable decision gets an ADR in `docs/adr/` (template `0000-template.md`), added to `docs/adr/README.md`.
- Proposed records may be refined; accepted decisions normally change by supersession. The maintainer explicitly authorised in-place ADR/document revision for the pre-development consolidation of 7 November 2026 (ADR 0001).
- Preserve the distinction between confirmed direction, proposed defaults and implementation. Decision status does not imply implementation status.
- A product decision is recorded in the discovery's decision register (§15) with its date and the change that confirmed it.

## OpenSpec specifications and archives

- `openspec/specs/` describes what is implemented; target deltas remain in active changes until implemented and archived.
- Archived changes and dated reviews are historical evidence, not live architecture instructions.
- When archiving a change, update the roadmap's current-state row for it, the README's status if it changes, and ADR 0017's inventory if the change introduced notifiable facts. Every scenario the change adds to `openspec/specs/` must be marked by a test (`scripts/spec-coverage.mjs`); the baseline of uncovered scenarios never gains a line.
- `openspec/config.yaml` holds the context and per-artifact rules OpenSpec gives the agent; keep it consistent with `CLAUDE.md` and these skills, without restating them.

## Pull requests

Pull requests follow `.github/pull_request_template.md` and link their OpenSpec change.
