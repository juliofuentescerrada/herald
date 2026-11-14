## Why

Herald has visual foundations and a working component/state catalogue, but agents cannot yet find a complete guide to component intent, icon selection or repeatable design review. Refactoring UI is mentioned without a repository-owned skill, and existing screens need an explicit assessment against the same criteria used for new designs.

## What Changes

- Deliver a maintained style-guide entry point for designers and implementation agents, linked to the existing visual foundations, with review criteria and worked composition examples.
- Document the intent, selection, public API, accessibility, states and misuse of every exported UI component and service; distinguish implemented controls from future contracts and app-local patterns.
- Document icon placement, meaning, sizes, accessible use and the process for extending the reviewed registry.
- Include an original Refactoring UI practice skill in the harness and route Claude Code, Codex and OpenSpec to the same documentation. No Impeccable dependency.
- Audit every existing admin/public route, overlays and the catalogue; record evidence, coverage limits and prioritised remediation separately from changes to production screens.

## Capabilities

### New Capabilities

- `interface-guidance`: maintained style, component-intent and icon documentation with a repeatable implementation-conformance review.

### Modified Capabilities

- `agent-harness`: make the local Refactoring UI practice skill and UI guidance discoverable from fresh Claude Code and Codex sessions and from OpenSpec proposals.

## Impact

Documentation and harness only: `docs/`, agent instructions/skills, `openspec/config.yaml`, harness verification and this change. No runtime dependency, API, generated client or module boundary changes. No notifiable facts (ADR 0017).

No product decision-register row changes. This work preserves confirmed visual constraints in visual direction §§4–5 and §7.2 and the confirmed icon choices from `ui-icons`; proposed product rules remain proposed. The guide documents the current token set without approving a new brand, density or public workflow.

No screens are created or modified: mockups are not applicable to this documentation proposal. The existing-screen inventory and evidence are in `reviews/existing-screens.md`; any resulting production fix must follow the normal screen/mockup and implementation-approval process. This proposal is prepared for maintainer review, not approval for production edits.
