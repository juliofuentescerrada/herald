## Why

H2 has a milestone summary but lacks a complete participant/representative definition. The maintainer requested a documentation PR capturing the discovery, including open participant accounts without opening administration and deadline-based cancellation with notices.

## What Changes

- Add a detailed H2 discovery with actors, authority, rules, lifecycles, journeys, acceptance scenarios, decision summary and implementation gates.
- Keep the baseline's §15 as the single decision register, linking D-30–38 to the H2 extension; preserve the H1 manual-window and restricted-sign-in implementation history.
- Align roadmap, orientation, documentation source conventions and the future screen/state inventory.
- Record bounded automation and explicitly separate admitted-field checks from check-in/readiness.

Decision status: D-30 and D-35 confirmed by the maintainer on 13 November 2026; D-31 and D-36 partial (confirmed direction plus author-defined safeguards); D-32–34/37/38 author-defined defaults for review. Existing D-09/10/18/21/22/27/29 are linked, not blanket-approved. The maintainer authorised the documentation work and delegated completion of the functional definition; this is not a production implementation proposal.

## Capabilities

### New Capabilities

- `h2-discovery-documentation`: maintain a traceable H2 functional definition and handoff.

### Modified Capabilities

None. No implemented product requirements in `openspec/specs/` change.

## Impact

Documentation only. No production code, endpoints, identity registrations, dependencies or runtime events change. Mockups are not applicable to this documentation change; future H2 screen slices remain subject to visual review. No notifiable facts are introduced at runtime; the discovery inventories target notices for later slices under ADR 0017. ADR 0014 stays accepted for the H1 administrative implementation; H2 identity design must explicitly preserve its restricted boundary and handle any required supersession in its own change.
