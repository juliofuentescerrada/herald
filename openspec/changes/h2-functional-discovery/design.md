## Context

The existing baseline is large and has one product decision register. H2 was previously a short scope/journey summary. The maintainer asked for a documentation PR in the same functional style after agreeing participant/admin separation, no guest coincidence checks and bounded automation.

## Goals / Non-Goals

**Goals:** a complete reviewable H2 extension, traceable decisions, concrete exceptions/acceptance and coherent links from maintained sources.

**Non-Goals:** implementing H2, approving every default, selecting provider/scheduler designs, changing accepted ADRs, changing implemented specifications or delivering screens.

## Decisions

1. Keep shared rules and §15 decision status in the existing baseline; place detailed H2 rules in a linked extension. An independent decision register would drift; appending the entire discovery to the already large baseline would make section-level review harder. Update the documentation source map and agent context accordingly.
2. Record explicitly confirmed direction separately from author-defined defaults. The maintainer delegated the definition, but did not individually approve seven-day invitations, reminder timing, linkage verification mechanics or each sporting detail. D-30–38 preserve that distinction.
3. Preserve H1 implementation and historical manual-window decisions. H2 owns the operative dates and automatic cancellation delta; do not rewrite archived/implemented specifications.
4. Keep new runtime boundary designs as gates: Tournaments owns scheduling/lifecycle/minimum, Registration owns authoritative admissions/rosters, Competition owns results and round completion, and Notifications consumes facts. Deadline evaluation needs an authoritative cut-off/revision barrier, not a projected field count. No module or event contract changes are made in this PR.
5. Link future notices to ADR 0017 without pretending they are already recorded/published. Existing inventory remains evidence of actual slices.

## Screen and visual impact

Mockups are not applicable to this documentation change. No screen is created/modified and no executable UI script is required. Visual direction §9.4 inventories future surfaces/states; the discovery concept is a directional reference only. Future production slices still need reviewed mockups and executable journeys. No request for new mockups is needed to finish this documentation PR.

## Risks / Trade-offs

- Readers may mistake scope for implementation → explicit status in the extension, baseline and roadmap; leave `openspec/specs/` untouched.
- A participant path could accidentally relax accepted administrative identity checks → D-30 and H2-AT-01/23 require separation; ADR 0014 implementation remains unchanged pending a dedicated identity design.
- Deadline/minimum checks race admission or use stale projections → the discovery requires an authoritative cut-off and current revisions, with late-worker and duplicate-job scenarios; select coordination in the implementation change.
- Manual close, roster eligibility and check-in could be mistaken for deadline cancellation → separate transitions and acceptance examples, counting admitted entry units only at the closing deadline.
- Another long document could duplicate shared rules → H2-specific detail here, shared mechanics linked, one status register retained.

## Migration Plan

Documentation only: merge reviewed files; no deployment or data migration. Revert the documentation commit if needed. Future H2 changes consume this target definition after M4 and their explicit decision/visual gates.

## Verification and review

Initial verification passed: staged repository rules (including British English spelling), unchanged implemented-scenario coverage (59/324 covered, 265 existing baseline), strict OpenSpec validation, whitespace checks and all 27 added/changed local Markdown links. Target H2 scenarios are not executed by this change.

The repository-required `herald-reviewer` found two source/status inconsistencies: baseline §16 still forbade a linked H2 extension and called itself v0.7; D-10 still marked the no-silence clause Proposed. Resolved by updating §16 and ADR 0001's Proposed source map for the linked extension, and making D-10 partial with D-36/37 references. No other findings in identity separation, guest policy, automation, notices, reporting/history permissions or implementation-status claims. The independent recheck reported no remaining findings; final rules, coverage, strict OpenSpec, local-link and whitespace checks passed.

No application tests were run: no runtime code, endpoint or UI changed. Local tooling was installed outside the checkout; there are no dependency/lockfile changes. The harness metrics command has no instrumented guard sessions in this Codex environment; its zero table does not measure actual effort.

## Open Questions

The extension §13 lists per-slice gates, including participant/provider integration, claim evidence, authoritative deadline coordination, roster/team scope, independent referees, protected history and visual review. They do not block documenting the agreed functional direction.
