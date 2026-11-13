# Technical architecture review: modules and vertical slices

> Historical review snapshot (7 November 2026), before consolidation. Findings refer to the original inputs recorded alongside this review. See the [consolidation record](../../design.md) for maintained resolutions and remaining gates.

7 November 2026. High-level review of the existing proposal. The user's direction is to organise backend modules by vertical slices and the frontend by functional features. This note records the current state and recommended clarifications; it does not approve every existing Proposed ADR or implement the architecture.

Detailed messaging design and its spike remain in `m0-messaging` and are outside this review's scope.

## Assessment

The proposed direction is coherent: a modular monolith, domain rules protected inside each module, use cases organised as vertical slices, and two Angular applications organised by functional features. The backend transition has already been designed in a local branch. Frontend feature organisation is already documented, including on remote `main`, but its concrete boundaries still need definition.

The remaining architectural work is to make responsibility, composition and reuse rules precise. Replacing folder names alone will not establish those boundaries. There is no need to reopen the frontend rendering choice or the messaging implementation to answer this question.

## What is already documented or in progress

| Area | Verified state | Evidence |
| --- | --- | --- |
| Backend in remote `main` | ADR 0004 still describes `Domain`, `Application` and `Adapters` | [Remote ADR 0004](https://github.com/juliofuentescerrada/herald/blob/main/docs/adr/0004-modular-monolith-of-hexagonal-modules.md) |
| Backend in local `m0-messaging` | Commit `70e9872` revises the proposal to vertical slices; `08c3308` adds the OpenSpec proposal, design, specification deltas and tasks | [Current ADR 0004](docs/adr/0004-modular-monolith-of-hexagonal-modules.md:20); [migration design](openspec/changes/m0-messaging/design.md:82) |
| Backend implementation | Still the empty skeleton with entry points in `Adapters`; the migration and feature-boundary checks are pending | [Registration entry point](src/Herald.Registration/Adapters/RegistrationModule.cs:3); [migration tasks](openspec/changes/m0-messaging/tasks.md:12) |
| Frontend proposal | Standalone components, signals, features, lazy routes and no feature-to-feature imports; two applications with separate `ui` and `api-client` libraries | [ADR 0011](docs/adr/0011-angular-front-end-and-generated-api-contract.md:14), also present in [remote main](https://github.com/juliofuentescerrada/herald/blob/main/docs/adr/0011-angular-front-end-and-generated-api-contract.md) |
| Frontend work already completed | The chat “Definir estrategia frontend SPA y SSR” completed the rendering/shared-UI documentation, ultimately in commit `1801d7c` | Chat history checked; commit is in local `main` ancestry |
| Frontend implementation | No production Angular workspace yet; the HTML/JS/CSS prototype is explicitly disposable | [Prototype scope](openspec/changes/frontend-visual-prototype/design.md:3) |
| Next frontend change | `m0-web-shell` is planned but has no proposal directory yet | [Roadmap](docs/roadmap.md:19) |

GitHub was checked directly, including branch pagination: only `main` and `m0-solution-skeleton` were returned, and there were no open pull requests. `m0-messaging` is local and has not been published as a remote branch. The source checkout and this review worktree both start at `08c3308`; the source checkout additionally contains uncommitted design notes. No other active Herald architecture chat was found in the accessible local Codex chat inventory. This is evidence of recorded work, not a claim about activity in other tools.

ADRs 0004 and 0011 still have status Proposed. The accepted `module-boundaries` specification describes the implemented skeleton; `m0-messaging` explicitly proposes its replacement. That difference is an intentional transition, not evidence that a completed implementation violates the new design. The retained word “hexagonal” in ADR 0004's filename is historical.

## Recommended high-level architecture

### Backend: module boundaries outside, use cases inside

A module defines ownership of a business capability and its data. A slice defines one use case within that module. Keep those two levels distinct: creating a slice should not automatically create a new module, project or deployable service.

The current initial modules remain a reasonable starting map: Organisations, Tournaments, Registration, Competition and Standings. Their boundaries can evolve through discovery, as ADR 0004 already allows.

```text
Herald.<Module>/
  <Module>Module.cs      composition and registration
  Domain/               business concepts, invariants and policies
  Features/
    <UseCase>/          request, validation, handler/endpoint and response
  Persistence/          module data model, mappings and migrations
```

This is a conceptual structure. A small use case can occupy one file with its own namespace; a larger one can use a folder. Cohesion and dependency rules matter more than the file count. Do not introduce global technical folders for all commands, validators or handlers that separate the parts of each use case again.

Features coordinate work and may use their module's persistence. Domain objects enforce business invariants and remain independent of HTTP, messaging and persistence frameworks. Queries can project directly into the response they need. Persistence owns storage details and does not invoke use cases. The module entry point composes these pieces.

This preserves domain independence and external ports while organising application behaviour around change. It is consistent with the existing revised ADR and with the emphasis on request cohesion in [Jimmy Bogard's vertical slice description](https://www.jimmybogard.com/vertical-slice-architecture/). Wolverine's own guidance supports colocating request, validation and handler/endpoint, including use-case-specific data access, without requiring a repository layer for every operation. [Wolverine guidance](https://wolverinefx.net/tutorials/vertical-slice-architecture).

### Frontend: functional features within each application

Use “feature module” to mean an encapsulated functional area, consistent with the standalone Angular choice already recorded. It does not require introducing `NgModule` or a separate library for each feature.

```text
Angular workspace
  admin application
    composition and shell
    application platform: session, organisation context, API configuration
    features: preparation, entries, team readiness, competition operations
    shared presentation used within this app
  public/participant application
    composition and shell
    application platform
    features: corporate pages, tournament following, later participant journeys
    shared presentation used within this app
  ui library            reusable presentation, controls and tokens
  api-client library    generated API contracts and client
```

The feature names are illustrative, not a requirement to create empty future folders. A feature owns its related routes, UI, forms, queries, mutations and tests. Split features when responsibilities justify independent evolution; keep tightly related operations together when an artificial split would require one feature to reach into another.

Frontend feature boundaries follow user capabilities and navigation. They should not mechanically reproduce backend modules or create one feature per endpoint. An operations screen can need data from Competition and Standings while remaining one coherent frontend capability. Angular's own style guide recommends organising related code by feature areas. [Angular style guide](https://angular.dev/style-guide).

## Architectural gaps to close

### A-01 · Clarify what may be shared without putting everything in Domain

**Evidence:** [ADR 0004:23](docs/adr/0004-modular-monolith-of-hexagonal-modules.md:23) and the [proposed boundary rule:31](openspec/changes/m0-messaging/specs/module-boundaries/spec.md:31) say that anything shared by two features belongs in Domain.

That is too broad. Shared business rules belong in Domain; an HTTP response type, query helper, authentication mechanism or persistence concern does not become domain logic merely because two features use it.

**Recommended clarification:** share by responsibility, not by number of callers. Keep domain concepts in Domain, technical persistence work in Persistence, module hosting in the existing hosting responsibility, and use-case-specific work in its feature. Introduce a narrowly named module-local reusable component only when its responsibility is clear. Avoid a general shared-services layer that reconnects every slice.

**Close in:** ADR 0004 and the proposed module-boundary rule before the first real slices.

### A-02 · Specify composition between independent features

Both ADRs prohibit dependencies between features, but a prohibition alone does not explain how a composed workflow is built.

**Recommended clarification:** a backend feature may use shared domain behaviour but should not call another feature's handler as an internal service. Individual frontend features do not import other features; application composition accesses their explicit entry points. A combined screen should be one suitable feature, or an explicitly composed surface with small presentation contracts.

For example, showing rounds beside a standings summary must not require the rounds feature to access a private standings store. This decision concerns ownership and composition, independent of the transport selected elsewhere.

**Close in:** ADRs 0004/0011 and the first representative backend/frontend feature designs.

### A-03 · Allocate responsibility for workflows spanning backend modules

Tournaments owns lifecycle, Registration owns admission/readiness, Competition owns matches, and Standings owns derived views. Starting or finalising a tournament needs facts from several owners. See [ADR 0004's responsibility map](docs/adr/0004-modular-monolith-of-hexagonal-modules.md:35) and [functional control points](docs/herald-functional-discovery.md:133).

**Recommended clarification:** identify who owns each cross-module operation, who authoritatively validates its conditions, and when its result is provisional or effective. Assign organisation/permission checks and audit responsibility to those operations. If an invariant is repeatedly awkward to enforce across a boundary, revisit the boundary before introducing a hidden dependency.

The high-level architecture should provide this ownership model. The concrete coordination and messaging mechanisms remain in their own implementation designs.

**Close in:** the first H1 design involving publication/start/finalisation, without blocking unrelated M0 work.

### A-04 · Make durable history an explicit architectural responsibility

The proposal stores current state and dispatches events; it does not use event sourcing. Yet the product requires previous result/roster revisions, actor and reason to remain explainable. The phrase that events provide history in [ADR 0006:30](docs/adr/0006-tactical-ddd-with-domain-events.md:30), alongside [ADR 0007:18–29](docs/adr/0007-postgresql-ef-core-state-stored.md:18), does not specify who preserves that evidence.

**Recommended clarification:** each owning module preserves the durable business revisions required by its operations. Operational logs and delivery mechanisms should not be the only record of a competitive decision. This fits state storage and does not require adopting event sourcing.

Similarly, distinguish a command's execution outcome from a read model: [ADR 0005:16](docs/adr/0005-cqrs-with-wolverine.md:16)'s “at most the id” wording needs to accommodate the product's operation receipts and revision/conflict metadata without abandoning CQRS.

**Close in:** ADRs 0005–0007 and the first H1 write/history contract.

### A-05 · Complete the frontend dependency and state-ownership model

[ADR 0011:14–19](docs/adr/0011-angular-front-end-and-generated-api-contract.md:14) defines the major direction well. What remains is a small, enforceable dependency matrix:

| Area | Intended responsibility and dependencies |
| --- | --- |
| App composition/shell | Layout, route composition and context; imports feature entry points; does not accumulate business workflows |
| Feature | Own UI, queries/mutations and local interaction state; uses app platform, approved shared presentation, `ui` and `api-client`; no other feature or other app |
| App platform | Session, organisation context and API configuration; no dependency on feature internals |
| App-local shared presentation | Demonstrably reused presentation; no dependency back into features |
| `ui` | Presentation and tokens; no API, session, permissions, routing or app state |
| `api-client` | Generated contract and transport; no UI, navigation or business workflow state |

Keep server state owned by the feature's queries/mutations and local UI state scoped to its interaction. Specify what resets when user or organisation changes. Public SSR state must be isolated per request and distinct from private operational state; rendering modes alone do not establish those guarantees. Angular documents the provider-lifetime and HTTP transfer-cache considerations involved. [Angular SSR](https://angular.dev/guide/ssr).

**Close in:** the `m0-web-shell` design and first data-bearing H1 feature. Generator, transport and hydration details can be chosen in those changes.

### A-06 · Turn architectural intent into verified boundaries and accurate status

Current [.NET architecture tests](tests/Herald.Architecture.Tests/ModuleTests.cs:16) protect the previous skeleton. `m0-messaging` plans the new tests. Frontend has no production workspace or boundary checks yet. These are pending work, not failures in an existing feature implementation.

**Recommended clarification:** require checks for module independence, Domain independence and backend slice independence as the migration lands. Add frontend import checks with the first workspace, including shared-library direction and feature entry points. Demonstrate the rules with representative violations rather than relying only on empty folders or naming conventions.

Document one representative use case end to end to show where responsibilities go; the frontend and backend need cohesive slices, not matching directory trees. Update stale examples and historical milestone labels when their Proposed ADRs are refined. In particular, closing registration is not automatic schedule creation, and a pending competitor report is not an effective standings result.

**Close in:** `m0-messaging`, `m0-web-shell`, then a bounded first H1 vertical. Keep their individual delivery status visible.

## Suggested documentation follow-up

1. Continue the already designed backend transition in `m0-messaging`; do not open a second competing migration proposal.
2. Refine ADR 0004's reuse and composition rules while retaining the modular monolith, protected domain and module data ownership.
3. Refine ADR 0011 with the frontend boundary matrix and feature ownership model, then create the planned `m0-web-shell` proposal.
4. Use the first H1 use case to validate the architectural pattern, including authority, history and effective versus provisional state.

The principal recommendation is therefore to **complete and make verifiable the vertical-slice architecture already proposed**, with a compatible frontend feature model. The project does not need a wholesale architecture restart.

## Review scope and validation

Reviewed current source files in `<repository>`, including uncommitted documentation; local branches and worktrees; current remote branches, open PRs and the relevant files on remote `main`; the completed frontend strategy chat; accepted specifications, proposed deltas and current architecture code via CodeGraph.

`openspec validate m0-messaging --strict` passed. This validates proposal structure, not implementation or runtime behaviour. No product tests or messaging spike were run for this review. No production code, existing ADR, proposal or original working-tree change was modified. This note and its input manifest are the only additions for this review.

The source checkout contains newer uncommitted documents than the review worktree. Source links intentionally point there; `inputs.json` records the exact local inputs used. Remote status is a snapshot of the checks performed on 7 November 2026.
