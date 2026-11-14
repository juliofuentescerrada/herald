---
name: refactoring-ui
description: Apply Refactoring UI practices when designing, prototyping, implementing or reviewing Herald screens and shared controls. Use with herald-screens for every UI proposal and implementation review; Herald's confirmed foundations and product rules take precedence.
---

# Refactoring UI practices for Herald

This is an original, repository-maintained practice checklist informed by [Refactoring UI](https://www.refactoringui.com/) and its [public articles](https://www.refactoringui.com/articles). It is not an official upstream skill, a copy of the book or a bundled paid resource. The principles guide judgement; they do not replace Herald's design decisions.

## Load the local contracts

Read the relevant sections of [Herald's style guide](../../../docs/ui/style-guide.md), [component intent](../../../docs/ui/components.md), [icons](../../../docs/ui/icons.md) and [visual direction](../../../docs/herald-visual-direction.md). Preserve square geometry, the declared spacing scale, the single breakpoint, full-width stacked admin composition and the reviewed icon treatment. Use `herald-screens` for visual-input/evidence rules. Product decisions remain in the discovery register; no visual heuristic can settle one.

## Apply the practices

| ID | Practice | Concrete Herald review |
| --- | --- | --- |
| RU-01 | Start with the useful feature and its content | Write the person's task, context and next action; design an entry decision before decorating the shell |
| RU-02 | Establish a clear hierarchy | Title/context first, actionable records next, lower-weight history after; separate lifecycle dimensions |
| RU-03 | Reduce competing emphasis | Use weight, grouping and secondary text before increasing size or adding accent; one primary per operation area |
| RU-04 | Make spacing communicate relationships | Use the shared scale; label/help/error close to their field, larger separation between operations |
| RU-05 | Design text for reading and comparison | Use role-based type, readable line length, wrapping names and tabular numerals for comparable data |
| RU-06 | Use colour as a semantic reinforcement | Distinct feedback meanings, explicit labels, surface-specific focus/control mappings and checked contrast |
| RU-07 | Separate surfaces with restraint | Canvas/surface contrast and borders first; shadows for overlays; never introduce rounded/pill geometry |
| RU-08 | Design real content and narrow layouts early | Long names, several statuses, counts, zoom and empty/error states; stack content before shrinking text |
| RU-09 | Give state changes an appropriate home | Field/row/surface errors stay local, blockers persist and completed personal outcomes may toast |
| RU-10 | Make icons deliberate | Reuse the meaning table, consistent size/stroke and label gap; keep ordinary admin actions text only |

For a mockup, annotate how the composition addresses the relevant rows. For implementation, inspect the actual control API and rendered state, not just a similar screenshot. Never claim WCAG compliance from a palette calculation or static inspection.

## Review output

Use the [style guide's handoff](../../../docs/ui/style-guide.md#review-and-handoff). Each finding names a G-/RU- criterion, file/line or visual evidence, a concrete trigger, expected/observed result, severity, proposed correction and verification status. Report gaps in existing screens without silently changing production code. An accepted exception is recorded in its owning change and linked from the live contract where relevant.

No plugin installation or external account is needed to load this skill. Do not add Impeccable as a dependency of this workflow.
