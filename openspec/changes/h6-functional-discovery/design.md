## Context

Main base `4d7074c` contains H2–H5 discoveries and D-01–65; H5 PR #58 is merged. Current implemented specifications cover foundations/early H1, not advanced team encounters or game submissions. H1 remains incomplete and PR #55 is proposals only; M4/H2–H5 completion is not established. H2/H3 provide language/structure/depth references; H4/H5 supply inherited connected, stage and delivery boundaries.

Relevant ADRs: 0001 (Proposed, maintained sources), 0002 (game-agnostic foundation, scope superseded by 0013), 0003 (English), 0004 (Proposed with implemented module boundaries), 0007/0008 (Proposed, durable business evidence and outbox/inbox), 0010 (executable specifications), 0011 (rendering/generated API), accepted 0013/0014/0018 (scope, current identity, delivery), proposed 0016/0017 (implemented local revisioned state transport versus target notification ownership). Preserve all statuses; only ADR 0001's source map gains H6 following H2/H3. The notifiable-fact inventory is unchanged.

## Goals / Non-Goals

**Goals:** concrete reviewable H6 recommendations, exact composite arithmetic and participation boundaries, protected submission lifecycle, complete individual/direct/composite journeys and owned decision gates with maintained-source links.

**Non-Goals:** accept policy, implement runtime/screens, deliver official sporting rules/legality, choose private storage/authentication, claim prerequisites complete or target scenarios executed, create approved batches or change implemented specifications/events.

## Decisions

1. Keep H6 detail in its extension, statuses in baseline §15 D-66–74 (next available), delivery sequence in roadmap and future surfaces/states in visual direction. The OpenSpec delta describes this documentary deliverable, not runtime H6 requirements; moving target behaviour to implemented specs would falsely claim delivery.
2. Develop bounded three-board league and separately versioned ordered direct-team series candidates. Equal exact half-units, all-board completion and parent-only standings are independently reviewable. Weighted boards, stop-on-clinch, arbitrary decisive profiles and child-board substitution need further scope/fixtures; silently supporting them would hide unresolved winners and participation semantics.
3. Separate substitution from roster amendment and both from correction. A substitution uses an eligible frozen reserve at an explicit future game boundary. An announced exceptional amendment changes future roster eligibility at a round/stage barrier, preserving history and invalidating unstarted locks. A result/participation correction exposes downstream impact and retains predecessor evidence; none is a retrospective eligibility cure. Earlier fixed-roster/lineup profiles remain unchanged.
4. Separate human eligibility and game configuration. A submission's receipt/lock/inspection or optional reveal cannot approve a player, create an appearance or certify official legality. Prefer inert plain text and named scope/version/deadline over files/catalogues for the first candidate, with explicit authority and privacy/retention gates before real capture. Default-private data cannot flow into public hints/logs or general read-state grants.
5. Preserve responsibilities: Registration roster/amendment eligibility, Competition assignments/game participation/substitutions/child and parent results, Standings derived team rankings, Tournaments fixed plan/deadlines/lifecycle and Notifications target notices. Private submission ownership needs a later technical design. No module/schema/contract change here. Future designs must demonstrate authoritative all-or-nothing start/approval/eligibility boundaries and highest-revision reconciliation, respecting ADR 0004 rather than cross-schema joins or feature-to-feature calls. Public consumers negotiate new capabilities and grants; existing H4 assignments cannot silently execute unsupported boards.
6. No current screen or UI state changes; mockups, executable UI scripts and screenshot comparisons are not applicable. H6 §12 links the canonical future inventory, including denied/stale/uncertain-save, mobile and accessibility. Future proposals still need visual input/review under `herald-screens` and ADR 0018; discovery completeness does not establish implementation readiness.

## Risks / Trade-offs

- Concrete rules look approved → explicit proposal status and owner/gate references; existing exclusions and partial decisions retained.
- Parent outcome double-counts child effects or stale updates → current child→parent→standings revisions, exact fixtures and authoritative dependent-publication barriers.
- Amendments become invisible transfers or retrospective cures → announced future-only exceptions, opposing-roster-history check, independent review and immutable historical versions.
- Private text leaks through broad administration or delivery → separate scoped inspection, inert rendering, minimal proof versus text retention and explicit release/consent/security gates.
- Bounded profiles leave further sporting needs unsupported → explicit compatibility errors and separately accepted decisive/weighted fixtures instead of invented fallback winners.

## Migration Plan

Documentation only: no deployment/data migration or Wolverine/OpenAPI generation. Revert these commits to undo the documentation. Keep this OpenSpec change active for review; no target H6 behaviour is archived into implemented specs. Future approved slices own runtime deltas, executable tests and real acceptance evidence.

## Verification and independent review

Affected/staged repository rules passed (British spelling, terminology and private data), with initial spelling findings corrected without exceptions. `openspec validate h6-functional-discovery --strict` passed with OpenSpec 1.6.0. All 170 local Markdown file/anchor links in changed Markdown files resolve. Whitespace and pinned Gitleaks staged scans passed. Specification coverage is unchanged: 91/356 covered and existing baseline 265. Register formatting keeps D-01–74 in one continuous table; earlier blank separators were removed without changing existing decisions.

`HERALD_TOOLS=<temporary-tool-directory> node --test scripts/*.test.mjs` passed 74/75 tests; the existing opt-in full-bootstrap test was skipped (`HERALD_TEST_BOOTSTRAP` unset). Existing temporary installations of pinned OpenSpec/spelling/Gitleaks were reused. No full application bootstrap/build, dependency/licence re-enumeration or application/UI tests were run because no runtime/dependency manifest changes; no H6 target scenario was executed and no Wolverine/OpenAPI generation was needed. Commit hooks run rules/Gitleaks. Codex has no instrumented Claude guard session; zero harness metrics are not measured effort.

Independent read-only herald-reviewer review of the committed diff is pending before PR readiness.

## Open Questions

Baseline §15 owns statuses and H6 §13 assigns evidence/owners/gates: profile matrix and allocation fairness, aggregation/exceptional closure, substitution allowance, amendment anti-transfer/restoration, submission scope/deadline/review/waivers/owner, private storage/reveal/consent, connected capabilities and concrete scale/retention values. These block their affected implementation/release claims, not this authorised documentary discovery.
