## Why

H4's existing scope promises Swiss and a real connected consumer but leaves pairing, statistical and execution-recovery policies unspecified. The maintainer requested a documentation-only discovery that makes those choices concrete and reviewable without approving new policy or implementing them.

## What Changes

- Add `docs/herald-h4-functional-discovery.md`: outcomes, authority, complete candidate Swiss policy/formulae, connected execution, incidents, journeys, observable target acceptance and owned decision gates.
- Keep decision status in baseline §15 (D-48–56), functional detail in the extension, delivery handoff in the roadmap and visual inventory in visual direction.
- Update orientation and source conventions following H2's merged and H3's unmerged documentation precedents. Reserve D-39–47 from H3 PR #56; do not import that branch or claim its approval.
- Record actual implementation prerequisites rather than assuming H1–H3 are complete.

Decision dependencies: D-01/11/12/13/15 are proposed; D-03/05/09/17 and D-38 are partial/proposed as recorded; D-07/24 remain correction/finalisation gates; D-08 ownership and D-16 delivery direction are confirmed within their stated limits. D-30/35 and the bounded set in D-36 retain their H2 status. New D-48–56 are proposed recommendations for review, including formulae, exceptional closure and assignment fencing. None is approved by this documentation request.

## Capabilities

### New Capabilities

- `h4-discovery-documentation`: maintain a traceable H4 functional extension and documentation-only handoff.

### Modified Capabilities

None. Implemented requirements in `openspec/specs/` remain unchanged.

## Impact

Documentation only: no production code, endpoint, dependency manifest, database, identity registration or runtime event changes. Mockups are not applicable: no screen is created or modified. The future H4 inventory remains subject to visual review in later slices. No notifiable facts are introduced at runtime; target notices are documented without changing ADR 0017's recorded/published inventory. No Wolverine/OpenAPI generation, executable UI script or product scenario execution is required by this change.
