# Roadmap

Each milestone ends with something that works end to end. From M0 on, every milestone is one or more OpenSpec changes (`/opsx:propose`), and its design notes and measurements go in the change's `design.md`.

## Current state — 11 November 2026

| Work | State | Next gate |
| --- | --- | --- |
| Functional/technical/visual baseline | Consolidated as v0.7; confirmed scope and proposed defaults are distinguished | Resolve the functional decision ledger before each affected H1 slice; review the new wireframes |
| `m0-solution-skeleton` | Implemented and archived; empty backend modules, local PostgreSQL/host and CI | Preserve its accepted specifications as the description of current code |
| `m0-messaging` | Implemented and archived: vertical-slice modules, one shared Wolverine store, the Service Bus emulator, messaging tests and pre-generated code; ADR 0005, 0008 and 0009 follow-ups answered | Its specifications describe current code; H1 confirms the pending items in its ADR follow-ups |
| `m0-web-shell` | Implemented and archived: Angular workspace (`web/`) with admin and public shells, `ui` and catalogue, render modes and SSR isolation, Aspire startup, public/admin OpenAPI documents with the generated client and CI drift checks | The first H1 features add behaviour; the first public tournament page verifies API-backed SSR transfer, metadata and visibility/cache isolation; M4 hosts the SSR runtime |
| `h1-organisation-access` | Implemented, merged (#6, #8) and archived: sign-in through the shared External ID directory, organisations with a single owner, switching, isolation (EF Core filters; RLS rejected for H1), access states, `relink-person`; run against the real directory on 10 November 2026, with visual refinements from that run | Its specifications describe current code; next H1 slices build on its organisation context |
| `e2e-critical-paths` | Implemented, merged (#7) and archived: the Playwright suite in `e2e/` (ADR 0015) with a fake OpenID Connect provider, nine journeys with axe checks, the host's `E2E` environment and a workflow after each merge to `main`; its runs on `main` pass (about 3 minutes) | Add journeys with each H1 feature |
| `h1-tournament-setup` | Implemented, merged (#10) and archived: first F-02 slice (D-27 first row): draft with a title, configuration with revision-aware saves, review, publication, list, editing after publication; journeys 10 and 11 added to `e2e/` (eleven journeys) | Its specification describes current code; the next slice opens registration (`h1-registration-window`) |
| `h1-registration-window` | Implemented, merged (#12) and archived: second F-02 slice (D-27 rows 2 and 3): an owner opens, closes and reopens the registration of a published tournament by hand, with the announced dates as an announcement; journey 12 added to `e2e/` (twelve journeys); run through Aspire by the maintainer on 11 November 2026 | Its specification describes current code; the next slice adds entries (`h1-entries`) |
| `h1-entries` | Implemented, merged (#14) and archived: guest players and teams (D-22), entries with automatic or manual admission within the capacity, a waiting queue with promotion, cancellation, EN-10 limits on the configuration; the first integration events between modules through durable local queues (ADR 0016); journeys 13 and 14 added to `e2e/` (fourteen journeys); run through Aspire by the maintainer on 11 November 2026 | Its specifications describe current code; `ui-feedback-and-layout` adds modal dialogs, toasts and a wider desktop layout |
| `ui-feedback-and-layout` | Implemented, revised in the maintainer's run through Aspire, merged (#16) and archived: rules for feedback placement (toasts for outcomes only, errors where they arose), confirmations (modal dialog, drawer, page, direct action), full-width admin pages with secondary content stacked and the public 1200 px cap, and visual weight following actionability (visual direction §4, §5, §7.2, §8.1); `Dialog`, `Drawer` and `Toast` in `ui` with catalogue entries; every admin screen and the public home adopt them; journeys 8, 13 and 14 updated | Later screens and the public site follow the recorded rules; the admin initial bundle exceeds its 900 kB warning and is optimised when it becomes an obstacle |
| `h1-team-rosters` | Implemented, merged (#18) and archived: team rosters of guest players within the tournament's bounds (D-17, TM-02, TM-03, TM-05), one team per player among active entries, derived readiness, roster history; the roster bounds travel in the entry terms (optional members, contract version 1); the roster drawer in the admin entries page; journey 15 added to `e2e/` (fifteen journeys); run through Aspire by the maintainer on 11 November 2026 | Freeze at start and lineups come with competition; check-in is a later slice |
| `h1-check-in` | Implemented, merged (#28) and archived: the owner checks in admitted entries, individual or team, and undoes a check-in (F-05), pending or confirmed only, with its own revision and history; the field counts carry the checked-in count (optional member, contract version 1); confirmed check-ins lock the check-in policy; check-in in the admin entries page; journey 16 added to `e2e/` (sixteen journeys); run through Aspire by the maintainer on 12 November 2026 | No check-in window or absent state in H1; the start slice reviews absences |
| `ui-icons` | Implemented on 12 November 2026, pull request pending: Tabler icons in the admin rail navigation, status labels, back and entries links and empty panels, with a 32 px empty-state size in `ui`; actions keep text only; before/after captures instead of new mockups; the admin bundle grows by 3.67 kB | Archive in a separate pull request after the merge |
| Delivery process | [ADR 0018](adr/0018-deliver-in-batches-tested-on-a-deployed-preview.md) accepted on 13 November 2026 (`batch-delivery`): from H1's remaining slices, batches implemented by the agent in cloud sessions, at most two slices in progress, tested by the maintainer locally until M4 and then on a preview per pull request; progress tracked in GitHub Issues, by milestone and on the project board ([delivery tracking](operations/delivery-tracking.md)) | The maintainer runs `scripts/github-setup` and creates the board; the [H1 batch map](#h1-batches--accepted-13-november-2026) is accepted; the first batch starts by hand, then the next-slice scheduled task |
| Preview environments and synthetic data | [ADR 0019](adr/0019-preview-environments-and-synthetic-data.md) proposed on 12 November 2026: fixed `main` and `preview` slots with real sign-in and persona accounts, a database per slot, no broker until needed; synthetic data seeded through the host in process | `dev-synthetic-data` implemented, merged (#23) and archived: `tools/Herald.Seed` seeds through the endpoints, Aspire seeds as the maintainer (run on 12 November 2026); slots and pipeline in M4 |
| `harness-engineering` | Implemented, merged (#24, #25, #26) and archived: rules checked after each edit, before each commit and in CI (`docs/rules/`); scenario-to-test traceability with a baseline that only shrinks; `scripts/bootstrap`; declared permissions; the `herald-reviewer` subagent; per-turn harness metrics; Aspire's MCP server; executable test scripts with screenshots in CI | Recalibrate the loop guard from the first slices' metrics; shrink the baseline as slices touch each specification |
| `harness-resumption` | Implemented and archived in #30: a checkpoint pushed per task, with push rounds counted only once a pull request is open; metrics carried as `Harness-Metrics` commit trailers that survive the container; the slice's state given back after a compaction or a resume (`scripts/slice-state.mjs`); the phase guard keeps production code closed until a change is approved; the harness's purpose stated in `agent-harness` | A new session (not a resumed one) relies on `CLAUDE.md` to read the slice's state; ADR 0018's trial batch checks it |
| `ci-path-filters` | Implemented and archived in its pull request: `scripts/ci-changes.mjs` classifies a change, and only `rules` runs when every file is documentation or harness; drafts run nothing; runs on `main` are never cancelled, so each merge is checked; the loop guard forgets a merged pull request | Confirm on the first pull requests that documentation pushes cost one `rules` job |
| `private-data-guard` | Implemented and archived in its pull request: the repository is public; `scripts/rules.mjs` rejects real identifiers, personal addresses, directory hosts, home paths and public IPs (`docs/rules/private-data.json`); gitleaks 8.30.1, pinned and verified, scans staged changes and each pull request (the whole history was clean on 13 November 2026); the agent cannot list or read the local secrets; personal paths and the tenant domain redacted from the archive | Aspire's MCP output may show parameters not marked secret: mark them secret in a change of its own |
| `ponytail-plugin` | Implemented and archived in its pull request: the ponytail plugin pinned to v5.3.3 in `.claude/settings.json` and installed by `scripts/bootstrap`, so cloud sessions load it as the maintainer's do; Herald's rules take precedence (`CLAUDE.md`, the reviewer's definition) | An upgrade changes the tag, checks the hooks and licence, and edits the environment's setup script so the checkpoint is rebuilt |
| H1 functionality | Started: organisation access, tournament setup, the registration window, guest entries, team rosters and check-in are the first slices | Bounded OpenSpec slices for identity, configuration, entry/readiness, operations, history and public reads |

The two audit notes are historical evidence. Their [consolidation record](../openspec/changes/archive/2026-11-08-documentation-consolidation/design.md) maps findings to the maintained sources and distinguishes documentation closure from product approval and implementation.

## H2 functional refinement — 13 November 2026

The [H2 functional discovery](herald-h2-functional-discovery.md) now defines the participant/representative milestone, bounded automation and target acceptance scenarios. Confirmed direction and author-defined defaults are distinguished in the [single decision register](herald-functional-discovery.md#15-decision-register-and-development-gates), D-30–38. This is documentation work (`h2-functional-discovery`), not an implemented H2 slice. M4 still precedes H2. H1 manual registration-window actions remain the implemented contract; H2 adds operative dates and minimum-field cancellation.

## H3 functional refinement — 13 November 2026

The [H3 functional discovery](herald-h3-functional-discovery.md) develops elimination, single match and result profiles with target journeys and acceptance. Proposed defaults and unresolved gates are recorded in the [single decision register](herald-functional-discovery.md#15-decision-register-and-development-gates), D-39–47. This is documentation work (`h3-functional-discovery`), not implemented H3 or approval of optional profile additions. H3 still follows H2; the delivery order is unchanged.
## H4 discovery and delivery handoff

The [H4 discovery](herald-h4-functional-discovery.md) specifies candidate Swiss rules, exact tiebreaker examples and the connected-consumer lifecycle for review (`h4-functional-discovery`, documentation only). The [single register](herald-functional-discovery.md#15-decision-register-and-development-gates) owns D-48–56 status. The [H3 discovery](herald-h3-functional-discovery.md) owns the preceding milestone detail and D-39–47 remain proposed, not implemented behaviour. H1 is incomplete, M4 remains before H2, and H4 follows the existing H2/H3 sequence. None of these prerequisites is declared complete here.

Proposed delivery sequence, subject to policy and sizing review:

1. Approve the Swiss policy/profile and independent expected fixtures, including odd groups, prior byes, withdrawal, exact arithmetic and impossible/exhausted search. Identify the real consumer and resolve its compatibility needs before fixing a profile it cannot execute.
2. Deliver reproducible Swiss preview/publication and authoritative round gates as bounded slices, including individual/direct-team readiness and incident recovery.
3. Deliver points/explanations, safe corrections, departure/exceptional closure and final review with current-input barriers. Include the necessary result/standings behaviour in earlier slices for a complete vertical journey.
4. Deliver scoped connected identity/profile agreement and fenced assignment/reconciliation, first proving recovery on a league if useful, then completing the real connected Swiss journey. Human reporting and explicitly granted result-source authority remain separate.
5. Validate full eight-/32-entry runs, team invariants, the real adapter, cancellation/revocation/restart races and reviewed visual/operational limits before H4 completion. A mock consumer or documentation scenarios alone cannot meet this exit.

These are delivery recommendations, not approved batches, issues or production tasks. Each batch follows ADR 0018 after prerequisite slices merge, with its decision/visual review and executable acceptance. Local imports, offline direction, cuts, email/webhooks and multi-executor expansion remain outside H4's first scope.

## H5 discovery and delivery handoff

The [H5 discovery](herald-h5-functional-discovery.md) develops combined stages, live following, operational email and the API ecosystem (`h5-functional-discovery`, documentation only). The [single register](herald-functional-discovery.md#15-decision-register-and-development-gates) owns D-57–65 status; these recommendations approve no new sporting, privacy or service policy. H1 remains incomplete; M4 and the relevant H2–H4 implementation/decision gates precede H5. Discovery documents are not completion evidence.

Proposed delivery sequence, subject to decision, dependency and sizing review:

1. Agree the bounded templates, terminal selector, group crossings, eligibility/exceptional closure and authoritative correction/cut barriers with independent expected fixtures. Confirm real-consumer successor compatibility for connected tournaments.
2. Deliver stage plan and complete source-closure/cut/successor-publication journeys as bounded vertical slices, including individual/direct-team continuity, atomic recovery and final review. Prove the 16-entry four-group Top 8 and a supported Swiss Top 8; do not ship a cut button without its dependency/correction safety.
3. Deliver revision-aware live following and current snapshot/cursor reconciliation, including fallback, privacy invalidation, access loss and measured load/freshness limits; transport choice remains a technical review.
4. Deliver verified operational email after contact/privacy/provider decisions and H2 notices, with preferences, unknown-response/bounce handling and redacted delivery evidence.
5. Deliver application/grant/credential management and safe public webhook subscriptions with a real consumer, bounded retries/replay, signed attempts, rotation/revocation races and published individual/team API examples. Foundational grant/security work precedes any dispatch or general onboarding even if split into earlier slices.
6. Fix and publish compatibility, quotas, retention, support and cost commitments before general access. Execute the full cut/live/email/consumer journeys and reviewed visual states, including outages, supersession and resynchronisation. Documentation examples and mock deliveries alone cannot meet H5's exit.

These are delivery recommendations, not approved batches or production tasks. Each future batch follows ADR 0018 with its relevant gates closed and executable acceptance; policy approval, prototype review and measured evidence precede implementation/release claims. Advanced stage graphs, wildcard comparisons, reserve replacement, H6 encounters and H7 continuity remain separate scope.

## H6 discovery and delivery handoff

The [H6 discovery](herald-h6-functional-discovery.md) develops the existing advanced-team and private game-submission scope (`h6-functional-discovery`, documentation only). The [single register](herald-functional-discovery.md#15-decision-register-and-development-gates) owns D-66–74 status. Bounded profiles, substitution/amendment allowances and submission/reveal rules are recommendations, not approved sporting/privacy policies. H1 is incomplete; H2–H5 discoveries do not demonstrate implementation. H6/H7 remain separately prioritised extensions after their relevant core dependencies; this handoff does not reorder the core sequence.

Proposed delivery sequence, subject to policy, dependency and sizing review:

1. Agree independent three-board arithmetic/incident fixtures, allocation fairness, ordered-game substitution rules, exceptional amendment/transfer policy and private-submission scope/deadlines. Name authoritative owners and settle inherited result/participation/correction gates before proposing affected slices.
2. Deliver composite allocation, per-board effective reporting and derived parent results as bounded vertical league slices, with team standings once, all-board completion, actual appearances, administrative termination and safe child corrections. Prove the four-team/six-parent/18-board journey before claiming composite operation; decisive Swiss/elimination variants need separate accepted profiles/fixtures.
3. Deliver ordered direct-team game participation and the approved request/decision/boundary substitution flow. Aggregate-only and earlier fixed-lineup profiles remain unchanged; prove game-start/approval races and the complete reserve-to-final-result journey.
4. Deliver protected submission slots, version/deadline locks, inspection/waivers and API/access evidence. Complete this before enabling a roster-amendment path that requires incoming-player submissions. Confirm storage ownership, privacy/security and measured text/retention limits before real content capture; optional public reveal has a separate policy/visual gate.
5. Deliver announced exceptional future roster amendments after authoritative round/stage barriers exist, including exclusive incoming eligibility, frozen-history retention, invalidated unstarted locks, submission exceptions and independent review. No general roster unfreeze or automatic transfer is added.
6. Complete capability-specific API/connected compatibility, protected notices/history, full web/API acceptance, accessibility and operational/purge evidence before H6 readiness. H4/H5 integrations must negotiate H6 capabilities; mock execution, documentation examples or screenshot-only evidence cannot satisfy these exits.

These are recommendations, not approved batches/issues/implementation tasks. Each future batch follows ADR 0018 after its dependencies, decision/visual review and executable acceptance. Weighted/decisive composite expansion, in-game substitutions, public list search, legality/catalogue integration and H7 continuity require separate scope decisions.

## H1 batches — accepted 13 November 2026

H1's remaining work, grouped into batches under [ADR 0018](adr/0018-deliver-in-batches-tested-on-a-deployed-preview.md). The maintainer accepted the map and its answers to the review questions on 13 November 2026; each slice's boundary is refined when it is proposed. Each batch's issue links here, and its decision session settles its rows before its proposals pull request. Rules come from the [functional discovery](herald-functional-discovery.md) (F-05 to F-11, AT-01 to AT-14); nothing here decides a rule.

Two slices that change the EF Core model of the same module do not run side by side (ADR 0018). Pairings, lineups and results all change `Herald.Competition`'s model, so they run in series; the "Depends on" columns say so.

Delivered slices already cover AT-12 (`h1-organisation-access`) and the publication, closure and capacity parts of AT-02 and AT-03 (`h1-tournament-setup`, `h1-registration-window`, `h1-entries`); their start and pairing parts belong to batch 1.

### Batch 1: start and pair

Goal: an owner starts a league and publishes its round-robin schedule.

| Slice | Delivers | Main module | Depends on |
|---|---|---|---|
| `h1-competition-start` | Start readiness, the absence review, roster freeze and competition start (F-05) | Tournaments, Registration | none |
| `h1-round-robin-pairings` | A draft schedule, publication as a revision, rest rounds, draft regeneration (F-06) | Competition | `h1-competition-start` |

Decision rows: D-29 (absences at start), D-23 (frozen-roster eligibility), D-18 and D-25 (team start).
Acceptance journey: four individual entries yield six published matches; five yield ten with one rest round each; four teams yield six matches (AT-01 and AT-04, pairing part); starting fails with fewer than two eligible entrants (AT-02, start part); a published pre-start schedule changes only by withdrawal, review and republication (AT-03, pairing part).

### Batch 2: play and score

Goal: rounds are played and the standings explain themselves.

| Slice | Delivers | Main module | Depends on |
|---|---|---|---|
| `h1-match-lineups` | Locked match lineups from the frozen roster, with the required active count and pre-start replacements (F-06, F-08) | Competition | batch 1 |
| `h1-operator-results` | Operator-entered results validated against the profile, with safe retries (F-07) | Competition | `h1-match-lineups` |
| `h1-exceptional-outcomes` | No-show, concession, no contest and administrative outcomes of §8.1 (F-07, F-08) | Competition | `h1-operator-results` |
| `h1-standings` | Standings from effective results, explained points and tiebreakers, rest rounds without points, shared positions (F-09) | Standings | `h1-operator-results` |
| `h1-round-operations` | The operations queue, round completion, withdrawals and sanctions during competition (F-08, D-05) | Competition | `h1-exceptional-outcomes` |

Decision rows: D-05 (withdrawal and disqualification), D-23 (lineups and eligibility changes), the exceptional outcomes of §8.1.
Acceptance journey: AT-01 in full (six matches and explainable final standings), AT-04 (a seven-player roster fields five starters; a team of four cannot play), AT-05 (eligibility changes after the freeze), AT-06 (no-show and withdrawal in play).

### Batch 3: correct, close and open

Goal: the tournament is corrected safely, finalised, announced, read by link and run end to end through the API.

| Slice | Delivers | Main module | Depends on |
|---|---|---|---|
| `h1-safe-corrections` | Corrections with a revision and an impact preview (UJ-06, D-07) | Competition, Standings | batch 2 |
| `h1-tournament-cancel-and-dates` | Cancellation, archiving and postponed dates (AT-09, AT-11, D-27) | Tournaments | batch 2 |
| `h1-finalisation` | Review and finalisation, and history (F-09, D-24) | Standings | `h1-safe-corrections` |
| `h1-change-log` | An operator-visible change log: admissions, cancellations, published pairings, material changes (F-10, D-26) | Tournaments | `h1-tournament-cancel-and-dates` |
| `h1-public-read` | The public or unlisted page with rounds and standings (UJ-07, D-09, D-27) | Tournaments, public web | `h1-tournament-cancel-and-dates` |
| `h1-api-journey` | A complete league without Angular: receipts, revision-aware reads, idempotency (UJ-08, F-11) | across modules | `h1-finalisation`, `h1-change-log`, `h1-public-read` |

Cancelling after the start voids unresolved pairings, which is Competition's state. Competition does so on Tournaments' cancellation event, so `h1-tournament-cancel-and-dates` changes only Tournaments' model; if its proposal needs to change Competition's, it runs after `h1-safe-corrections` instead of beside it.

Decision rows: D-07 (corrections), D-24 (finalisation barrier), D-26 (H1 announcements, a new proposal), D-27 (visibility, cancellation, dates), D-09 (public identity), D-02, D-12 and D-15 (the API's result and identity contract), D-14 (pilot).
Acceptance journey: AT-07 to AT-11, AT-13 and AT-14; with it, H1's exit criteria below.

### Review answers

The maintainer's answers of 13 November 2026 to the map's open questions:

- **Slice size:** results are split into `h1-operator-results` and `h1-exceptional-outcomes`, in series. `h1-api-journey` stays whole unless its proposal adds API contract that does not yet exist.
- **D-26 timing:** `h1-change-log` moves to batch 3: it records published pairings and cancellations, which earlier slices create, and its acceptance (AT-09, AT-11) is there. Batch 1 has no parallel pair.
- **Cancellation and dates in H1:** they stay, because AT-09 and AT-11 belong to H1's acceptance.
- **Public read earlier:** no; it depends on D-09 and D-27, settled in batch 3, and has little to show before standings.

## Target delivery

| Milestone | Delivers | Exit criteria |
|---|---|---|
| **M0 Foundations** | .NET solution (`Herald.slnx`) with the AppHost, service defaults, building blocks, contracts, the initial empty modules (ADR 0004) and the host; Wolverine wired to PostgreSQL and the broker; architecture tests; CI; one Angular workspace with admin (CSR) and public/participant (hybrid) shells | CI green on format, build and tests; `dotnet run` on the AppHost starts PostgreSQL, the broker, the host and both web apps; representative public prerendering and hydration verified; the ADR 0005, 0008 and 0009 follow-ups answered |
| **H1 Operator league** | Individual and direct-team league through web/API; identity and organisation isolation; guests, admission, check-in, roster/lineup readiness, operator outcomes and safe corrections | UJ-01–03 and UJ-06–08; four entries produce six matches; retry-safe results; private data protected; reviewed current final standings |
| **H2 Participant portal** | [Detailed H2 scope](herald-h2-functional-discovery.md): open participant access with restricted administration, discovery/self-service, teams, reporting, history/notices and bounded automation | UJ-04/05 and H2 acceptance scenarios complete; minimum-field cancellation with notices; no pending-result points or private-data leaks |
| **H3 More competition systems** | [Detailed H3 scope](herald-h3-functional-discovery.md): elimination, single match and richer result profiles | Individual/team brackets, byes and profile validation; H3 target acceptance with proposed gates resolved |
| **H4 Swiss and connected consumer** | [Detailed H4 target](herald-h4-functional-discovery.md): specified Swiss policy/profile and an identified compatible real consumer, for individual/direct-team entries | Eight-/32-entry configured runs; no forbidden rematches/byes or partial publication; exact shared standings; real connected execution and lost-response recovery without duplicate effects; policy/operational gates resolved |
| **H5 Stages and live ecosystem** | [Detailed H5 target](herald-h5-functional-discovery.md): combined stages, live following, operational email and scoped application/webhook ecosystem | Reviewed unambiguous Top 8; stable individual/team continuity; dependency-safe corrections; authorised snapshot/retry/replay reconciliation and revocation; concrete compatibility/privacy/operational gates resolved |
| **H6 Advanced teams** | [Detailed H6 target](herald-h6-functional-discovery.md): composite boards, versioned direct-game substitutions, exceptional roster amendments and private game submissions | Complete assigned-board league with one parent standings effect; permitted participation boundaries and actual-play history; safe child corrections; protected revisioned submissions; policy/compatibility/operational gates resolved |
| **H7 Circuits** | Seasons and cross-tournament points | Revisable standings and explicit continuity policy |
| **M4 Cloud — technical track** | Azure deployment on the shared platform under ADR 0012, after H1 and before H2 | Deploy on merge, protected credentials and measured idle cost; accessible environment before a remote pilot; the `main` environment and a `preview` slot for the slice pull request, with seeded data and a test account per persona (ADRs 0018, 0019); the measured monthly cost of both recorded beside the base cost |

The functional sequence in `herald-functional-discovery.md` is authoritative for product delivery (ADR 0013). Former M1/M2/M3/M5/M6 labels are historical: their capabilities are distributed across H1–H7. M0 and M4 retain their technical meaning. H1 includes sign-in and scoped permissions; it is delivered through multiple OpenSpec changes, not one large implementation. Other proposed defaults in discovery still require review before their slice.

Frontend scope (ADR 0011): `m0-web-shell` creates one workspace with two app shells: admin (CSR) and public/participant (hybrid), sharing UI, tokens and the generated API client. Its exit criteria include starting both apps through Aspire and verifying a representative prerendered public page and hydration. The complete corporate site and discovery flows are outside M0. The first public tournament page verifies API-backed SSR, metadata and visibility/cache isolation; M4 supplies the SSR runtime alongside static asset hosting and measures SSR/API cold starts.

Component scope (ADR 0011): M0 creates an internal `ui` library consumed by both shells, separate from `api-client`, with only the shared pieces those shells require. Features retain their own components and app-local shared pieces. Add a component/state catalogue as development tooling with the first controls; no third product app, independently versioned UI package or complete component system is required in M0.

M0 is three changes: `m0-solution-skeleton` (solution, modules, host, AppHost, architecture tests, CI) first, archived before `m0-messaging` (Wolverine, EF Core, outbox, broker) and `m0-web-shell` (Angular workspace, both shells, OpenAPI document and API client) are proposed; those two then run in parallel.

Delivery order: H1, then M4, then H2 (decided 12 November 2026). M4 comes first because H2 is delivered through previews per pull request (ADR 0018), which need a deployed environment. H3 onwards keep the functional sequence.

Next: M0's three changes are implemented and archived, and H1's slices up to team rosters are merged; the remaining H1 slices follow in batches under ADR 0018, after their decision gates. Accept each remaining Proposed ADR when its relevant decisions are settled; do not make a blanket status change because documentation is consolidated. M4 waits for the shared platform repository, which will take the costly shared resources out of Arcana's state; it is not designed yet. Because M4 now precedes H2, the platform has to be designed while H1 finishes; otherwise ADR 0012's reviewed pilot environment is planned instead of bypassing the platform boundary.

H0 remains the product decision gate described in the functional baseline. It does not require solving H2–H7 or every M0 implementation detail. No H1 screen proposal is ready solely because a concept image or wireframe now exists: confirm the rule/interaction decisions and relevant states for that slice.

## Proposed roadmap refinements

[Extensible match result profiles](result-profiles-proposal.md) proposes preserving score-free H1 outcomes, adding direct numeric scores as an optional bounded H1 follow-on (or H3 if deferred), refining H3's existing Bo3 commitment and leaving sets profiles for a later explicit decision. It separates match evidence from standings points and defines compatibility and acceptance expectations. This is a review proposal; the target delivery rows and functional baseline remain unchanged until incorporation through the existing decision register.
