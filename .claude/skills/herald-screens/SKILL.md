---
name: herald-screens
description: Herald's rules for screens, UI states, layout and mockups. Use whenever a Herald change creates or modifies a screen or a UI state, when proposing or designing such a change (including /opsx:propose), when asking for or reviewing mockups or prototypes, and when comparing an implemented screen against its mockup.
---

# Herald screens

`docs/herald-visual-direction.md` is the source for visual contracts and screen/state coverage (ADR 0001). Read the sections you need, not the whole file: §4 typography, space and geometry; §5 shared component contracts; §7 administration composition (§7.2 layout); §8 public and participant composition; §9 visual references, journeys and state coverage; §10 accessibility.

## When proposing a change

1. Identify every screen to create or modify, and the relevant states of each (empty, loading, error, conflict, permission, the domain states the change introduces).
2. Ask the maintainer explicitly for mockups of each affected screen, including those states. Reuse supplied mockups when they cover the proposed change and record their references in the change's `design.md`.
3. If mockups are missing, keep the proposal pending visual input; do not declare it ready for implementation.
4. For a change without screen impact, state in the proposal that mockups are not applicable.

When asking for new mockups, put the current layout rules in the prompt (visual direction §4, §7.2):

- admin pages full width with no maximum;
- one column with secondary content stacked, no aside;
- one 700 px breakpoint;
- panels and notices fill their container while running text keeps about 75 characters per line;
- status labels beside the title;
- summary actions on the right of their text;
- read-only history after the actionable groups.

## Mockups, prototypes and other visual supports

- Mockups are not regenerated when implementation revises them; the change's `design.md` and the visual direction supersede them.
- `docs/herald-domain-overview.pptx`, `docs/assets/mockups/` and `prototypes/frontend/` are versioned explanatory/visual supports. They do not override functional rules or imply production functionality.
- The older round-management PNG is superseded for semantics; use the corrected outcomes/standings concept and the current deterministic prototypes.
- Apply Refactoring UI, preserving the confirmed square corners and the documented spacing scale.

## When implementing

Screenshots committed to the repository or attached to a pull request come from the E2E environment's synthetic personas (`e2e/`, the test scripts), never from a local Aspire run, which seeds as the maintainer with real identifiers (private-data-guard D-4). Compare the implemented screens with their mockups or prototypes by screenshot, record the differences and their resolution in the change's `design.md`, and keep feedback placement, confirmations and layout as visual direction §4, §5, §7.2 and §8.1 set them.
