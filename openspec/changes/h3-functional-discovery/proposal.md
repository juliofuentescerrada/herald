## Why

H3 has a milestone summary but no detailed functional discovery. The maintainer requested a new change that brings the H3 exploration into the repository in the same English Markdown format as the H2 discovery.

## What Changes

- Add the detailed H3 extension: elimination and single match, seeding/byes, advancement, result profiles, incidents, corrections, journeys, target acceptance and implementation gates.
- Link proposed H3 policies from the baseline's single decision register, keeping inherited confirmed clauses and unresolved defaults distinguishable.
- Align the roadmap link, orientation, documentation source map, contributor context and future screen/state inventory.
- Preserve the delivery sequence, implemented specifications and the separate proposed status of optional result-profile refinements.

Decision dependencies: D-04 is confirmed for the H1 league, not a decision about elimination; D-02/05/09/18/27 and D-36 are partial; D-07/15/23/24/25 and the detailed H2 policies D-34/37/38 remain proposed as recorded. New D-39–47 are proposed H3 defaults for maintainer review, not confirmed by the request to prepare this change. Pending choices are documentation gates, not authorisation to implement them.

## Capabilities

### New Capabilities

- `h3-discovery-documentation`: maintain a traceable H3 functional definition and delivery handoff.

### Modified Capabilities

None. No implemented product requirement in `openspec/specs/` changes.

## Impact

Documentation only. No production code, endpoints, dependencies, module boundaries or runtime contracts change. Mockups are not applicable: no screen is created or modified. Future H3 surfaces/states are inventoried for later reviewed slices. No runtime notifiable facts are introduced; target notices remain future work under ADR 0017. No new architecture decision is needed; ADR 0001's Proposed source map is refined without changing its status.
