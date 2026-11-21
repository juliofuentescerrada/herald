## Context

See proposal.md (Why). ADR 0017 asks every change that introduces a notifiable fact to persist it, and to publish a fact event only when a consumer exists. The change log is that first consumer. Tournaments already persists who and when for its own transitions.

## Goals / Non-Goals

**Goals:**

- One place where the owner sees what changed for competitors, with a public part that never leaks private data.

**Non-Goals:**

- Delivery to guests, a participant inbox, editing entries.

## Decisions

### D-1 One table in Tournaments

`ChangeLogEntry(tournament, kind, subject, subjectRevision, actor, at, data, reason?, public)`; `kind` is an open set (`entry-admitted`, `entry-cancelled`, `schedule-published`, `schedule-withdrawn`, `tournament-published`, `material-change`, `dates-changed`, `visibility-changed`, `tournament-cancelled`, `competition-finalised`, `competition-reopened`); `data` holds the values the sentence needs (old/new, entry alias, revision numbers). `public` is set by kind: material changes, publication, cancellation and final revisions only. A unique key on (kind, subject, subjectRevision) makes consumers idempotent.

### D-2 Own facts in the same transaction

Publishing, the material fields of a published tournament's save (game or variant, system and rules, entry kind and team structure, venue), `ChangeDates`, visibility changes and cancellation add their entry in the transaction that makes the change, with the owner's reason where the action has one.

### D-3 Others' facts through fact events

Registration publishes `EntryAdmitted` and `EntryCancelled` (with cause code: `operator`, `absent-at-start`, `tournament-cancelled`); Competition publishes `SchedulePublished` and `ScheduleWithdrawn` (revision, cause code). Each carries tournament, subject, subject revision, actor and time, no free text. The log row links to the entries page or the schedule's publication history, where the private reason is shown to the owner.

### D-4 Screens

"Change log" page in the tournament navigation, after Standings. A filter (segmented: All, Entries, Schedule, Tournament, Results) above a list; each row has a kind icon, a sentence ("Planned start changed from 22 November 2026, 10:00 to 29 November 2026, 10:00 · Europe/Madrid"), who and when, and a "Public" label when it also appears on the public page. Empty: "Changes appear here from publication onwards."

## Implementation notes

- **N-1** The entry fact events carry the entry's alias, and every fact event the acting person's display name (null for an automatic change), so the log can say "Taylor Finch admitted" and who did it: Tournaments holds neither. Neither is private free text (the alias is on the public page; the name is the organiser's own sign-in name), and no reason is carried (Q1). Finalisation and reopening keep their v1 contracts, so those rows show no name.
- **N-2** The entry key is (kind, subject, subject revision) as the primary key: the tournament for its own facts, the schedule's and the final revisions; the entry and its revision for entries. Reopening is recorded but not public: visitors see the next final revision instead.

## Visual input

Prototypes: `prototypes/frontend/correct-close-open-states.html`.

| Screen | States (`?state=`) |
|---|---|
| Change log page | `log-populated`, `log-filtered`, `log-empty`, `log-load-failed` |

Visual choices (G-/RU-): a read-only history page, so no primary action; the "Public" label tells the owner what visitors see; old → new in words.

## Assumptions for review

- **A-1** Material changes before publication are not logged: nobody outside the organisation could see the tournament.
- **A-2** Capacity changes are not material in F-02's list and are not logged.

## Risks / Trade-offs

- [Consumer lag] → the log may show another module's fact a moment later; each row carries its own time, so the order stays right.
