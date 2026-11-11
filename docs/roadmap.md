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
| `ui-feedback-and-layout` | Implemented on 11 November 2026; the maintainer's run through Aspire, merge and archive pending: rules for feedback placement (toasts for outcomes only, errors where they arose), confirmations (modal dialog, drawer, page, direct action), named widths with an aside and the public 1200 px cap, and visual weight following actionability (visual direction §4, §5, §7.2, §8.1); `Dialog`, `Drawer` and `Toast` in `ui` with catalogue entries; every admin screen and the public home adopt them; journeys 8, 13 and 14 updated | Later screens and the public site follow the recorded rules; the admin initial bundle exceeds its 900 kB warning and is optimised when it becomes an obstacle |
| H1 functionality | Started: organisation access, tournament setup, the registration window and guest entries are the first slices | Bounded OpenSpec slices for identity, configuration, entry/readiness, operations, history and public reads |

The two audit notes are historical evidence. Their [consolidation record](../openspec/changes/archive/2026-11-08-documentation-consolidation/design.md) maps findings to the maintained sources and distinguishes documentation closure from product approval and implementation.

## Target delivery

| Milestone | Delivers | Exit criteria |
|---|---|---|
| **M0 Foundations** | .NET solution (`Herald.slnx`) with the AppHost, service defaults, building blocks, contracts, the initial empty modules (ADR 0004) and the host; Wolverine wired to PostgreSQL and the broker; architecture tests; CI; one Angular workspace with admin (CSR) and public/participant (hybrid) shells | CI green on format, build and tests; `dotnet run` on the AppHost starts PostgreSQL, the broker, the host and both web apps; representative public prerendering and hydration verified; the ADR 0005, 0008 and 0009 follow-ups answered |
| **H1 Operator league** | Individual and direct-team league through web/API; identity and organisation isolation; guests, admission, check-in, roster/lineup readiness, operator outcomes and safe corrections | UJ-01–03 and UJ-06–08; four entries produce six matches; retry-safe results; private data protected; reviewed current final standings |
| **H2 Participant portal** | Discovery, self-service registration/check-in, team representation, competitor reports/confirmation/disputes and history | UJ-04/05 complete; pending results do not affect points; scoped collaboration |
| **H3 More competition systems** | Elimination, single match and richer result profiles | Individual/team brackets, byes and profile validation |
| **H4 Swiss and connected consumer** | Specified Swiss policy and a real external consumer | Reproducible pairings/standings; recovery without duplicate effects |
| **H5 Stages and live ecosystem** | Combined stages, live following, email and webhooks | Unambiguous cuts; revision-aware consumer reconciliation |
| **H6 Advanced teams** | Composite encounters, substitutions and game submissions | Versioned participation; aggregate outcome counted once |
| **H7 Circuits** | Seasons and cross-tournament points | Revisable standings and explicit continuity policy |
| **M4 Cloud — technical track** | Azure deployment on the shared platform under ADR 0012 | Deploy on merge, protected credentials and measured idle cost; accessible environment before a remote pilot |

The functional sequence in `herald-functional-discovery.md` is authoritative for product delivery (ADR 0013). Former M1/M2/M3/M5/M6 labels are historical: their capabilities are distributed across H1–H7. M0 and M4 retain their technical meaning. H1 includes sign-in and scoped permissions; it is delivered through multiple OpenSpec changes, not one large implementation. Other proposed defaults in discovery still require review before their slice.

Frontend scope (ADR 0011): `m0-web-shell` creates one workspace with two app shells: admin (CSR) and public/participant (hybrid), sharing UI, tokens and the generated API client. Its exit criteria include starting both apps through Aspire and verifying a representative prerendered public page and hydration. The complete corporate site and discovery flows are outside M0. The first public tournament page verifies API-backed SSR, metadata and visibility/cache isolation; M4 supplies the SSR runtime alongside static asset hosting and measures SSR/API cold starts.

Component scope (ADR 0011): M0 creates an internal `ui` library consumed by both shells, separate from `api-client`, with only the shared pieces those shells require. Features retain their own components and app-local shared pieces. Add a component/state catalogue as development tooling with the first controls; no third product app, independently versioned UI package or complete component system is required in M0.

M0 is three changes: `m0-solution-skeleton` (solution, modules, host, AppHost, architecture tests, CI) first, archived before `m0-messaging` (Wolverine, EF Core, outbox, broker) and `m0-web-shell` (Angular workspace, both shells, OpenAPI document and API client) are proposed; those two then run in parallel.

Next: M0's three changes are implemented and archived, and H1's first slice (organisation access) is merged; the next H1 slices follow, after their decision gates. Accept each remaining Proposed ADR when its relevant decisions are settled; do not make a blanket status change because documentation is consolidated. M4 waits for the shared platform repository, which will take the costly shared resources out of Arcana's state; it is not designed yet.

H0 remains the product decision gate described in the functional baseline. It does not require solving H2–H7 or every M0 implementation detail. No H1 screen proposal is ready solely because a concept image or wireframe now exists: confirm the rule/interaction decisions and relevant states for that slice.

## Proposed roadmap refinements

[Extensible match result profiles](result-profiles-proposal.md) proposes preserving score-free H1 outcomes, adding direct numeric scores as an optional bounded H1 follow-on (or H3 if deferred), refining H3's existing Bo3 commitment and leaving sets profiles for a later explicit decision. It separates match evidence from standings points and defines compatibility and acceptance expectations. This is a review proposal; the target delivery rows and functional baseline remain unchanged until incorporation through the existing decision register.
