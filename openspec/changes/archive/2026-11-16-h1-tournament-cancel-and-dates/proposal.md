## Status

**Proposed in H1 batch 3's proposals pull request, 15 November 2026.** The rules come from the batch's decision session of the same day, recorded in the functional discovery (§5.1 rows "Cancel before start", "Cancel after start" and "Archive/unarchive", §5.2, F-02; §15 row D-27). It depends on `h1-finalisation` (Q1). Merging the proposals pull request approves this change (ADR 0018); task 1.1 records that approval.

**Approved for implementation on 16 November 2026**, when the maintainer merged the batch 3 proposals pull request (#74), with the review answers below (ADR 0018). The review asked for no change to this proposal.

**Review answers, 15 November 2026 (#74):** the maintainer accepted Q1 to Q3 (after `h1-finalisation`; cancellation reaches Registration and Competition by event; dates of a published tournament only through "Change dates") and the prototypes as they are.

## Why

A tournament can only move forward: it cannot be called off, its dates cannot be postponed safely once people are entered, finished tournaments clutter the list for ever and an abandoned draft cannot be removed. D-27, confirmed on 15 November 2026, settles cancellation, archiving, draft deletion and date changes. AT-09 and AT-11 test them.

## What Changes

- **Cancel before start (§5.1):** the owner cancels a published tournament that has not started with a required reason of at most 500 characters, private to the organisation. Registration closes; every waiting or admitted entry is cancelled with the cause "tournament cancelled", keeping its identity and history; a published schedule is withdrawn and a draft discarded. Nothing is promoted.
- **Cancel after start (§5.1, D-25):** the owner cancels a running competition with a required reason. Effective results, recorded play and lineup evidence stay; every unresolved match becomes "voided: tournament cancelled", with no points; the standings stay as they were and declare no champion and no final ranking. A finalised competition is not cancelled (it is already terminal).
- **Final:** cancellation cannot be undone; a replacement is a new tournament. After it, every write to the tournament (configuration, registration, entries, check-in, rosters, schedule, results, lineups, departures, corrections) is rejected, including delayed API requests.
- **Archive and unarchive (§5.1):** only a finalised or cancelled tournament may be archived. Archiving removes it from the default tournament list without deleting anything or changing visibility; the list gains "Show archived". Unarchiving restores it with its state. Reopening a finalised competition requires unarchiving first.
- **Delete a draft (directed 12 Nov, confirmed 15 Nov 2026):** a draft tournament, never published and so without entries, may be deleted permanently after a confirmation. Nothing of it remains.
- **Change dates (§5.2):** once published and before the competition starts, the owner changes the registration opening, registration closure and planned start through "Change dates": each date shows its current value, the owner selects which to change, sees old and new side by side with the reference time zone, and only the selected ones change, keeping opening before closure and closure not after start. A frozen roster and check-ins stay as they are. While a tournament is a draft its dates stay in the configuration form; after start they are fixed (H1 has no match times).
- **Admin application:** the tournament's configuration page gains, in its summary actions, "Change dates" (before start), "Cancel tournament" (danger, with reason and the consequence in words), "Archive"/"Unarchive" (terminal only) and, for a draft, "Delete draft" (danger). A cancelled tournament shows "Cancelled" in its lifecycle labels and a read-only notice with when and by whom; its Schedule shows voided matches. The tournament list hides archived tournaments unless "Show archived" is chosen.
- **Notifiable facts (ADR 0017):** tournament cancelled (before or after start), dates changed (old and new values). Published as integration events, consumed by Registration and Competition (cancellation) and by `h1-change-log`.
- One end-to-end journey (26): postpone a start through the preview, cancel a running tournament, see voided matches and no champion, archive it.

Out of scope: deleting a published tournament, restoring a cancelled one, scheduled registration (H2), match times, minimum-field cancellation (H2, D-36).

## Decision rows

| Row | Status | Used for |
|---|---|---|
| D-27 Lifecycle/visibility/deadlines | §5.1 cancellation and archive rows, draft deletion and §5.2 dates confirmed 15 Nov 2026 | Every rule above |
| D-25 Terminal outcomes | Confirmed 15 Nov 2026 | Voided: tournament cancelled, no awards |
| D-08 Lifecycle ownership | Confirmed ownership | Tournaments cancels; Registration and Competition apply it |

## Open questions for the review

- **Q1** The roadmap had this slice beside `h1-safe-corrections` if it changed only Tournaments' model. Voiding unresolved matches and rejecting late writes need a cancelled state in Competition, so it runs after `h1-finalisation` (both change Competition's model). Confirm the order corrections → finalisation → cancel-and-dates.
- **Q2** Cancellation reaches Registration and Competition through an integration event, so a write accepted by them in the moment before the event arrives is kept and then treated like any earlier result. Confirm, or require each competitive write to check a cancellation flag synchronously (a cross-module read the architecture avoids).
- **Q3** Dates of a published tournament change only through "Change dates", including while no entries exist. Confirm, or keep them in the configuration form until the first entry.

## Screens

Prototypes in `prototypes/frontend/correct-close-open-states.html` (design.md, Visual input):

- **Tournament configuration page (modified):** change dates dialog (preview, invalid order, after start); cancel confirmation before and after start; cancelled tournament; archive and unarchive; delete draft confirmation.
- **Tournament list (modified):** archived hidden, "Show archived".
- **Schedule page (modified):** voided matches of a cancelled competition.
- **Standings page (modified):** cancelled, no champion.

## Capabilities

### New Capabilities

- `tournament-lifecycle`: cancellation, archive, draft deletion and date changes.

### Modified Capabilities

- `guest-entries`: entries cancelled by the tournament's cancellation.
- `round-robin-pairings`: cancellation withdraws the schedule and voids unresolved matches.
- `end-to-end-journeys`: journey 26.

## Impact

- `Herald.Tournaments`: competition state cancelled, archived flag, deletion, `ChangeDates` with old/new values; features `CancelTournament`, `ArchiveTournament`, `UnarchiveTournament`, `DeleteDraft`, `ChangeDates`; list filter; migration.
- `Herald.Contracts`: `TournamentCancelled` v1 (before or after start, actor, time; no reason text), `TournamentArchiveChanged` v1; the entry terms snapshot already carries the window.
- `Herald.Registration`: cancels active entries on `TournamentCancelled`; rejects writes after it. `Herald.Competition`: withdraws the publication or voids unresolved matches; rejects writes; tracks archive for reopening; migration.
- Admin OpenAPI document and client; Wolverine's generated code; admin `tournaments`, `schedule` and `standings` features.
- `e2e/`: journey 26 and its test script; `tools/Herald.Seed`: a cancelled running tournament, an archived finalised one and a draft. Docs: visual direction §9.3; ADR 0017 inventory.
