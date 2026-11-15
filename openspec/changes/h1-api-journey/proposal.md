## Status

**Proposed in H1 batch 3's proposals pull request, 15 November 2026.** The rules come from the batch's decision session of the same day, recorded in the functional discovery (§13.1, UJ-08, F-11; §15 rows D-02, D-12 and D-15). The pilot grants it relies on are split out to `h1-pilot-access` (its Q1). It depends on `h1-finalisation`, `h1-change-log`, `h1-public-read` and `h1-pilot-access`. Merging the proposals pull request approves this change (ADR 0018); task 1.1 records that approval.

## Why

Some mutations accept an operation identity, others only an expected revision, and none lets a client that lost a response ask what happened. D-02 and D-15, confirmed on 15 November 2026, make queryable receipts and API-06's identifiers the H1 public contract. AT-14 and UJ-08 run a whole league without Angular.

## What Changes

- **Operation identity everywhere (API-04):** every admin mutation accepts an operation identity (the `Operation-Id` header, a UUID; commands that already carry one in their body keep it and must match). The same identity with the same content returns the original outcome without a second effect; with different content it is a conflict (`operation-reused`). Mutations without one keep working for the admin application, which sends one from now on.
- **Receipts (API-08):** each module records a receipt for every mutation that carried an operation identity, in the transaction of its effect: operation, caller (person or application grant), operation name, a hash of the content, outcome (`applied` with the resulting revision and resource, or `rejected` with the problem type), time. `GET /api/admin/organisations/{organisation}/receipts/{operationId}` returns it to callers of that organisation; an unknown identity is `not-found`, which means nothing was applied and the same request may be retried. Receipts are kept while the tournament exists; deleting a draft removes its receipts.
- **`received` (Q1):** H1's effects complete within the request, so a receipt reads `applied` or `rejected`; `received` is reserved in the contract for asynchronous operations that later horizons add.
- **Identity contract (API-06, D-15):** the admin OpenAPI document is reviewed so that tournament, entry, guest player, team, roster and lineup identifiers are distinct, named for what they identify (`entryId`, `playerId` only for a guest player, never for a side), pairings and results reference entries, every tournament and entry response carries the entry kind, and no individual operation requires a team-only field. Any gap found is fixed compatibly.
- **Documented contract (API-01, API-07):** the API description gains, per operation, its business errors (problem types), and a worked example of an individual and a direct-team league in `docs/api/` that the journey follows step by step.
- **Notifiable facts (ADR 0017):** none.
- One end-to-end journey (30): an independent client runs a four-player league through the API with a pilot grant, repeats a result after losing the response and gets the original receipt, and reads the same final standings as the admin application.

Out of scope: webhooks and subscriptions (H5), SDKs, compatibility and retirement policy values (fixed during the pilot, API-09), rate limits (H5).

## Decision rows

| Row | Status | Used for |
|---|---|---|
| D-02 External result granularity | Confirmed for H1 15 Nov 2026 | Queryable receipts, kept while the tournament exists |
| D-15 Competitive identity contract | Confirmed for H1 15 Nov 2026 | API-06's identifiers as the public contract |
| D-12 Pilot result-source authority | Confirmed for H1 15 Nov 2026 | The journey's client uses a grant (`h1-pilot-access`) |

## Open questions for the review

- **Q1** H1 never reports `received`, because every effect completes in the request; an unknown identity reads `not-found`, which is safe to retry. Confirm, or record a `received` receipt before each effect (one more write per request).
- **Q2** The operation identity goes in an `Operation-Id` header on every mutation, so request bodies do not change. Confirm, or put it in each body as `RecordResult` does today.

## Screens

Not applicable: the change adds no screen. The admin application sends an operation identity with its mutations without visible change.

## Capabilities

### New Capabilities

- `operation-receipts`: operation identities and queryable receipts.

### Modified Capabilities

- `api-description`: business errors, identifiers and worked examples.
- `end-to-end-journeys`: journey 30.

## Impact

- `Herald.ModuleHosting`: the `Operation-Id` filter, the receipt entity each module maps into its schema, `IReceiptSource` per module and the receipt endpoint.
- Every module: a `Receipts` table and migration; commands record receipts; repeats return them.
- `Herald.Host`: OpenAPI problem types per operation.
- Admin OpenAPI document and client; Wolverine's generated code; admin `api-client` sends `Operation-Id` on mutations.
- `docs/api/`: worked individual and team examples. `e2e/`: journey 30 (an API-only journey); `tools/Herald.Seed`: unchanged.
