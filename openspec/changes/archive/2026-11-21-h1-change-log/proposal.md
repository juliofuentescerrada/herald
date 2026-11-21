## Status

**Proposed in H1 batch 3's proposals pull request, 15 November 2026.** The rules come from the batch's decision session of the same day, recorded in the functional discovery (F-10, §5.2; §15 rows D-26 and D-27). It depends on `h1-tournament-cancel-and-dates`, whose facts it records. Merging the proposals pull request approves this change (ADR 0018); task 1.1 records that approval.

**Approved for implementation on 16 November 2026**, when the maintainer merged the batch 3 proposals pull request (#74), with the review answers below (ADR 0018). The review asked for no change to this proposal.

**Review answers, 15 November 2026 (#74):** the maintainer accepted Q1 and Q2 (other modules' reasons linked, not copied; results only as revised final standings) and the prototypes as they are.

## Why

Changes that matter to competitors (an admission, a published schedule, a postponed start, a cancellation, revised final standings) leave no trace the organiser can point to when telling guests. D-26, confirmed on 15 November 2026, gives H1 an operator-visible change log and shows the material part on the public page. AT-09 and AT-11 check it.

## What Changes

- **Change log (D-26, F-10):** each tournament has a change log, newest first, with what changed, who, when, the revision and, where the owner gave one, the reason. It records: entries admitted and cancelled (including by the tournament's cancellation); schedules published and withdrawn; the tournament published; material changes after publication — game or variant, competition system and rules, participation structure (entry kind, roster bounds, active players), venue, the dates with old and new values and the reference time zone, and visibility; cancellation; finalisation, reopening and each revised final revision.
- **Who sees it:** the owner sees every entry. The public or unlisted page (`h1-public-read`) shows only the material changes — publication, dates, venue, rules, structure, cancellation and final revisions — never admissions, private reasons or contacts. A private tournament's log stays private.
- **No delivery claim:** Herald records the change; the organiser tells guests through their own channels. There is no inbox, email or "read" state.
- **Sources (ADR 0017):** Tournaments records its own facts as they happen. Registration and Competition publish fact events for admissions, cancellations, schedule publications and withdrawals (new); finalisation and reopening already are (`h1-finalisation`). Tournaments consumes them into the log, idempotently by subject and revision. Fact events carry no private text, so a reason given in another module is not copied; the entry links to where it is shown (Q1).
- **Admin application:** the tournament navigation gains a "Change log" page: a list with a filter by kind (entries, schedule, tournament, results), each row with an icon for its kind, the sentence, who and when, and the old → new values for a material change.
- **Notifiable facts:** this change is the first consumer of F-10's notifiable facts; it publishes `EntryAdmitted`, `EntryCancelled`, `SchedulePublished` and `ScheduleWithdrawn` v1 and adds them to ADR 0017's inventory.
- One end-to-end journey (27): admissions, the published schedule, a postponed start with old and new times and the cancellation, each with who, when and why.

Out of scope: participant notices (H2), email (H5), editing or deleting log entries, results recorded or corrected during play (shown on the schedule and the match history, not in the log; Q2).

## Decision rows

| Row | Status | Used for |
|---|---|---|
| D-26 H1 announcements | Confirmed for H1 15 Nov 2026 | Content, visibility, no delivery claim |
| D-27 Lifecycle/visibility/deadlines | §5.2 confirmed 15 Nov 2026 | Old/new dates and visibility changes recorded |

## Open questions for the review

- **Q1** Reasons given in Registration or Competition (a skipped queue, a withdrawn schedule) stay there: the log links to the entry or the schedule history instead of copying them, because fact events carry no private text (ADR 0017). Confirm, or allow a private reason field in fact events consumed inside the host.
- **Q2** The log lists results only as revised final standings (F-10's "revised final results"), not every result or correction during play, which the schedule and match history already show. Confirm, or also log corrections while running.

## Screens

Prototypes in `prototypes/frontend/correct-close-open-states.html` (design.md, Visual input):

- **Change log page (new):** populated; filtered; a material change with old and new values; empty (draft just published); load failure.
- **Tournament navigation (modified):** "Change log".

## Capabilities

### New Capabilities

- `change-log`: the tournament's change log and its public part.

### Modified Capabilities

- `end-to-end-journeys`: journey 27.

## Impact

- `Herald.Tournaments`: `ChangeLogEntry` table; records its own facts in the same transaction; consumers of the fact events; query `GetChangeLog` (owner) and a public projection for `h1-public-read`; migration.
- `Herald.Contracts`: `EntryAdmitted`, `EntryCancelled`, `SchedulePublished`, `ScheduleWithdrawn` v1 (subject, subject revision, actor, time, reason code).
- `Herald.Registration` and `Herald.Competition`: publish those fact events through the outbox.
- Admin OpenAPI document and client; Wolverine's generated code; admin `tournaments` feature (change log page) and the tournament navigation.
- `e2e/`: journey 27 and its test script; `tools/Herald.Seed`: tournaments with a populated change log. Docs: ADR 0017 inventory; visual direction §9.3.
