## Context

See proposal.md (Why). `RecordResult` and `GenerateDraft` take an operation identity in their body; other commands rely on the expected revision, so a repeat after a lost response conflicts instead of returning the original. Each module has its own schema and DbContext (ADR 0004, 0007).

## Goals / Non-Goals

**Goals:**

- A client that lost a response can find out what happened and retry safely, for every mutation.

**Non-Goals:**

- Asynchronous operations, webhooks, SDKs.

## Decisions

### D-1 Receipts live with their effect

A `Receipt(operationId, caller, operation, contentHash, outcome, revision?, resource?, problemType?, at)` entity, defined once in `Herald.ModuleHosting` and mapped by each module's DbContext into its schema, organisation-owned. A Wolverine middleware for HTTP commands reads `Operation-Id`, looks the receipt up first (same identity and hash: return it; different hash: 409 `operation-reused`) and, after the handler, adds the receipt to the same DbContext before the transaction commits. A rejection writes its receipt in its own transaction.

### D-2 One lookup across modules

Each module registers an `IReceiptSource`; the receipt endpoint asks them in turn within the organisation context and returns the first match. Operation identities are UUIDs, so a collision across modules is not a concern.

### D-3 Identifier review

A test reads the admin OpenAPI document and fails on a property named `id` without a qualifying schema, a `playerId` on a pairing or result, or an individual operation whose request requires a roster or lineup field. Gaps are fixed by adding the qualified name and keeping the old one until the next breaking version.

### D-4 The journey

Journey 30 is a Playwright test with only the `request` fixture: it obtains an application token from the fake provider, follows `docs/api/individual-league.md` (create, publish, open, enter four players, close, generate and publish the schedule, start, record six results, finalise), drops one response on purpose and recovers it through the receipt, then reads the standings and compares them with the admin page's.

## Visual input

Not applicable.

## Assumptions for review

- **A-1** Receipts store no request body, only its hash; the resource identifier and revision are enough to reread the state.

## Risks / Trade-offs

- [One more row per mutation] → small, organisation-owned and indexed by operation identity; retention follows the tournament.
