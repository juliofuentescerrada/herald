## Context

H3 is currently a short milestone definition. The maintainer asked to preserve the H2 discovery's English Markdown style and prepare a new change from the H3 exploration. The shared baseline already owns a single decision register; H2 demonstrates the linked-extension pattern.

## Goals / Non-Goals

**Goals:** a complete reviewable H3 extension with actors, bounded rules, examples, exceptions, journeys, target acceptance and explicit gates; consistent links and proposed decision status across maintained sources.

**Non-Goals:** implementing H3, approving proposed sporting defaults, expanding accepted scope, changing H1/H2 implementation history, selecting an algorithm implementation or coordination architecture, delivering UI, or updating implemented specifications.

## Decisions

1. Follow the H2 extension's title/version/status, numbered sections, H3-prefixed rule identifiers, authority table, journeys, target acceptance and final handoff. Keep shared vocabulary and existing lifecycle contracts in the baseline rather than copying them. Appending the full exploration to the large baseline would make review harder; a separate decision ledger would drift.
2. Add D-39–47 to the shared register as Proposed only. The request authorises documentation, not acceptance of seeding distribution, fixing/publication, empty-branch treatment or tied single-match positions. Link summaries to the authoritative register rather than restating status in another ledger.
3. Keep uncertain result refinements conditional. Decisive outcome-only and aggregate Bo3 develop existing H3 scope; direct score and detailed games need the separate approval/use-case gates. Preserve the original result-profile proposal's status.
4. Separate visible future bracket structure from published dependent pairings. This makes the proposed safe-correction boundary reviewable without making all corrections impossible merely by showing the tree. Exceptional no-qualifier progression and its unresolved placing policy are explicit blocking gates, not implied acceptance of the league's 0/0 treatment.
5. Refine the existing Proposed ADR 0001 source map and contributor context for the new linked extension. No accepted ADR or new architecture decision changes. No module boundary or integration contract changes in this documentation work. Future designs must identify the owners and authoritative revisions of field, results and dependent publication; this change fixes no storage, broker or projection mechanism.
6. Inventory future notices under ADR 0017 without adding them to its recorded/published runtime inventory. Inventoried facts become contracts only when a later slice actually introduces them.

## Screen and visual impact

Mockups are not applicable to this documentation change: no screen is created or modified. Visual direction §9.5 owns the future screen/state inventory, linked from H3 §12. Later H3 slices require reviewed visual evidence and executable journeys; no new screenshot, prototype or UI script is needed to review this documentation change.

## Risks / Trade-offs

- Scope mistaken for acceptance or implementation → proposed D-39–47, explicit inherited statuses and target-test language; no changes to `openspec/specs/`.
- A league result policy applied mechanically to elimination → explicit no-qualifier, administrative advance and exceptional-closure decision gate, including affected positions.
- Visible bracket mistaken for publication → separate source/derived entrant/published status and a correction/publication race scenario.
- Rich result support mistaken for complete game rules → bounded decisive Bo3, conditional detail/direct score and no claims about Swiss or timed/drawn games.
- Extra documentation duplicates authority → one register, one visual inventory and linked milestone extension following ADR 0001.

## Migration Plan

Documentation only; no deployment, data migration or endpoint regeneration. Revert the documentation commit if needed. Leave the change active for review, following the existing H2 documentation change; future product slices own implementation and test coverage.

## Verification and review

Verification passed: changed-file repository rules including British English spelling, unchanged implemented-specification coverage (91/356 covered; 265 existing baseline), strict OpenSpec validation, 29 added/changed local Markdown links and anchors, staged secret scanning and whitespace checks. Repository script tests passed with 74 passing and one existing skip after selecting the installed secret scanner through its supported tools-directory setting.

The complete `scripts/check rules` run could not finish its licence inventory: this documentation-only session lacks .NET and the application dependency installations. The first script-test run also used an unwritable default scanner installation path; selecting a tools directory with write access resolved it. No dependency, lockfile or check configuration was changed. Application tests were not run; no runtime code, endpoint or UI changed. H3 scenarios remain target acceptance, not executed product tests.

The repository-required independent reviewer found one minor ambiguity: the unconditional winner-to-successor rule would require a destination for the final. Resolved in H3-AV-01, the Bo3 wording/acceptance, D-41 and the shared elimination summary: only non-final winners feed a declared successor; the final enables review. No blocking or should-fix findings were reported; the independent recheck found no remaining findings. Harness metrics have no instrumented guard sessions in this Codex environment; the generated zero table does not measure actual effort.

## Open Questions

H3 §13 names the proposed policy gates, including exceptional positions and the supported field maximum. These do not prevent preparing the documentation change; they prevent declaring its later product slices ready for implementation.
