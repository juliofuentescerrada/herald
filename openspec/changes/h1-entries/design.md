## Context

`h1-registration-window` lets an owner open, close and reopen the registration of a published tournament; the `Tournament` aggregate (Tournaments module) owns its configuration, publication and window. Capacity, admission (automatic or manual) and entry kind are stored and validated but have no effect. `Herald.Registration` is an empty module with its schema and `DbContext`. No integration event exists yet: messaging was proven with probe modules only (`m0-messaging`), and the host routes nothing to Service Bus.

The maintainer decided on 11 November 2026:

- **Scope:** individual and team entries. A team entry is a guest team with a name; its players, roster, representative, freeze and lineups are a later slice.
- **Admission (D-06):** the whole behaviour of F-04 for operator entries: automatic and manual admission, waiting with its reason, the capacity queue, operator admission, cancellation and automatic promotion while open. Rejection with a private reason is not in this slice.
- **Guests (D-22):** organisation-scoped guests with stable identifiers, reusable across the organisation's tournaments, with a possible-duplicate warning and no merging.
- **Coordination (D-08):** Tournaments and Registration exchange integration events and keep a local projection of the other's facts; no synchronous call between modules.
- **Transport:** those events travel through Wolverine's durable local queues inside the host, not Service Bus (new ADR, refining ADR 0009).

**Approved for implementation by the maintainer on 11 November 2026** (gate 1.1): the rules EN-1 to EN-12, the assumptions A-1 to A-9 and the corrections V-1 and V-2 below, with the mockups supplied the same day (Visual input). Decisions recorded in the functional discovery (D-06, D-08, D-22, F-04) and ADR 0016.

Confirmed rules:

- **EN-1** Entries are added by the organisation's owner only, as guests (H1 operator entry). No self-service.
- **EN-2** Entering requires registration open (§5, CP-02 "closure prevents new applications"). Admitting and cancelling are possible while open or closed, before competition starts (always, in this slice).
- **EN-3** A guest has one active (waiting or admitted) entry per tournament (RI-01). A cancelled entry is final; entering the guest again creates a new entry at the back of the queue (RI-07: "reapplying does not retain priority").
- **EN-4** Admitted entries take one slot each, a team included; waiting and cancelled entries take none (RI-02, F-02 acceptance "a team of five players consumes one slot").
- **EN-5** Automatic admission admits while a slot is free, otherwise the entry waits with "capacity full". Manual admission makes every new entry wait with "admission pending" (F-04: distinguished, neither reserves a slot).
- **EN-6** The capacity queue orders "capacity full" entries by the time they started waiting, then by a sequence number (RI-04).
- **EN-7** The owner admits any waiting entry while a slot is free. Admitting a "capacity full" entry ahead of an earlier one requires a private reason (RI-04/RI-06: "departures from policy are recorded").
- **EN-8** A free slot admits the first "capacity full" entry only with automatic admission and registration open; it happens on cancellation, on capacity increase and on reopening. After closure only the owner admits (RI-05).
- **EN-9** Two writes cannot both take the last slot (RI-03).
- **EN-10** Tournaments rejects a capacity below the admitted entries and a change of entry kind or admission while active entries exist (F-02: "capacity cannot fall below admitted entries"; "changing entry kind after admissions requires … explicitly").
- **EN-11** A guest name is 1–80 characters after trimming. A possible duplicate is a guest of the same kind and organisation whose name is equal after removing accents, case and repeated spaces; it is reported, never merged (D-22).
- **EN-12** Mismatches produced by crossed changes (admitted above capacity, active entries of the other kind) are reported and block entering and admitting until the owner resolves them; nothing is removed or converted automatically.

## Goals / Non-Goals

**Goals:**

- Registration's first domain: guests and the field of a tournament, with admission rules enforced in one aggregate.
- The first integration events, with their contracts, routing, idempotency and tests; the pattern later modules follow.
- The owner can fill a tournament from the admin application and through the Admin API without Angular.

