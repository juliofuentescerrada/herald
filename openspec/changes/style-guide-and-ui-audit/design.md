## Context

Baseline: `main` at `b017628cc643b3f68b017e6e37aefb0a13f1bedc`, inspected on 14 November 2026. The existing visual direction owns foundations/compositions/state coverage; the Angular catalogue demonstrates exported controls and states. Refactoring UI was referenced in prose without an included skill. The user requested complete guidance, harness configuration, icon usage and an existing-screen review, prepared in a new branch.

## Goals / Non-Goals

**Goals:** give mockup and implementation agents the same criteria; document all current public controls and icon meanings; apply the supplied organiser/participant perspectives with distinct H2 public/participant UX patterns; audit the existing implementation with evidence and prioritised follow-up.

**Non-Goals:** changing production screens, inventing product rules, settling proposed brand/density/public decisions, reproducing paid Refactoring UI content, or adding Impeccable.

## Decisions

### D-1 Extend the existing visual authority

`docs/herald-visual-direction.md` retains numeric foundations, page compositions and screen coverage. `docs/ui/style-guide.md` owns the workflow, stable G- criteria, worked compositions and review format; `components.md` owns intent/API guidance; `icons.md` owns the live meaning/placement table. Cross-links avoid a second competing foundation document. The small documentation-ownership extension follows ADR 0001 and does not require a new architectural boundary.

`docs/ui/experience-patterns.md` owns audience-specific task hierarchy, navigation and disclosure, with a source-to-scope mapping from the maintainer's supplied `user-experience-perspectives.md` v1.0. Its H2 portal/participant patterns are design targets, not new implemented routes. Functional statuses remain in D-30–38; calendar export, cloning, public career statistics, CRM and unsupported automation are not approved by this mapping.

### D-2 Include an original local practice skill

`.claude/skills/refactoring-ui/SKILL.md` contains original operational guidance and references the official Refactoring UI site/public articles. It is explicitly not an official upstream package or copied paid content. This makes fresh/offline sessions usable without a marketplace dependency. Public principles inform judgement; Herald's square geometry, spacing, composition and icon constraints win.

### D-3 Route the harness to one source

Claude Code discovers canonical skills under `.claude/skills/`; `AGENTS.md` routes Codex and `.agents/skills/` links resolve to the same definitions. `CLAUDE.md`, `web/CLAUDE.md`, the two existing Herald skills and OpenSpec context/rules point to the guide. No plugin settings or runtime dependencies change. Inventory/routing checks run in the existing Node harness suite.

### D-4 Audit the baseline without silently implementing fixes

The [existing-screen review](reviews/existing-screens.md) inventories actual routes and surfaces, uses G-/RU- criteria and records the limits of source and browser evidence. Production corrections remain open, prioritised follow-up; this documentation proposal grants no production-edit approval. Mockups are not applicable because no screen is created/modified. Existing visual references are linked from the review; superseding current layout rules remain authoritative.

### D-5 Check documentation against the code inventory

`scripts/ui-guidance.test.mjs` compares public exports/types and registered icon names/sizes with the documentation and verifies canonical discovery/routing. It checks required review structure too. It does not claim to test the quality of design judgement or prove runtime accessibility. No domain, endpoint, module, event or integration contract changes; no code generation is needed.

Component and icon inventories record what has been needed to date, not a closed set of permitted choices. The maintainer clarified that new components/icons are welcome when they add value or express an intent/meaning the current set does not cover well. The usage guides state this explicitly; the shared foundations, responsibility boundaries and documentation/state checks still apply to additions.

### D-6 Shared foundations do not impose the same UX

The organiser's operational safety-net model, participant's competition companion and visitor's anonymous event assessment use the same primitives with distinct content order/navigation. The H2 patterns cover both public and authenticated/represented contexts and their recovery states; agents must identify the relevant XP patterns in the handoff. The source's examples inform UX goals, not new roles, unsupported identity claims, feature promises or timing guarantees. Review remains under the existing screen/mockup process when actual H2 slices are proposed.

## Risks / Trade-offs

- [A comprehensive document becomes another source of conflicting values] → keep foundation values in the visual direction and refer to implemented tokens; guidance documents own usage, not a second palette.
- [A reference to Refactoring UI is mistaken for an installed official skill] → identify provenance and include an original local skill with no download requirement.
- [Source review is mistaken for visual acceptance] → method/status per surface, exact browser scope and unverified composed admin states in the review.
- [Examples copy known baseline defects] → document limitations/findings explicitly; do not present catalogue anti-patterns as recommended use.
- [New Codex entry-point paths trigger conservative CI classification] → retain the existing classifier; this branch can trigger full code jobs even though no runtime files change.

## Migration Plan

Read the new entry point, follow its links and run the harness checks. No deployment or data migration. The change remains active while the maintainer reviews the proposal and remediation priorities; do not sync target deltas to implemented specifications or archive it before acceptance. After acceptance, archive the documentation/harness capability with its scenario markers and update the live guide's link to the moved review; the harness follows that link rather than retaining an active-change path. Production corrections can be proposed as separately scoped UI changes with their visual references.

## Open Questions

No input blocks documentation delivery. Remediation priorities and catalogue examples remain review items; they do not authorise a change to accepted behaviour. The general history wording is clarified to preserve the already implemented read-only roster inspection and no-toast roster update contracts, without a new product decision.

## Validation and review

Executed checks, browser measurements and remaining limits are recorded in [the review](reviews/existing-screens.md). Final harness validation and independent review results are appended here before handoff.

- UI baseline unit suites: `ui` 35, catalogue 7, admin 203 and public 13 tests passed (258 total). These use the project's Angular/Vitest configuration and do not replace composed browser journeys.
- Final Node harness suite: 80 passed, zero failed, one pre-existing bootstrap test skipped by its environment condition; six new inventory/routing/review checks passed, including unsupported export forms and H2 audience guidance. The initial sandbox run could not spawn Git for temporary repositories; the suite passed outside that restriction.
- Changed-file repository checks passed (terms, private data and British spelling); no dependency/lockfile changed. Full .NET/package-licence checks were not run because the SDK is absent.
- OpenSpec validation and local Markdown link/whitespace checks passed. The proposal remains unapproved for production edits.

### Independent review

The read-only `herald-reviewer` reviewed the complete baseline diff and incremental UX scope against the supplied source, OpenSpec deltas, relevant ADRs, folder rules, D-30–38, public component/icon APIs, route inventory and audit evidence. Final result: no outstanding findings. The reviewer executed no tests or mutations.

| Finding | Resolution |
| --- | --- |
| Unsupported public export syntax could bypass the inventory check | Reject unknown export forms and aliases explicitly; regression cases cover star, direct and aliased exports |
| The audit treated the specifically required created notice as an unconditional defect | Preserve the current flow, record the specific/general contract tension and separate it from catalogue-only feedback gaps |
| A fixed active-change audit path would fail on archive | Follow the live guide's review link; migration updates that incoming link when the review moves |
| StatusLabel cited unrelated audit finding A-08 | Remove the incorrect reference and state the actual single-line limitation accurately |

The expanded experience patterns and routing were also reviewed; H2 remains target guidance, and exploratory source features do not gain implementation approval.
