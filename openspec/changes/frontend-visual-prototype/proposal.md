## Why

The existing individual-league concept does not let reviewers follow the full H1 operator/team journey or inspect important recovery states. The maintainer requested additional main-journey mockups and a static prototype after the documentation reviews and consolidation.

## What Changes

- Retain and correct the local individual league demo, including explicit new-result selection, contrast, focus and spacing.
- Add deterministic exception-state views and navigable H1 journey snapshots for organisation context, individual/direct-team setup, admission/readiness, roster/lineup, results/corrections, finalisation and public following.
- Provide desktop/mobile captures and documented Refactoring UI checks, with links to functional baseline v0.7 and explicit proposed-policy labels.
- Document how to open the local prototype and which journeys/states it covers.

## Capabilities

### New Capabilities

- `static-journey-preview`: review-only navigable flows and states with sample data, separated from production functionality.

### Modified Capabilities

None. This change does not modify the implemented backend specifications or create the production Angular frontend.

## Impact

Only `prototypes/frontend/`, visual documentation and mockup/evidence assets. No backend, real identity, network data, persistence, component-library selection or messaging behaviour. H2 participant/discovery concepts remain labelled as later scope. The prototype supports discussion; it does not accept the policy decisions it illustrates.
