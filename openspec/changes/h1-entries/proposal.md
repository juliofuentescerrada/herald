## Status

**Approved for implementation on 11 November 2026** (gate 1.1). The maintainer chose the scope (individual and team entries, a team being a name; the whole admission behaviour of D-06 without rejection; organisation-scoped guests, D-22; coordination through integration events with a local projection on each side, D-08, carried by durable local queues, ADR 0016), supplied the mockups ([entries states](../../../docs/assets/mockups/entries/README.md)) and approved the rules EN-1 to EN-12, the assumptions A-1 to A-9 and the corrections V-1 and V-2 of `design.md`, all the same day.

## Why

A tournament's registration can now be opened, but nothing can enter it: the field of every tournament is empty and capacity, admission and entry kind are settings with no effect. Entries are the next step of UJ-02 and UJ-03 (step 3, "open registration and add guest players"), and the first one that needs two modules: Tournaments owns the tournament and its window, Registration owns admission (D-08).

## What Changes

- **Guests (D-22):** an owner creates guest players and guest teams in the organisation, each with a stable identifier and a name that is the alias shown for it. A guest is reused across the organisation's tournaments. Adding a guest whose name matches an existing guest of the same kind warns about a possible duplicate and offers the existing one; nothing is ever merged. No sign-in, contact details or account claim.
- **Entries (F-04, RI-01 to RI-07, D-06):** while registration is open, an owner enters a guest of the tournament's entry kind. One active entry per guest and tournament. With automatic admission an entry is admitted while a slot is free and otherwise waits with "capacity full"; with manual admission it waits with "admission pending". Waiting entries take no slot. Two additions cannot both take the last slot.
- An owner admits a waiting entry within capacity, while registration is open or closed; admitting one that is behind another "capacity full" entry records a reason. An owner cancels an entry; a cancelled admitted entry frees its slot, and with automatic admission and registration open the first entry waiting for capacity is admitted. After closure nothing is promoted automatically. A team takes one slot.
- **Tournament terms reach entries:** raising the capacity or reopening registration with automatic admission admits waiting entries into the free slots.
- **Tournaments keeps its rules with entries:** capacity cannot fall below the admitted entries; entry kind and admission cannot change while active entries exist.
- **First integration events (ADR 0008):** Tournaments publishes the entry terms of a tournament (registration state, capacity, entry kind, admission) whenever they change; Registration publishes the count of active and admitted entries. Each module keeps the other's facts in a local projection. They travel through Wolverine's durable local queues inside the host; Service Bus waits for a module or consumer outside the process. A new ADR records this and refines ADR 0009.
- **Admin application:** a new entries page per published tournament (counts, admitted, waiting in order with its reason, cancelled; add a player or team; admit; cancel), reachable from the tournament page and the list; the tournament form explains the locked entry kind and admission and the capacity limit; the list shows the admitted count.
- Two end-to-end journeys: an individual tournament with automatic admission filling up, waiting and promoting; a team tournament with manual admission, a possible duplicate and an admission.
- Documents: D-06 and D-22 record what this slice confirms; F-04 records the rules of this slice; D-08 records the coordination; the visual direction's inventory gains the entries states.

Out of scope, each waiting for the slice that needs it: team rosters, players of a team, representatives, roster freeze and lineups (D-17, D-18); rejection with a private reason and the permission to apply again; check-in (F-05); self-service applications and competitor accounts (H2); editing or retiring a guest and an organisation guests page; announcements to entrants (D-26); pairings, start, withdrawal after start; cancellation of the tournament; the public page and public aliases; pilot API access (D-12).

## Capabilities

### New Capabilities

- `guest-entries`: organisation guests and duplicate warnings; entries of a tournament with open registration; admission, waiting, cancellation and promotion; revision-aware writes; the admin entries page.

### Modified Capabilities

- `tournament-setup`: capacity cannot fall below admitted entries, and entry kind and admission are locked while active entries exist; the read model and the list report admitted and waiting entries.
- `registration-window`: opening and closing keep existing entries as they are; reopening with automatic admission admits waiting entries into free slots.
- `transactional-messaging`: integration events between modules of the host travel through durable local queues; the deduplication window is chosen for them.
- `end-to-end-journeys`: journeys 13 and 14.

## Impact

- `Herald.Registration`: first domain (`Guest`, the tournament's `Field` with its entries), features, persistence, migration, handlers of Tournaments' events; organisation filters as in Tournaments.
- `Herald.Tournaments`: publishes the entry terms, consumes entry counts, new save rules, read model fields; migration for the projection.
- `Herald.Contracts`: the two integration events, version 1.
- `Herald.ModuleHosting`/host: local routing of integration events; deduplication window.
- Admin OpenAPI document and generated client; Wolverine's generated code.
- Admin application: `entries` feature (new), `tournaments` feature (form rules, links, list counts).
- `e2e/`: journeys 13 and 14. Docs: functional discovery, a new ADR, ADR 0009 note, visual direction §9.3, roadmap, README, CLAUDE.md, `openspec/config.yaml`.
