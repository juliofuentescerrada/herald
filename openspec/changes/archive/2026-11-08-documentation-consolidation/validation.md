# Consolidation validation

7 November 2026. These checks validate the documentation and review artefacts, not production functionality or unresolved product decisions.

## Documentation and specifications

- `openspec validate --all --strict`: **7 passed, 0 failed** (the three accepted skeleton specifications and the four formal changes: messaging, web shell, visual prototype and consolidation).
- `git diff --check`: passed.
- Maintained Markdown references checked for missing local files, including line-qualified historical source links: no broken file targets. Counts, commands and original-source comparison are recorded in [documentation validation evidence](evidence/documentation-validation.json).
- Independent consistency review covered functional discovery, README, roadmap, ADRs, contributor guidance, backend boundary delta and frontend draft. Corrected three findings: confirmed public-alias policy must not be reopened; domain purity must not be just a library blacklist; app-local shared presentation must exclude all feature imports, not only stores.
- Searches found no live v0.4/v0.6 baseline, “nothing is built”, all-reuse-in-Domain rule, command-ID-only response rule or obsolete ADR 0004 filename. Historical review manifests and archived changes retain their original snapshot content.

The two design-only reviews were moved under `documentation-consolidation/reviews/`, preserving evidence and input manifests. They no longer appear as incomplete OpenSpec implementation proposals. The visual prototype has an explicit documentation-only proposal, requirements and tasks; `m0-web-shell` remains a draft with all implementation tasks unchecked.

## Presentation

`docs/herald-domain-overview.pptx` contains 12 editable slides, baseline v0.7. Final SHA-256: `dd34b8ac8abb91113a95f3c4df8cc100fbb53bc1023ebcf42efc3db975a3b4e5`.

- Package integrity, layout/font policy and first-party re-import checks passed; [machine-readable validation](evidence/presentation-validation.json) records their exact scope.
- LibreOffice rendered all slides; individual-slide inspection and an independent contact-sheet pass checked legibility, content boundaries and H1/proposed-state hierarchy. Native Microsoft PowerPoint execution was not performed.
- Evidence: [slides 1–4](evidence/ppt-contact-1.jpg), [slides 5–8](evidence/ppt-contact-2.jpg), [slides 9–12](evidence/ppt-contact-3.jpg).
- Speaker notes point to current relative source paths. The original-checkout PPT retains SHA-256 `4c4d9b6fec0ad63a6d3655064588235212fed3211e12a7d07796c49c10534824`.

## Prototype and mockups

The [visual prototype design](../2026-11-08-frontend-visual-prototype/design.md) records completed checks and their scope. The [local usage guide](../../../../prototypes/frontend/README.md) distinguishes the in-memory individual demo from static journey snapshots and exception fixtures. The [gallery of 21 captures](../../../../docs/assets/mockups/journeys/README.md) includes desktop/mobile, grayscale and blur evidence.

- Chrome/Playwright rendered 68 compositions at exact 1600×1100 and 390×844 viewports with no JavaScript errors or page/table horizontal overflow. This supersedes the earlier CLI measurements taken before viewport resize.
- 12 browser interaction checks and 11 result-state/correction checks passed; all three scripts passed syntax checks and all 28 static HTML references resolved.
- Independent visual inspection covered team readiness, entry cards, empty result selection, stale finalisation, private denial, individual configuration and public following, including grayscale/blur hierarchy. The second pass corrected the combined publication/start label and changed modal captures to viewport-only; affected captures were refreshed.
- The eight-row Refactoring UI diagnostic is 10/10 for the inspected sample only, with no corrective row remaining in that sample. It is not a product-wide accessibility score. Remaining visual states and production accessibility/authority/concurrency tests remain listed in the guide and prototype design.

Full assertions and source/capture hashes are retained beside the gallery. No broader production behaviour is inferred from static navigation or sample data.

## Original checkout and implementation limits

The original checkout remains at `08c3308dcf775bc03add59a768303d7d07cd1bc0`. SHA-256 comparison found no changes to any of the 35 distinct original files recorded across [source-baseline.json](source-baseline.json) and the two review manifests, including all 11 copied inputs.

No files under production `src/` or `tests/` changed. No production dependencies, database migrations or messaging spike were added/run. Consequently the .NET build and integration suite were not rerun for this documentation/prototype change. Backend/frontend boundary scenarios are proposed implementation checks, not newly passing production tests. Pending product decisions and future shell implementation remain explicit in the decision ledger and roadmap.