**Non-Goals:**

- Rosters, team players, representatives, roster freeze, lineups (D-17, D-18).
- Rejection with a private reason and permission to apply again; check-in (F-05); self-service (H2).
- Guest editing, retirement or an organisation guests page; verified account claims (H2).
- Announcements (D-26), pairings, start, competitive withdrawal, tournament cancellation, public reads and aliases on public pages, pilot API access.
- Service Bus routing; a module outside the host.

## Visual input

Screens: the tournament entries page (new), the published tournament page and the tournament list (modified).

References: [entries state review](../../../prototypes/frontend/entries-states.html) and its [22 states in 44 desktop/mobile captures](../../../docs/assets/mockups/entries/README.md), produced on 11 November 2026 from `.prompts/h1-entries-mockups.md` and supplied by the maintainer the same day. The visual input is complete; what they settle was adopted at gate 1.1.

States covered (each desktop and mobile):

| Screen | States |
|---|---|
| Tournament entries | `entries-empty-open`, `entries-not-open`, `entries-automatic-full`, `entries-manual-team`, `entries-closed`, `add-existing`, `add-new`, `add-duplicate`, `adding`, `add-failed`, `admit-unavailable`, `admit-out-of-order`, `cancel-confirm`, `cancel-confirm-closed`, `conflict`, `over-capacity`, `loading`, `failed` |
| Published tournament page | `entries-link`, `fields-locked`, `capacity-rejected` |
| Tournament list | `list-with-entries` |

What the captures settle, adopted here: a page titled "Entries · <title>" with "Back to configuration", the three lifecycle labels and a summary ("8 of 8 individual entries", the admission policy and waiting count, when counts and terms were last updated) beside the one primary action "Add player" or "Add team"; three groups with their counts in the headings, admitted, waiting with visible ordinals, reason and "Waiting since", cancelled with its time; actions beside each row on desktop and stacked on mobile; "Admit" unavailable with its reason under the row; the add panel in the page above the groups, choosing an existing guest or creating one, with the possible duplicate as an information notice, the existing guest's "Enter this player" as the primary action and "Create a new player anyway" secondary; the out-of-order admission and the cancellation as in-page confirmations, the private reason required before confirming; conflict, over-capacity, loading and failed feedback above the field, with no rows while loading or failed; the entries link as its own quiet summary between the publication notice and the form; the list's "Entries" as a secondary action beside "Edit configuration", none on drafts.

Corrections to apply when implementing (the captures are not regenerated for them):

| # | Capture | Correction |
|---|---|---|
| V-1 | `add-existing`, `add-duplicate` | A guest has no human reference such as "Guest 014": its identifier is opaque. Same-name guests are told apart by when they were created ("Existing player · created 10 November 2026") |
| V-2 | all entries states | The shell, rail and written date-times are the implemented ones (visual direction §9.3), not the prototype's banner and rail styling |

## Decisions

### D-1 Registration's domain: `Guest` and `Field`

- `Guest` (aggregate): `GuestId`, organisation, kind (`Player`, `Team`), name, normalised name (EN-11), created by/at. Repeats by identifier and content, as tournament creation does.
- `Field` (aggregate, one per tournament, identified by `TournamentId`): the projected entry terms of the tournament (registration state, capacity, entry kind, admission, terms revision) and its `Entry` entities. All admission rules (EN-3 to EN-9, EN-12) are methods of `Field`, so the last slot is decided in one aggregate under one concurrency token (EN-9) and promotion happens in the same transaction as the change that frees the slot.
- `Entry` (entity in `Field`): `EntryId` (client-supplied), `GuestId`, state (`Waiting`, `Admitted`, `Cancelled`), waiting reason (`CapacityFull`, `AdmissionPending`), waiting since and sequence, its own revision, and who/when for entering, admission (with the optional out-of-order reason) and cancellation.
- Domain events: `GuestCreated`, `GuestEntered`, `EntryAdmitted` (with how: automatic, owner, promotion), `EntryCancelled`.

