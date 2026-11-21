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
- **N-3** Changes made by the cancellation's cascade (the entries it cancelled, the schedule it withdrew) are logged with the cause `tournament-cancelled` and the canceller's identifier but no name: the handlers act on an event, not for a signed-in person. The cancellation's own row names the owner and gives the reason.
- **N-4** "Competition system and rules" is material (F-02) but the configuration has no such field yet; the first change that adds one logs it in `LogMaterialChanges`.
- **N-5** `PublicChangeLogAsync` drops reasons and names and keeps the public kinds; it does not check the tournament's visibility, which `h1-public-read`'s endpoint gates (a private tournament has no public page). The admin page hides the "Public" label on a private tournament, since visitors read none of it.
- **N-6** Two writes that lose a race may meet on the change log's key before the revision check: the loser answers 409 as before, not 500.

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

## Full run (task 6.2)

21 November 2026: `scripts/check all` passed (rules, spec coverage, format, build, Wolverine codegen and OpenAPI client current, 705 .NET tests, lint, boundaries, Vitest, SSR isolation, build); the e2e suite passed, 28 journeys including journey 27; the test script `seeded-change-log` passed on a fresh seed. The seed logs one retried `DbUpdateConcurrencyException` in Competition's `TournamentCompetitionStarted` handler, which this change does not touch; Wolverine's retry completes it.

## Prototype comparison (task 6.3)

The test script's captures (`log-populated`, `log-filtered`, `log-dates-change`, `log-cancelled`, each at 1440 and 390 px) against `correct-close-open-states.html` at the same widths; `log-empty` and `log-load-failed` are covered by Vitest, since a published tournament always has its publication logged.

- **Kind icons:** the prototype draws a flag for tournament changes and a single person for entries; the page uses the registry's `trophy` and `users`, and adds `calendar` (schedule) and `list-numbers` (results) to the registry and `docs/ui/icons.md`.
- **Lifecycle labels beside the title:** not repeated on the change log, as on Standings; the configuration page shows them.
- **Filter:** separate buttons with a gap instead of a joined segmented strip; the pressed one is inverted as in the prototype. No segmented control exists in `ui` yet.
- **List:** a bordered panel, as other admin lists, instead of rows on the page background. "Public" uses the neutral status label without the prototype's circle icon.
- **Byline:** fixed after the first capture to add the reference time zone after the time, as the prototype does; the reason link now uses the text colour instead of the browser's blue.
- **Finalisation and reopening rows** show no name: their v1 contracts carry none (N-1).

