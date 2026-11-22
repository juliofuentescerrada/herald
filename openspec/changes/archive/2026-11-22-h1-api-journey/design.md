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

Journey 30 is a Playwright test whose client uses only the `request` fixture (the owner's part is in the browser, N-9): it obtains an application token from the fake provider, follows `docs/api/individual-league.md` (create, publish, open, enter four players, close, generate and publish the schedule, start, record six results, finalise), drops one response on purpose and recovers it through the receipt, then reads the standings and compares them with the admin page's.

## Visual input

Not applicable.

## Assumptions for review

- **A-1** Receipts store no request body, only its hash; the resource identifier and revision are enough to reread the state.

## Implementation notes

- **N-1** The receipt step is in two parts (`Herald.ModuleHosting/Receipts.cs`): the host's organisation step looks the receipt up before the endpoint, and `ReceiptPolicy` adds `Receipts.Record` to every organisation-scoped admin mutation's generated code after the handler and before the transaction's last save, so the receipt commits with the effect. A rejection's receipt commits in that same transaction, which holds no other change, rather than one of its own (D-1).
- **N-2** A receipt keeps the response it answered with (status, body and, for a creation, its location), so a repeat returns the first response; it keeps no request body (A-1), only a SHA-256 of the operation, path, query and body bytes.
- **N-3** Creating an organisation has no organisation to keep a receipt in; it stays idempotent through its client-chosen identifier, as before. It is the one admin mutation without receipts.
- **N-4** An application reads only the receipts of its own operations, and a repeat of another actor's operation answers it as reused; a person reads the organisation's. The receipt endpoint is in the `read` group.
- **N-5** Two simultaneous requests with one identity: the second loses to the receipt's primary key, its transaction rolls back, and it answers with the first one's receipt. An identity another organisation used loses to the same key and answers `operation-reused`, revealing nothing more.
- **N-6** Deleting a draft removes the receipts of that tournament; the deletion's own receipt is recorded after, so a repeated deletion still answers 204. A creation's receipt takes its tournament from the body.

- **N-7** Business errors are problem types, listed per response as `x-problem-types` in the OpenAPI documents: each endpoint declares its own with `[ProblemTypes]`, and the documents add those every organisation-scoped endpoint shares (`organisation-not-available`, `operation-not-granted`, `operation-reused`). Validation rules stay in the 400 response's `errors`.
- **N-8** The identifier review (D-3) found two gaps, both fixed compatibly: creating a tournament or an organisation with a reused identifier and other content answered a 409 without a type; they now answer `tournament-identifier-reused` and `organisation-identifier-reused`. The entry kind travels in a tournament's `configuration` and a field's `terms`; no identifier needed renaming.

- **N-9** Journey 30 has the owner create the organisation, grant the client every group and read the final Standings page in the browser, because those are a person's (organisation creation and grants are people-only); the league itself runs through the `request` fixture with the pilot application's client-credentials token, following `docs/api/individual-league.md`. Writing it found that the admin client's identity header must reuse an `operationId` the body carries (`operation.ts`).

- **N-10** A rejection is recorded and repeated like any outcome, so the admin application keys a body-carried identity on its content: a withdrawal or disqualification on the schedule revision and reason (as results and corrections already do), and a generation starts a new identity after a rejection. The worked example says a rejected operation is retried with a new identity. A rejection without a problem type records `about:blank`; a validation problem records `validation`.
- **N-11** The OpenAPI documents describe the optional `Operation-Id` header on every organisation-scoped mutation; the generated Angular client does not expose header parameters, so the admin application sends it from its interceptor.

## Risks / Trade-offs

- [One more row per mutation] → small, organisation-owned and indexed by operation identity; retention follows the tournament.

## Verification

Full run on 22 November 2026, after the herald-reviewer's findings were resolved: `scripts/check all` passed (rules, spec coverage, format, build, Wolverine code and OpenAPI client current, .NET tests, web lint, boundaries, tests, SSR isolation and build); the end-to-end suite passed, 30 journeys with journey 30; the test scripts passed, 21 with `seeded-api-journey` (two screenshots and fourteen request and response captures).

H1's exit criteria (roadmap) against batch 3, with this slice its last: UJ-01–03 and UJ-06–08 are covered by journeys 10–30, UJ-08 by journey 30; four entries produce six matches (journeys 22 and 30); results are retry-safe through operation identities and receipts for every organisation-scoped mutation; private data stays within its organisation and grant (organisation-isolation, pilot-access, receipts read per organisation and actor); final standings follow a review of the current results revision (finalisation). The criteria themselves do not change, so the roadmap is not edited (herald-docs); the batch's status is its issues.

## Review

The herald-reviewer reviewed the diff on 22 November 2026. Resolved: problem types recorded for untyped problems (N-10); a repeated creation's location (N-2); the actor on replay (N-4); another organisation's identity (N-5); the `Operation-Id` header in the documents (N-11); the admin application's identities after a rejection and the worked example's rule (N-10); a test for simultaneous repeats; the receipt path in the proposal, D-4's wording (N-9) and the team example's parameter names. Left for the maintainer: **Q3** the description lists business errors as problem types per response (N-7), while 400 rule codes (such as `match: not-started`) stay in each response's `errors` and are not listed per operation. Confirm, or list each operation's rule codes as well.

