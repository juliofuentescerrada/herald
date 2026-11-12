# 0001. Record architecture decisions, and plan changes with OpenSpec

- Status: Proposed
- Date: 2026-11-06
- Consolidated: 2026-11-07
- Revised: 2026-11-12 (agent conventions split by when they apply)

## Context

Herald exists to show how a system is designed, not only that it works. A reader (a reviewer, an interviewer, the maintainer a year from now) needs to see why each piece is the way it is, and what else was on the table. Decisions taken in conversation are lost, and a design document edited in place loses its alternatives.

## Decision

Record every significant decision as an ADR in `docs/adr/`, using `0000-template.md`. "Significant" means hard to reverse, or something a reasonable person could have done differently. Proposed records can be refined in place. Normally, changing an accepted decision creates a superseding ADR. For the pre-development consolidation on 7 November 2026, the maintainer explicitly authorised rewriting existing ADRs and documents; record that consolidation date and preserve the distinction between confirmed decisions and new proposals. This exception does not imply production implementation or blanket approval of unresolved rules.

Plan every change with OpenSpec (`openspec/`, schema `spec-driven`): a proposal, its specification deltas, a design and the tasks, reviewed before any code is written. Accepted specifications live in `openspec/specs/` and describe what the system does today.

Keep one maintained source for each responsibility:

| Source | Responsibility |
| --- | --- |
| `README.md` | Entry point, current implementation status and reading order |
| `docs/herald-functional-discovery.md` | Product vocabulary, rules, journeys, decision ledger and acceptance examples |
| `docs/roadmap.md` | Delivery sequence and current change status |
| `docs/adr/` | Technical decisions, rationale and follow-ups |
| `docs/herald-visual-direction.md` | Visual contracts, canonical mockup references and screen/state coverage |
| `docs/herald-domain-overview.pptx` | Versioned explanatory companion; not an independent specification |
| `docs/assets/mockups/`, `prototypes/frontend/` | Labelled conceptual or deterministic review artefacts; no production functionality |
| `openspec/specs/` | Implemented and archived requirements, not every proposed target |
| `openspec/changes/<change>/` | Proposed deltas, design notes, review evidence and tasks |
| `CLAUDE.md` and the folder `CLAUDE.md` files, `.claude/skills/herald-*`, `openspec/config.yaml` | Contributor/agent conventions, each rule in one of them: always-applicable rules in the root `CLAUDE.md`, folder rules in the folder's `CLAUDE.md`, procedures in skills, per-artifact proposal rules in `openspec/config.yaml` |

Confirmed product clauses and accepted ADR decisions take precedence over proposals. The functional decision ledger identifies which product defaults remain proposed. A concept image cannot override those rules, and a target ADR cannot imply that its code already exists. Archived changes and dated reviews describe their historical snapshot; link them to the current baseline rather than treating them as live instructions.

Documentation-only consolidation may be completed under the maintainer's direct instruction. It does not authorise production feature implementation. Missing product choices are recorded with a concrete proposed rule, scenario, owner and decision gate instead of being silently accepted or left as an unowned question.

## Alternatives considered

- **A single architecture document:** easier to read at once, but decisions get edited in place and their alternatives disappear.
- **Issues or pull request descriptions only:** they hold the discussion, but are hard to find later and don't travel with the code.
- **A larger documentation set** (concept pages, a journal, diagrams per topic): valuable for teaching, too much upkeep for a reference project of this size.

## Consequences

- Positive: decisions are reviewed in pull requests and have history; the specs say what the system does, the ADRs why.
- Negative: the current design has to be read across several ADRs; if that hurts, `docs/architecture.md` is added.
- Follow-ups: none.
