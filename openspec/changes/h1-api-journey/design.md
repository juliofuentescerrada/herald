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

## Implementation notes

- **N-1** The receipt step is in two parts (`Herald.ModuleHosting/Receipts.cs`): the host's organisation step looks the receipt up before the endpoint, and `ReceiptPolicy` adds `Receipts.Record` to every organisation-scoped admin mutation's generated code after the handler and before the transaction's last save, so the receipt commits with the effect. A rejection's receipt commits in that same transaction, which holds no other change, rather than one of its own (D-1).
- **N-2** A receipt keeps the response it answered with (status and body), so a repeat returns exactly the first response; it keeps no request body (A-1), only a SHA-256 of the operation, path, query and body bytes.
- **N-3** Creating an organisation has no organisation to keep a receipt in; it stays idempotent through its client-chosen identifier, as before. It is the one admin mutation without receipts.
- **N-4** An application reads only the receipts of its own operations; a person reads the organisation's. The receipt endpoint is in the `read` group.
- **N-5** Two simultaneous requests with one identity: the second loses to the receipt's primary key, its transaction rolls back, and it answers with the first one's receipt.
- **N-6** Deleting a draft removes the receipts of that tournament; the deletion's own receipt is recorded after, so a repeated deletion still answers 204. A creation's receipt takes its tournament from the body.

- **N-7** Business errors are problem types, listed per response as `x-problem-types` in the OpenAPI documents: each endpoint declares its own with `[ProblemTypes]`, and the documents add those every organisation-scoped endpoint shares (`organisation-not-available`, `operation-not-granted`, `operation-reused`). Validation rules stay in the 400 response's `errors`.
- **N-8** The identifier review (D-3) found two gaps, both fixed compatibly: creating a tournament or an organisation with a reused identifier and other content answered a 409 without a type; they now answer `tournament-identifier-reused` and `organisation-identifier-reused`. The entry kind travels in a tournament's `configuration` and a field's `terms`; no identifier needed renaming.

- **N-9** Journey 30 has the owner create the organisation, grant the client every group and read the final Standings page in the browser, because those are a person's (organisation creation and grants are people-only); the league itself runs through the `request` fixture with the pilot application's client-credentials token, following `docs/api/individual-league.md`. Writing it found that the admin client's identity header must reuse an `operationId` the body carries (`operation.ts`).

## Risks / Trade-offs

- [One more row per mutation] → small, organisation-owned and indexed by operation identity; retention follows the tournament.
