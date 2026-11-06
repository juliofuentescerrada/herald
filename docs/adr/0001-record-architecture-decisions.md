# 0001. Record architecture decisions, and plan changes with OpenSpec

- Status: Proposed
- Date: 2026-11-06

## Context

Herald exists to show how a system is designed, not only that it works. A reader (a reviewer, an interviewer, the maintainer a year from now) needs to see why each piece is the way it is, and what else was on the table. Decisions taken in conversation are lost, and a design document edited in place loses its alternatives.

## Decision

Record every significant decision as an ADR in `docs/adr/`, using `0000-template.md`. "Significant" means hard to reverse, or something a reasonable person could have done differently. An accepted ADR isn't rewritten: a changed decision gets a new ADR that supersedes it.

Plan every change with OpenSpec (`openspec/`, schema `spec-driven`): a proposal, its specification deltas, a design and the tasks, reviewed before any code is written. Accepted specifications live in `openspec/specs/` and describe what the system does today.

The rest of the documentation is kept to a minimum: `README.md`, `CLAUDE.md`, `docs/roadmap.md` and these ADRs.

## Alternatives considered

- **A single architecture document:** easier to read at once, but decisions get edited in place and their alternatives disappear.
- **Issues or pull request descriptions only:** they hold the discussion, but are hard to find later and don't travel with the code.
- **A larger documentation set** (concept pages, a journal, diagrams per topic): valuable for teaching, too much upkeep for a reference project of this size.

## Consequences

- Positive: decisions are reviewed in pull requests and have history; the specs say what the system does, the ADRs why.
- Negative: the current design has to be read across several ADRs; if that hurts, `docs/architecture.md` is added.
- Follow-ups: none.
