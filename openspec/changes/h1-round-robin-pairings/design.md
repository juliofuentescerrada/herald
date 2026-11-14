## Context

See proposal.md (Why). Registration owns each tournament's `Field` (entries, admission, check-in, rosters) and Tournaments owns publication, registration and lifecycle (D-08). They exchange revisioned snapshots: `TournamentEntryTermsChanged` (Tournaments → Registration) and `TournamentFieldChanged` (Registration → Tournaments), each kept as a local projection (ADR 0016). Competition has a database and no model. The rules are F-05, F-06 and §5.1 rows 4 and 5 as confirmed on 13 November 2026, and D-04's profile.

## Goals / Non-Goals

**Goals:**

- The owner reviews absences, drafts, publishes and withdraws a round-robin schedule from the admin application and the Admin API, with a durable history of publications.
- A published schedule and the field it was drafted from cannot drift apart silently.

**Non-Goals:**

- Competition start, roster freeze and start readiness (`h1-competition-start`).
- Matches as playable objects (state, lineups, results): this change stores pairings only; batch 2 gives them a life.
- Public or participant reading of the schedule.

## Decisions

### D-1 Competition keeps a `Schedule` per tournament

`Schedule` (aggregate, id = tournament) holds the eligible-field projection (eligible revision, registration state, pending count, entrants with name and admission order), at most one draft and the published revisions. A draft holds its seeding (admission order or draw with its seed), the eligible revision it was built from and its rounds; a round holds its matches (two entrant ids) and its resting entrant if any. A published revision copies the draft's rounds with its number, who and when; withdrawal adds reason, who and when. One aggregate keeps "one current publication" and "the draft returns on withdrawal" under one concurrency token.

*Alternative considered:* the draft and each publication as separate aggregates. Rejected: publish and withdraw each change both.

### D-2 The eligible field travels as a snapshot

Registration publishes `TournamentEligibleFieldChanged` v1 (organisation, tournament, eligible revision, registration state, pending count, entrants: entry id, name, admission order) through the outbox whenever its eligible revision changes or its terms change the registration state. `Field` gains `EligibleRevision`, incremented only when the set of eligible entrants changes (admission, cancellation, check-in under a mandatory policy, policy change): roster edits and waiting entries do not change it, so they never stale a draft. Eligible = admitted and, under a mandatory policy, checked in. Competition is its only consumer and keeps the newest revision.

*Alternative considered:* adding the entrants to `TournamentFieldChanged`. Rejected: Tournaments, its consumer, needs counts only, and two handlers of one message type in one host would share a transaction across modules.

### D-3 Registration learns the check-in policy and the lock from the entry terms

`TournamentEntryTermsChanged` gains optional `CheckIn` (optional or mandatory; absent reads as optional, the behaviour before this change) and `FieldLocked` (absent reads as false). Tournaments sets `FieldLocked` while a schedule is published (D-4). Registration then rejects admit, cancel (absence included), check in and undo with "the schedule is published; withdraw it first". Roster edits stay allowed until start.

### D-4 Tournaments keeps the schedule's state

Competition publishes `TournamentScheduleChanged` v1 (organisation, tournament, schedule revision, published revision or none, the eligible revision it was built from). Tournaments keeps it, rejects reopening registration while a revision is published and republishes its entry terms with `FieldLocked`. `h1-competition-start` reads the same projection for readiness.

### D-5 Crossed changes are reported

The lock is asynchronous: a field write accepted by Registration just before `FieldLocked` arrives produces a newer eligible revision than the published one. Competition then shows "the field changed since publication" on the schedule, with the entrants added or removed; the owner withdraws and republishes. Nothing is repaired automatically (D-08). The reverse race (publishing while a field write is in flight) ends the same way.

### D-6 Generation

The circle method over the seeded list: fix the first, rotate the rest; an odd field adds a rest slot, so each entrant rests once. Seeding by admission order uses Registration's admission order; a draw shuffles with a recorded 32-bit seed and the same pseudo-random algorithm, so the same seed and field give the same draft (AT-01). n entrants give n(n−1)/2 matches over n−1 rounds (n even) or n rounds (n odd). The generator is a pure function in `Domain` with its own tests; the core stays game-agnostic.

### D-7 Absence review lives in Registration

"Mark absent" is a cancellation with cause `AbsentAtStart`, allowed only for an admitted entry pending under a mandatory policy; other cancellations get cause `Owner`. It frees the slot; promotion follows the existing rule, which admits nothing while registration is closed, the only state in which drafting matters. Both appear in the entry's history.

### D-8 Revisions and retries

Every write states the schedule revision it was based on (409 with the current schedule otherwise) and carries an operation identity where it creates something: generating with the same identity returns the same draft; publishing a draft already published returns that revision (F-06 acceptance).

## Visual input

Prototypes: `prototypes/frontend/start-and-pair-states.html`, generated for this batch under visual direction §4, §5 and §7.2 (ADR 0018), shared with `h1-competition-start`. Review material; it approves no product default.

