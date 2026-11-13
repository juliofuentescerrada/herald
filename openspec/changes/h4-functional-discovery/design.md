## Context

The baseline owns shared rules and the single decision register, while the roadmap owns delivery. H2 establishes the extension pattern. H3's matching discovery exists only in open PR #56 (`878cd8b`); this branch starts at `main` (`132721b`) and reserves D-39–47 without incorporating unmerged content. H1 is incomplete; implemented specifications contain no Swiss or connected tournament execution.

Relevant authority: ADR 0001 (sources/OpenSpec, Proposed), ADR 0003 (English), ADR 0004 (module boundaries), ADR 0007/0008 (durable history, outbox/inbox), ADR 0010 (executable specifications), ADR 0013 (accepted sequence), ADR 0014 (accepted administrative identity), ADR 0016/0017 (revisioned state and target fact/notification boundaries) and accepted ADR 0018 (delivery/review). Their individual statuses are preserved. No accepted ADR is rewritten; ADR 0001's Proposed source map gains the extension as H2 did.

## Goals / Non-Goals

**Goals:** concrete reviewable H4 rules, exceptional/recovery paths, observable acceptance, owned product gates and consistent maintained sources in British English.

**Non-Goals:** implementing or approving Swiss/connected policies, claiming prerequisite completion, selecting a real consumer or authentication configuration, changing implemented specifications/events, creating screens or a batch.

## Decisions

1. Put functional detail in the H4 extension and statuses in baseline §15. Repeating the policy in roadmap/specification would create competing authorities; the OpenSpec delta therefore specifies the documentation deliverable, not runtime Swiss behaviour.
2. Keep this change independent of the unmerged H3 PR, using its public PR/reference revision for language/structure and reserving its identifiers. Stacking would force H3 content into this review; reusing D-39 would collide. Avoid version/number assumptions with a stable explicit H4 visual anchor.
3. Develop a complete deterministic generic candidate algorithm/formula rather than claiming official rules support. Alternatives such as greedy score-group matching, implicit game percentages or display-rounded comparison leave impossible rounds or contradictory standings. Independent fixture and real-consumer agreement remain implementation gates.
4. Develop single-executor fencing, explicit replacement and immutable terminal receipts as proposed functional defaults. One application alone does not prevent two restarted instances acting concurrently. Require an atomic durable consumer work claim shared by its instances: rereading an assignment is not authority to execute twice, and restart reconciles the retained execution/output before rerun. Automatic lease expiry and multiple executors remain separate policies; this PR does not select credentials, persistence tables or endpoints.
5. Preserve module responsibilities: Tournaments owns configuration/visibility/lifecycle, Registration the authoritative field/roster, Competition pairings/results/assignment conditions, Standings current derived rankings and Notifications eventual delivery under its target ADR. This assigns functional responsibilities without adding a module, cross-module reference or integration contract. Future designs must specify authoritative cancellation/field/result barriers, versions, provenance and coordination; projected counts alone cannot authorise dependent transitions. External execution uses documented API capabilities; it introduces no direct subscription to internal events or implicit Service Bus/webhook requirement.
6. Put proposed delivery sequence only in roadmap, and future screen/state inventory only in visual direction. Keep ADR 0017's recorded/published event inventory unchanged: target notices are not implemented facts.

## Screen and visual impact

No screen or UI state is created or modified by this PR; mockups and executable screen scripts are not applicable. Visual direction's stable H4 inventory lists future surfaces, domain states, permission/stale/error/uncertain-save states, mobile and accessibility exploration. H4 discovery §12 links there. No H4 mockup is approved; future screen proposals still follow `herald-screens` and ADR 0018.

## Risks / Trade-offs

- Detailed recommendations may look approved → explicit proposed status, per-decision owner/gate and separate scope/implementation evidence.
- H3 merges while this independent branch is reviewed → recheck source-map/register/context overlap and identifier reservations before handoff; do not incorporate unreviewed policy.
- A generic formula may not fit the actual consumer → D-11/49/51 require independent shared fixtures and identified real consumer before compatibility claims.
- A search bound may be mistaken for mathematical impossibility → distinct exhausted/infeasible states; deterministic limits and scale evidence are D-56 gates.
- Cancellation/withdrawal races can accept stale work → current-condition barriers and fenced attempts are mandatory target acceptance; architecture selection belongs to implementation design.

## Migration Plan

Documentation only; no deployment, data migration or runtime generation. Review and merge the documentation when accepted; revert its commits to undo it. Keep the OpenSpec change active for review: no archive into implemented specifications and no target scenarios presented as executed tests.

## Verification and independent review

Documentation checks passed: repository rules on every changed file/staged content (including British spelling and private-data checks), strict `openspec validate h4-functional-discovery --strict`, implemented-scenario coverage (91/356 covered; existing uncovered baseline unchanged at 265), 28 added/changed local Markdown file/anchor links, `git diff --check` and pinned Gitleaks staged scans. The CI classifier reports documentation only. No application, UI or H4 target scenario was executed, and no Wolverine/OpenAPI regeneration was needed.

Harness tests: `HERALD_TOOLS=<workspace-tool-directory> node --test scripts/*.test.mjs` passed 74/75, with the existing opt-in bootstrap test skipped (`HERALD_TEST_BOOTSTRAP` is unset). The initial run failed two Gitleaks tests because the default installation path was read-only; using the supported `HERALD_TOOLS` path fixed both without repository changes. OpenSpec 1.6.0, the repository-pinned spelling tools and Gitleaks were installed outside tracked files; full application bootstrap, builds and dependency/licence re-enumeration were not run because this change alters no runtime code or dependency manifest. The configured pre-commit hooks run rules and Gitleaks. Harness metrics have no instrumented Codex guard session and report zeros; those are not measured effort.

The repository-required independent `herald-reviewer` reviewed the complete committed `git diff main...HEAD`, the change and cited rules/ADRs. One should-fix finding: a shared current assignment/fence did not prevent two consumer instances independently executing the same attempt. Resolved in H4 §8.1/8.3 and H4-AT-20 by requiring an exclusive atomic durable consumer work claim and reconciliation before rerun, separate from result deduplication. Added concrete complete-matching and alternative-bye graph examples. The independent read-only recheck confirmed the finding resolved with no remaining findings. Final affected rules, strict OpenSpec, link, coverage, whitespace and secret scans passed.

## Open Questions

H4 §13 links product owners and gates to §15. Outstanding choices include the actual consumer/profile, exceptional closure/positions, grant/authentication design, assignment policy approval, retention/purge/rate limits and supported maximum/search budget. They block their future implementation claims, not completion of this authorised discovery.
