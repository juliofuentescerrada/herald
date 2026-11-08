# H1 journey and state captures

7 November 2026 · functional and visual baseline v0.7. These are browser captures of the [documentation prototypes](../../../../prototypes/frontend/README.md), not production screenshots or accepted policy decisions. Open the [navigable H1 journey](../../../../prototypes/frontend/journeys.html) to inspect the sequence, or the [state review](../../../../prototypes/frontend/review-states.html) to select an exception.

## Individual journey and results

| Surface | Desktop | Mobile |
| --- | --- | --- |
| Organisation context | [Access](journey-individual-access-desktop.png) | — |
| Individual configuration | — | [Setup](journey-individual-setup-mobile.png) |
| Existing individual demo | [Round management](admin-desktop.png) | — |
| New result, no default winner | [Result dialog](new-result-desktop.png) | [Result dialog](new-result-mobile.png) |
| Correct an effective result | [Correction dialog](correction-desktop.png) | — |
| Current final review | [Finalisation](journey-individual-finalise-desktop.png) | — |
| Published following by link | — | [Public aliases and final table](journey-individual-public-mobile.png) |

## Direct team journey

| Surface | Desktop | Mobile |
| --- | --- | --- |
| Roster seven, five locked starters, two unused reserves | [Readiness](journey-team-readiness-desktop.png) | [Readiness](journey-team-readiness-mobile.png) |
| Later running snapshot, explicit match start | — | [Rounds](journey-team-rounds-mobile.png) |
| Four-of-five lineup blocks start | [Blocked readiness](state-team-blocked-desktop.png) | — |

## Exception states and supporting checks

| Surface | Capture |
| --- | --- |
| Admissions and pending check-in | [Mobile entry cards](state-entries-mobile.png) |
| Finalised result requires reopening | [Desktop correction blocker](state-correction-desktop.png) |
| New result revision invalidates final approval | [Desktop stale finalisation](state-finalisation-stale-desktop.png) |
| Unavailable private link reveals no tournament content | [Mobile denial](state-private-denied-mobile.png) |
| H2 discovery direction | [Desktop discovery](discovery-desktop.png) |
| Admin hierarchy diagnostics | [Grayscale](admin-grayscale.png) · [Blur](admin-blur.png) |
| Team hierarchy diagnostics | [Grayscale](journey-team-grayscale.png) · [Blur](journey-team-blur.png) |

## Provenance and limits

The [manifest](manifest.json) records every source URL/query, viewport, filter, source hash and capture hash. The [QA summary](qa-summary.json) records the checks and their limits. Images use device scale 1. Ordinary pages are full-page captures and may exceed the 1100px desktop or 844px mobile viewport; modal captures are viewport-only so the native backdrop represents the visible browser surface. No remote fonts or image services are used.

Blur applies CSS `grayscale(1) blur(4px)` to the live document; grayscale applies CSS `grayscale(1)`. These are hierarchy diagnostics, not contrast measurements. UJ-01–03/06/07 have representative compositions; the API journey remains functional documentation. The complete list of represented and missing states is in [visual guide §9](../../../herald-visual-direction.md). The [prototype design note](../../../../openspec/changes/archive/2026-11-08-frontend-visual-prototype/design.md) records the eight-row Refactoring UI assessment. Older generated PNGs outside this directory keep their explicit canonical/historical status in the guide.