The guest's kind is checked against the field's entry kind when entering; `Field` receives the guest's kind and name from the feature, which reads the `Guest` in the same module.

*Alternative considered:* one aggregate per entry with a count check in a query. Rejected: two entries could both see the last free slot (EN-9) unless a lock or a serialisable transaction were added; the field is small (≤ 256 admitted plus waiting).

*Alternative considered:* guests owned by a future People module. Rejected for now: no other module needs them in H1; Registration owns them until a slice needs them elsewhere, which then moves them with an ADR.

### D-2 Integration events, version 1

In `Herald.Contracts`, one namespace per publishing module:

- `Tournaments.TournamentEntryTermsChanged` (v1): organisation, tournament, tournament revision, registration state, capacity, entry kind, admission. Published by Tournaments in the same transaction as every effective change of a published tournament (publication, opening, closing, saves), as a full snapshot.
- `Registration.TournamentFieldChanged` (v1): organisation, tournament, field revision, active, admitted and waiting counts. Published by Registration with every effective change of a field.

Snapshots, not deltas: a consumer keeps the one with the highest revision and ignores older ones, so ordering, redelivery after the deduplication window and replays change nothing (idempotent by design, ADR 0008). Contracts are records of primitives and enumerations of their own, independent of either module's Domain.

*Alternative considered:* fine-grained events (`CapacityChanged`, `RegistrationOpened`, …). Rejected: the consumer would need all of them in order to rebuild the same four facts; a snapshot with a revision is simpler to keep correct.

### D-3 Each module keeps the other's facts

- Registration: the terms are state of `Field` (D-1). A field is created by the first terms event (publication); before that the tournament has no field and its entries read as not found.
- Tournaments: a `FieldCounts` table (tournament, field revision, active, admitted, waiting), read by saves for EN-10 and by the list and detail reads.

Each write uses its own module's projection only; neither module calls the other.

### D-4 Durable local queues (ADR 0016)

Wolverine routes a message to local handlers of the same application when one exists; with `UseDurableLocalQueues` those queues go through the shared store's outbox and inbox, so the state change and the event commit together and the receiver handles it once. The integration events are routed explicitly to named durable local queues (`tournaments`, `registration`) in each consuming module's entry point, and the Service Bus transport is not used for them. Tests and the end-to-end suite need no broker, which they lack.

[ADR 0016](../../../docs/adr/0016-integration-events-between-modules-through-durable-local-queues.md) records: durable local queues for integration events between modules of the host; Service Bus (ADR 0009) when a publisher or consumer leaves the process or an external consumer appears; the contract and idempotency rules of D-2 apply to both. ADR 0009 gains a note pointing to it (it is still Proposed, so it is refined rather than superseded).

*Alternative considered:* Service Bus as ADR 0009 states. Rejected by the maintainer: the end-to-end suite and the host's tests have no broker and the emulator needs a SQL Server container, too heavy for the local machine.

### D-5 Crossed changes

Both projections lag by the time a local queue takes to deliver (milliseconds in one process), and both write paths are owned by the same owner in H1. Three crossings are possible:

1. Capacity lowered in Tournaments while Registration admits under the old capacity → the field reports admitted above capacity (EN-12).
2. Entry kind changed in Tournaments while Registration accepts an entry of the old kind → the field reports entries of the other kind (EN-12).
3. Registration closed in Tournaments while Registration accepts an entry → the entry is valid: the closure takes effect for entries when Registration holds it.

No compensation removes or converts entries; the owner resolves a reported mismatch with the existing actions. The reads say when the counts or terms were last updated, so a lag is visible rather than hidden.

### D-6 API (Admin group)

