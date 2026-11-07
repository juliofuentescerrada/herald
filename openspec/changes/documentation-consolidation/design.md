# Documentation consolidation — baseline v0.7

7 November 2026. **Consolidation and prototype support complete.** Documentation and design artefacts only; no production functionality. Outstanding product decisions remain explicit below.

## Authority and provenance

The maintainer explicitly asked to consolidate both reviews into the existing documentation and allowed ADRs to be rewritten during pre-development. This is the dated exception recorded in [ADR 0001](../../../docs/adr/0001-record-architecture-decisions.md), not a new general rule for silently changing accepted decisions.

Work takes place in the isolated `predevelopment-review/herald` worktree, based on `08c3308dcf775bc03add59a768303d7d07cd1bc0`. The original checkout contained newer, uncommitted functional, visual, roadmap, ADR 0013, messaging-spike and prototype inputs. Those files were copied before editing here. [source-baseline.json](source-baseline.json) records the source checkout, HEAD and hashes; the original checkout is not the output destination.

The [functional/visual review](reviews/predevelopment-readiness-review/design.md) and [architecture review](reviews/vertical-slice-architecture-review/design.md) retain their original evidence and input manifests. Their findings describe the earlier snapshot. This record maps the resulting changes to maintained sources; it does not rewrite history to make the earlier reviews appear to have inspected v0.7.

## Maintained baseline and status

The source-responsibility table in ADR 0001 governs precedence. In particular:

- [Functional discovery](../../../docs/herald-functional-discovery.md) owns vocabulary, rules, journeys, the decision ledger and conditional acceptance examples.
- [ADR 0013](../../../docs/adr/0013-functional-delivery-scope.md) accepts H1–H7 scope. ADR 0002 is superseded for delivery scope. Confirmed scope does not accept every proposed functional default.
- [ADRs](../../../docs/adr/README.md) own technical decisions; their individual Proposed/Accepted status remains visible. Backend slices and frontend features are the confirmed direction, with implementation choices still gated.
- [Visual direction](../../../docs/herald-visual-direction.md) owns tokens, canonical references and screen/state coverage. PPT and prototypes explain those sources with sample data.
- [Roadmap](../../../docs/roadmap.md) owns sequence and change status. `openspec/specs/` still describes the implemented skeleton. Active deltas describe the target until implementation and archival.

Only `m0-solution-skeleton` is implemented. Its `Application`/`Adapters` layout is historical but still accurately describes current code. `m0-messaging` owns the proposed backend migration and its unresolved spike. [m0-web-shell](../m0-web-shell/proposal.md) is a draft; there is no production Angular workspace. H1 functionality has not begun.

## Functional and visual review closure

“Documented” means that a coherent rule or explicit proposed choice, scenario and gate now exists. It does not mean a new product choice was approved, implemented or tested in production.

| Finding | Maintained resolution | Remaining gate |
| --- | --- | --- |
| R-01 Scope/status drift | README, roadmap, ADRs 0002/0013 and discovery §15 use the same H1–H7 sequence; PPT is v0.7 | Accept only the individual proposed decisions when ready |
| R-02 Terminal outcomes | Discovery §8.1 specifies played/administrative outcomes, in-play withdrawal, double absence, no contest and all-withdrawn handling; AT-06 | Review D-04/05/25 before result implementation |
| R-03 Membership versus eligibility | Discovery §10.2.1 separates persistent club departure, frozen tournament roster, competitive withdrawal/sanction and actual participation; AT-05 | Review D-17/23 and the team slice |
| R-04 Finalisation consistency | Discovery §9.3, D-24, AT-07; ADRs 0004/0005/0007 define ownership, receipts and revision-aware review | Specify the authoritative coordination in the H1 operation; prove concurrent correction behaviour |
| R-05 Pilot identity/access | Discovery F-01a, D-21/22 and AT-12/13; identity and direct API authority are H1 scope in ADR 0013 | Confirm provisioning/recovery/private access and verify the confirmed alias-only privacy constraint before that slice |
| R-06 Announcement delivery | Discovery F-10 and D-26 distinguish H1 organiser communication/change history from later notifications | Confirm the H1 operational process; no claim of delivery to guests |
| R-07 Lifecycle transitions | Discovery §§5.1/5.2, D-27, AT-02/03/09/11 cover publication, closure, reopening, cancellation, archive, visibility and dates | Review transition policies and concurrency with the affected slice |
| R-08 Conflicting mockups | README and visual guide name the corrected outcomes/standings concept as canonical; the earlier round image is historical for semantics | Use deterministic reviewed fixtures for acceptance, never arithmetic inferred from concept art |
| R-09 H1 visual coverage | Discovery §18.2 and visual guide map journey/state coverage; deterministic state views and static journeys complement the individual demo | Review states per slice; visual existence is not product acceptance |
| R-10 Recovery/correction | Discovery AT-07/08, visual exception states and prototype depict impact, blocked/stale review and retry reconciliation | Validate actual server enforcement with the implementation; no invented round-robin dependency |
| R-11 Presentation hierarchy | PPT v0.7 distinguishes H1 direct results, later collaborative reporting and confirmed/proposed agenda | Maintain its version/notes when its source changes |
| R-12 Visual verification | Prototype token/focus/contrast/spacing corrections and recorded desktop/mobile/grayscale/blur QA under Refactoring UI | Scope scores to inspected artefacts; production accessibility remains to be tested |
| R-13 Preselected winner | New-result form begins unselected, keeps confirmation disabled until an outcome is chosen; editing an existing result keeps its value | Carry the behaviour into the result slice's acceptance tests |

