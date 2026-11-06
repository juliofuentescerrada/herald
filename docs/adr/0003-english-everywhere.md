# 0003. English everywhere

- Status: Proposed
- Date: 2026-11-06

## Context

Herald is meant to be read by people who don't share the maintainer's first language, and its code, its docs and its UI are read together.

## Decision

Everything in the repository is in English: code, comments, docs, specs, commit messages and UI text. British spelling, the same in code and docs (`Organisation`, `organiser`, `licence`); framework and library names keep their own.

Herald's domain calls the organising entity an **organisation**, never a tenant; "tenant" is kept for Entra ID's own term.

## Alternatives considered

- **Docs in Spanish, code in English:** natural for the maintainer, but it splits the audience and mixes two vocabularies for the same concepts.

## Consequences

- Positive: one ubiquitous language, the same in the code, the specs and the UI.
- Negative: writing in a second language is slower, and conversations about the project may still happen in Spanish.
- Follow-ups: none.