| Operation | Method and path (under `/api/organisations/{organisationId}`) |
|---|---|
| `createGuest` | `PUT /guests/{guestId}` (kind, name, `confirmNew`) |
| `findGuests` | `GET /guests?kind=&name=` (prefix match on the normalised name, at most 20) |
| `getField` | `GET /tournaments/{tournamentId}/entries` |
| `enterGuest` | `PUT /tournaments/{tournamentId}/entries/{entryId}` (guest) |
| `admitEntry` | `POST /tournaments/{tournamentId}/entries/{entryId}/admission` (expected revision, reason) |
| `cancelEntry` | `POST /tournaments/{tournamentId}/entries/{entryId}/cancellation` (expected revision) |

Errors follow the existing problem shapes: 400 with field errors, 404 generic, 409 conflict with the current entry, and a 409 `possible-duplicate` problem listing the matching guests (identifier and name only). `TournamentDetails` and `TournamentSummary` gain `admittedEntries`, `waitingEntries` and `activeEntries`; saves gain the rule codes `below-admitted` and `locked-by-entries`.

### D-7 Admin application

A new `entries` feature with the route `tournaments/:tournamentId/entries`, which reads the tournament (`getTournament`) and the field (`getField`) and invalidates both after each write. The `tournaments` feature links to it by route only (features do not import each other); the form reads the new counts for EN-10's explanations. Add, admit with reason and cancel confirmation are in-page panels and dialogs built from `ui`'s existing controls; a control that does not exist yet (a dialog) goes to `ui` with its catalogue entry. Exact layout follows the mockups.

### D-8 Deduplication window

Kept at five minutes, now chosen rather than provisional: local queues redeliver only after a restart, and the snapshot consumers (D-2) are idempotent beyond any window.

### D-9 Durable history

Each entry keeps who and when for entering, admission (with how and the optional reason) and cancellation (ADR 0007: participation evidence with the effective change). A full event history of entries is not stored in this slice: no competitive result depends on entries yet (A-8).

### D-10 Tests

- Domain (no mocks): `Guest` and `Field`: every rule EN-3 to EN-9 and EN-12, promotion on each trigger, repeats, revisions, normalised names.
- Use cases and API against PostgreSQL: the `guest-entries` scenarios, the modified `tournament-setup` and `registration-window` scenarios, organisation isolation and generic 404s, and the events flowing between the two modules through the shared store, including an older snapshot arriving late.
- Vitest with `axe-core` for each Visual input state; end-to-end journeys 13 and 14.

## Assumptions

All accepted by the maintainer on 11 November 2026.

| # | Assumption | Why |
|---|---|---|
| A-1 | Admission (automatic/manual) cannot change while active entries exist | Switching would require re-reading every waiting entry's reason and possibly promoting; F-02 treats material changes after admission as explicit procedures |
| A-2 | With manual admission the owner admits pending entries in any order without a reason | Manual admission is itself the owner's decision; the reason is required only for skipping the capacity queue (RI-04) |
| A-3 | Entering is possible only while registration is open, whatever the admission policy | CP-02: closure prevents new applications |
| A-4 | Cancellation needs a confirmation but no reason, and is final for the entry | Reversible by entering the guest again (new entry, back of the queue); no competitive effect yet |
| A-5 | A guest team is a name only; its players and representative come with rosters | Scope chosen by the maintainer |
| A-6 | Guest names cannot be edited in this slice; the name is the alias, reviewed when it is typed | An editing flow needs alias-change rules for public pages, which do not exist yet |
| A-7 | Duplicate detection is exact equality after normalisation, not fuzzy matching | Predictable and explainable; D-22 asks for review, not automatic detection of every variant |
| A-8 | No history of entry changes beyond who/when/reason of each transition | Nothing competitive depends on entries yet; history starts where a result depends on it |
| A-9 | No integration event for single entries; only field counts are published | Tournaments needs counts only; Competition will define what it consumes when pairings exist |

## Risks / Trade-offs

