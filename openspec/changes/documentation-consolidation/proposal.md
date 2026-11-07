## Why

The functional/visual and technical reviews found contradictory delivery scope, incomplete H1 edge cases and architectural rules spread across different document versions. The project has only begun M0. The maintainer authorised consolidating and, where useful, rewriting existing documents and ADRs before functionality is developed.

## What Changes

- Establish functional baseline v0.7 with one decision ledger, explicit lifecycle/outcome tables, acceptance examples and visual handoff requirements.
- Align the README, roadmap, ADRs, contributor instructions and presentation with H1 individual/direct-team leagues, identity and web/API delivery.
- Clarify backend vertical slices, frontend features, dependency rules, operation ownership, durable history and current-versus-target implementation status.
- Prepare `m0-web-shell` as a draft and align only the high-level architecture part of `m0-messaging`; keep its unresolved messaging investigation with that change.
- Correct visual references and prototype defects; add deterministic H1 state/journey mockups and a navigable static prototype under the maintainer's follow-up instruction.
- Preserve the two reviews and their original manifests as historical evidence, with a finding-to-source closure map.

## Capabilities

### New Capabilities

- `documentation-baseline`: consistent source responsibilities, status labels and traceable visual/functional/architecture references.

### Modified Capabilities

None. Implemented product specifications remain unchanged. The proposed backend and frontend requirements belong to their own M0 changes.

## Impact

Documentation, PPT and review-only HTML/CSS/JavaScript artefacts. No production feature code, database migration, new production dependency, deployment or messaging resolution. Existing original-checkout edits were copied into the isolated review worktree before consolidation; provenance is in `source-baseline.json`.

The consolidated baseline is ready to support further decisions. It does not approve the remaining Proposed defaults or make H1 ready for implementation without each slice's review gate.