| Screen | States (`?state=`) |
|---|---|
| Entries page | `absence-review` (summary: 2 pending block the schedule; pending rows with "Mark absent"), `mark-absent-confirm`, `marked-absent` (toast, entry under Cancelled with its cause), `field-locked` (writes disabled with the reason) |
| Schedule page | `schedule-blocked` (blockers: registration open, pending, fewer than two), `schedule-empty` (seeding choice, Generate), `schedule-generating`, `schedule-draft` (four entrants: three rounds), `schedule-draft-odd` (five: five rounds, one rest each), `schedule-draft-teams`, `schedule-stale`, `schedule-published`, `withdraw-confirm` (reason required), `schedule-withdrawn` (draft back, history), `schedule-crossed` (field changed since publication), `schedule-conflict`, `schedule-load-failed` |
| Configuration page | `reopen-locked` (reopen disabled while published) |

Visual choices: the Schedule page is a sibling of Entries in the tournament's navigation; rounds are stacked groups, the resting entrant as row meta of its round; publish and withdraw are summary actions on the right; publication history after the rounds, read-only.

Maintainer feedback of 14 November 2026 (#55), applied to the prototypes:

- Check-in states on the entries page are status badges with tone and icon ("Checked in" success, "Check-in pending" pending; "Absent at start" neutral).
- The schedule's state ("Draft", "Published · revision 1", "Stale") is a badge beside the summary heading, aligned with it, not a smaller label inside it; the publication time and its time zone stay together on one line.
- Matches are symmetric about "vs": the first entrant aligned to the right, the second to the left, so the names sit next to "vs" with no gap.
- Generation blockers use the same checklist as start readiness (condition left, state right).

## Assumptions for review

Accepted by the maintainer on 14 November 2026 (#55).

- **A-1** A team schedule shows team names only; rosters are not shown on the schedule.
- **A-2** Generating requires the owner to choose seeding each time (nothing preselected, as configuration choices are).
- **A-3** Withdrawing keeps the same seeding and rounds in the draft; the owner regenerates if they want a new draw.
- **A-4** Reason text is private to the organisation, at most 500 characters, as entry reasons.

## Risks / Trade-offs

- [Asynchronous lock] → crossed changes are visible and blocking (D-5); start readiness requires the publication to match the eligible revision.
- [Competition's first model] → the schema starts with schedule tables only; batch 2 adds matches as their own state and may move pairings, migration included.
- [Two new contracts] → both v1 snapshots with tests reading them; additions to `TournamentEntryTermsChanged` are optional members.

## Implementation notes

- **Terms revision (D-3):** the schedule's lock changes the entry terms without changing the tournament, so Tournaments numbers the terms it sends with their own sequence (`TermsRevision`), started from each tournament's revision by the migration so Registration keeps accepting them.
- **Pending names (D-2):** `TournamentEligibleFieldChanged` carries the pending entries (identifier and name), not only their count, so a rejected generation names them (spec "Entries are pending").
- **Storage (D-1):** the eligible field, the draft and the publications are `jsonb` documents on the schedule's row: they are always read and written whole with it.
- **Seed (D-6):** the draw's seed is chosen by the endpoint and recorded; the shuffle uses its own linear congruential generator, so a seed gives the same order on any runtime.
- **No schedule yet:** a tournament published before this change has no schedule until Registration next reports its field (any entry write, or new terms). The Schedule page says "No eligible field reported yet" for a 404. *shortcut: no backfill of existing fields; acceptable while every environment is reseeded, revisit before the pilot (D-14).*

## Verification (task 8.2, 14 November 2026)

| Check | Result |
|---|---|
| `scripts/check all` (format, build, all .NET tests, web install, OpenAPI client, lint, boundaries, Vitest, SSR isolation, builds) | pass after adding the inventory row (the architecture test caught it) |
| `scripts/check rules` (rules, spec coverage, rules tests) | pass |
| End-to-end suite (17 journeys, journey 17 included) | pass, run with the preinstalled Chromium |
| Test scripts (`pnpm test:scripts`, the new `seeded-schedule` included) | pass |
| Admin bundle budget warning (952 kB of 900 kB) | already present on `main`; not introduced here |

## Visual comparison (task 8.3)

Compared the `seeded-schedule` script's screenshots at the desktop viewport (Playwright's Desktop Chrome, 1280 px) and at 390 px with `prototypes/frontend/start-and-pair-states.html` and the maintainer's feedback of 14 November 2026 (#55). Method: screenshots read by the agent; no screen reader or manual keyboard pass. Vitest runs `axe-core` (contrast disabled) on the Schedule page's blocked, generated, stale and withdrawn states and on the entries page's absence review and locked field.

| Point | Result |
|---|---|
| Check-in states as badges with tone and icon | pass: the existing `StatusLabel` with `circle-check` / `circle-dashed` |
| Schedule state badge beside the summary heading, same scale | pass |
| Publication time and its zone on one line | pass after a fix found in the first capture (the zone wrapped alone) |
| Matches symmetric about "vs" | pass at 1280 and 390 px |
| Generation blockers: condition left, state right | pass |
| Tournament tabs (Configuration · Entries · Schedule) | gap, deliberate: not implemented. The pages keep the existing "Back to configuration" link, and the configuration page gains a Schedule summary with "View schedule" beside the Entries one, so no other page's header changes. Tabs belong in a change that reviews tournament navigation as a whole. |
| "published by Alex Morgan" | gap, deliberate: Competition stores the person but cannot name them (as Tournaments, design W-1 of `h1-registration-window`); the time is shown |
| Narrow layout | pass: summary, operation and rounds stack; toasts overlap content while shown, as on the other pages |
| 699/700 px boundary, 200 % zoom, keyboard-only pass | not verified |