- [Crossed changes produce a reported mismatch (D-5)] → Visible state, blocked admission, and resolution with existing actions; same owner on both sides in H1.
- [A lag between a write and the other module's view] → Milliseconds in one process; the owner's page invalidates both reads after each write; reads say when counts were last updated.
- [The field is one aggregate: concurrent writes on one tournament conflict internally] → Retried by the handler on a concurrency failure (Wolverine's retry), not surfaced to the owner unless the entry itself changed.
- [First integration events set the pattern for later modules] → ADR 0016 and messaging tests with the real modules, not only probes.
- [Guests with no editing] → A typo needs a new guest; acceptable for the pilot (A-6), revisited with public aliases.

## Migration Plan

Registration: migration `AddGuestsAndFields` (guests, fields, entries). Tournaments: migration `AddFieldCounts`. A tournament published before this change has no field until its next change publishes its terms (closing and reopening registration, or any save); no deployment exists yet (M4), so only local data is affected and no backfill is written. Rollback: drop the new tables; the tournament tables are unchanged. Wolverine's code, the admin OpenAPI document and the client are regenerated.

## Open Questions

None. Gate 1.1 was passed on 11 November 2026.

## Implementation record

### Contracts and messaging (tasks 2.1 and 2.2, 11 November 2026)

`Herald.Contracts/Tournaments/V1/TournamentEntryTermsChanged` and `Herald.Contracts/Registration/V1/TournamentFieldChanged`, with their own `RegistrationState`, `EntryKind` and `Admission` enumerations. The version is the namespace (`…V1`): a version 2 is a new type beside it, and the message type name Wolverine stores carries it. `TournamentFieldChanged` carries admitted and waiting counts; `Active` is derived from them.

Each consuming module's entry point routes the event it consumes to its own local queue (`RegistrationModule.Queue`, `TournamentsModule.Queue`), durable through the existing `UseDurableLocalQueues` policy; nothing else in the host changes, and the Service Bus transport receives no route. The deduplication window stays five minutes, its comment now pointing to ADR 0016.

`IntegrationEventRoutingTests` (host, 2 tests) checks that each event has one route, to its consumer's local queue, and that the queue is durable. The event crossing between the two real modules, and an older snapshot changing nothing, need the handlers: they are tested in 4.2 and 5.3. Wolverine's generated code does not change (no handler yet). Architecture 42 and messaging 6 tests pass; format check clean.

### Registration domain (tasks 3.1 and 3.2, 11 November 2026)

`Herald.Registration/Domain`: `Guest` (name rules, `Normalise`, `Repeats`), `Field` with its `Entry` entities, and the module's own `WriteResult`/`BrokenRule`, as in Tournaments. The domain has its own `RegistrationState`, `EntryKind` and `Admission` in `EntryTerms`: it does not reference `Herald.Contracts`, and the handler of 4.2 maps the contract onto them.

Details settled while implementing:

- `Field.Revision` grows once per effective change (entering, admitting, cancelling, newer terms), whatever number of entries the change admits; it is the revision `TournamentFieldChanged` carries. `TermsRevision` is the tournament revision the terms came from; terms with the same or a lower revision change nothing.
- An entry admitted on entering starts at revision 1; it grows when a waiting entry is admitted and when an entry is cancelled. A repeat is checked before the revision, as in Tournaments, so a repeated cancellation from an old page answers with the entry rather than a conflict.
- A promotion records the method `Promotion` and, as the admitting person, the owner whose cancellation freed the slot, or nobody when new terms freed it.
- `HasMismatch` covers both crossings of EN-12: `OverCapacityBy` and `HasKindMismatch`. A kind mismatch also stops promotion; cancelling stays possible in both.
- `TermsReceivedAt` records when the terms last arrived, for the reads to show (design D-5).
- An admission reason is optional except when skipping the capacity queue, trimmed, at most 500 characters.

`tests/Herald.Registration.Tests` (new project in the solution): 40 domain tests without mocks (`GuestTests` 10, `FieldTests` 30) covering every item of task 3.2. Architecture 42 tests pass; format check clean.