## Architecture review closure

| Finding | Maintained resolution | Implementation gate |
| --- | --- | --- |
| A-01 Reuse ownership | ADR 0004 distinguishes business/domain reuse from persistence, hosting and feature-local technical responsibility; proposed backend spec matches | Demonstrate allowed/forbidden dependencies in `m0-messaging` |
| A-02 Independent composition | ADRs 0004/0011 forbid feature-to-feature calls/imports; composition uses entry points and stays out of business workflow | Backend namespace/project fixtures and frontend import checks |
| A-03 Cross-module authority | ADR 0004 allocates operation intent, readiness, effective results and revisioned projections; discovery defines observable guards | Each H1 cross-module operation specifies owner, authoritative facts and revision conditions |
| A-04 Durable history | ADRs 0005/0006/0007 distinguish receipts, domain events, persisted business revisions and projections; logs/message retention are insufficient | First effective-result/correction persistence slice proves atomic state/history and retained predecessor |
| A-05 Frontend features/state | ADR 0011 defines app composition, features, platform, shared presentation, UI and generated client dependencies; server/local state and context reset are explicit | Draft `m0-web-shell` checks import rules; H1 proves cache scoping and mutation recovery |
| A-06 Verifiable boundaries/status | ADR 0010, backend delta and frontend draft require representative violation fixtures; README/roadmap distinguish skeleton, proposals and features | Run those checks when implementing; structural OpenSpec validation is not architectural runtime proof |

No new messaging topology, store fallback or transport solution is selected. The messaging design now labels the recorded receiver-inbox failure and unrun checks as unresolved instead of claiming there are no open questions. Its existing investigation remains the place to resolve them.

## Illustrative H1 slice: correct an effective result

This responsibility walkthrough is a design example, not a fixed endpoint or message contract:

1. The admin results feature owns the route, correction form, current result query and mutation. It retains unsaved input and obtains actor/organisation context from the app platform. It does not import the standings feature or put result rules into the shared UI library.
2. A Competition slice receives the operation identity, reviewed revision, intended outcome and reason. It validates scope and application preconditions, then applies the domain's correction rules. A stale request yields a conflict that preserves the user's input for another impact review.
3. Competition persists the effective revision, predecessor and required authorship/participation evidence together with the outgoing integration event. Repeating the same operation/content returns its receipt; changed content under the same identity conflicts. Detailed storage and delivery mechanics belong to the implementation change.
4. Standings consumes the effective revision and exposes the revision it has applied. The command receipt says whether the change applied; it does not pretend that every view is already current. The frontend invalidates/reconciles its queries and displays pending projection progress where relevant.
5. Tournaments' finalisation operation requires the reviewed current facts and standings revision. A concurrent correction invalidates that review. No frontend check or stale projection can grant authority to finalise.

The backend and frontend each own cohesive use cases. They do not need identical module trees, shared feature handlers or a generic services layer to complete this flow.

## Visual artefacts and prototype

The original individual operator demo remains a local in-memory design tool. Additional deterministic exception views and H1 journey snapshots live under `prototypes/frontend/`; the visual guide indexes their scope and captures. They use the existing graphite/lime direction, square geometry and the documented spacing scale, with Refactoring UI applied to hierarchy and states.

The maintainer's follow-up explicitly requests more main-journey mockups and a static prototype. Their purpose is to review flows and information, including individual/team differences and recovery, before production development. They do not supply identity, persistence, backend validation or a production Angular architecture. H2 discovery/participant references remain labelled as later scope.

## Validation and outstanding decisions

Record completed checks and their limits in [validation.md](validation.md). The presentation is checked by re-import and rendered inspection, documentation by reference/status/structure checks, and prototypes by syntax, navigation, representative interactions and visual inspection. No production tests are needed for unmodified production code; no messaging spike was rerun as part of this consolidation.

Outstanding product choices remain in discovery §15 with owners and gates, principally terminal/scoring defaults, membership/eligibility policy, identity/private access, manual H1 communication, lifecycle transitions and finalisation revisions. Frontend tool selection and runtime implementation remain in the draft M0 change. These are named design decisions to resolve before their affected slices, not hidden contradictions or a claim that all of H0 is accepted.
