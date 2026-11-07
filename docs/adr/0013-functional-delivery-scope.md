# 0013. Deliver the functional journeys with identity and direct teams from H1

- Status: Accepted
- Date: 2026-11-06
- Supersedes: 0002 for delivery scope and sequencing; game-agnostic policies remain applicable.

## Context

The functional discovery and engineering roadmap described different first releases. Individual-only v1 and delayed identity could not satisfy H1's direct-team journeys and organisation isolation. The maintainer approved aligning delivery with the functional roadmap.

## Decision

Use H1–H7 in the functional discovery as the product sequence. H1 delivers an operator-run individual/direct-team league through web and API, with sign-in, scoped authority, guests, check-in, fixed team rosters and starting lineups, simple outcomes, safe corrections and public read-by-link. H2 adds the participant portal, representation, discovery and competitor reporting. H3 adds elimination and single match; subsequent milestones follow discovery.

Keep M0 foundations and M4 cloud as technical tracks. Break each product milestone into reviewed OpenSpec slices. Product scope approval does not approve all proposed rule defaults or production implementation. Preserve game-agnostic policies and the exclusion of publisher-owned content.

## Alternatives considered

- Keep individual-only v1 and add teams later: smaller first release, but fails the agreed initial team journeys.
- Keep both roadmaps as independent targets: leaves implementation scope and security timing ambiguous.

## Consequences

- Positive: one delivery sequence and explicit security expectations from the first usable operator release.
- Negative: H1 is larger and needs several bounded implementation slices.
- Follow-ups: specify remaining discovery decisions per slice, including identity, private access and finalisation consistency. H1 needs an accessible environment for a remote pilot; M4 remains subject to ADR 0012.
