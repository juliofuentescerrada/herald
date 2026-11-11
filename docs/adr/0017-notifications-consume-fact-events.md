# 0017. Notifications consume fact events and live in their own module

- Status: Proposed
- Date: 2026-11-11

## Context

F-10 sets notices out by horizon: in H1 an operator-visible change log with no participant delivery (D-26, proposed), in H2 in-app notices, and in H5 email (roadmap H5). Each notice names the tournament and the reason, links to the current state, does not appear twice for the same fact, and a failed delivery never reverses admission or resolution.

Until now no architecture decision has covered notices. The only integration events are revisioned state snapshots (ADR 0016), such as `TournamentFieldChanged`, which carries the field's counts. A snapshot keeps another module's copy of the state in step, but it cannot say "this entry was promoted from the queue" or name the people affected. Rebuilding a fact by comparing snapshots loses the subject, the actor and the reason. If modules only publish snapshots, every module would need to be reopened when H2 arrives.

ADR 0007 already requires owning modules to persist actor, time and reason with each effective change. In `h1-entries`, Registration's `Entry` records who entered it and when, how and by whom it was admitted, the private admission reason, its waiting start and who cancelled it, under a per-entry revision.

## Decision

- **A `Notifications` module, consumer only.** It subscribes to `Herald.Contracts` and nothing calls it. It owns recipients, channel preferences (operational notices kept separate from promotional ones), the in-app inbox, the delivery record and deduplication. The module is created when its first consumer is built (H2), not before.
- **Two kinds of integration event.** *State events* stay full revisioned snapshots for keeping state in step (ADR 0016). *Fact events* report one effective change of a subject that F-10 lists: admission or promotion, cancellation, material change, published pairing, requested confirmation, dispute resolution and revised final result. A fact event carries the organisation, the tournament, the subject's identifier, the subject's revision after the change, the actor (or none for an automatic change), the time and a reason code. Private free text, such as an admission reason, stays out of the event.
- **Data, not messages.** Events carry identifiers and codes. Wording, language, links and channel formatting belong to Notifications.
- **Deduplication key.** One notice per fact, recipient and channel, keyed on subject, subject revision, recipient and channel. Redelivery and replay therefore produce no visible duplicates.
- **Delivery never feeds back.** Notifications publishes nothing that changes competitive state; a failed or bounced delivery is recorded only in its own module.
- **Record now, publish when consumed.** A fact event is not published until a consumer exists. Every change that introduces a notifiable fact persists it under ADR 0007 so that publishing it later is a code change only, with no data migration, and records the fact in the inventory below.

### Inventory of notifiable facts

| Fact | Owner | Recorded by | Published |
|---|---|---|---|
| Entry admitted on entering, by hand or by promotion from the queue (`WaitingSince` set) | Registration | `h1-entries`: `Entry` state, method, actor, time, revision | Not yet |
| Entry cancelled | Registration | `h1-entries`: `Entry` actor, time, revision | Not yet |

Each change that adds a fact adds a row, including H1's tournament publication, material changes and registration opening or closing when their owning change confirms what is recorded.

## Alternatives considered

- **Notices derived from snapshots:** no new contracts, but a consumer cannot recover the subject, actor or reason, and every publishing module still has to change.
- **Each module sends its own notices:** no new module, but recipients, preferences, templates and email providers would spread across every module, and Herald would duplicate deduplication logic.
- **Publish fact events now, before any consumer:** proves the contracts early, but adds contracts, routing and tests no one exercises, and contracts frozen before their consumer is known are more likely to need versioning.

## Consequences

- Positive: notices arrive in H2 and H5 by adding one consumer module; the publishing modules gain only fact events, whose data they already record; the H1 change log can be built from the same facts.
- Negative: two kinds of integration event to explain and review; the inventory must be kept current by each change; a fact kept only as current state can be overwritten by a later change (a re-admission would overwrite `Entry`'s admission fields), so such a change must add history rows before the fact can be published faithfully.
- Follow-ups: decide where guest contact details live and their privacy (email is never identity, ADR 0014) before H5; choose the email provider and check its licence and cost (ADR 0009) before H5; confirm the H1 change log (D-26) against this inventory; review fact events with their first consumer.

Direction proposed and chosen by the maintainer on 11 November 2026 during `ui-feedback-and-layout`; no change implements it yet.
