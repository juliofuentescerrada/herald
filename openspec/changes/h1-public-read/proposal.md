## Status

**Proposed in H1 batch 3's proposals pull request, 15 November 2026.** The rules come from the batch's decision session of the same day, recorded in the functional discovery (§5.2, F-02, F-10, UJ-07; §15 rows D-09, D-26 and D-27). It depends on `h1-tournament-cancel-and-dates` and `h1-change-log`, whose states and public entries it shows. Merging the proposals pull request approves this change (ADR 0018); task 1.1 records that approval.

**Approved for implementation on 16 November 2026**, when the maintainer merged the batch 3 proposals pull request (#74), with the review answers below (ADR 0018). The review asked for no change to this proposal.

**Review answers, 15 November 2026 (#74):** the maintainer accepted Q1 and Q2 (Tournaments composes the page from projections; `no-store` responses) and the prototypes as they are.

## Why

Visibility is stored but has no effect: nobody outside the organisation can follow a tournament. D-09 and D-27, confirmed on 15 November 2026, give H1 a public or unlisted page from publication, alias-only, and visibility changes that take effect at once. AT-10 and AT-13 test it; UJ-07 is its journey.

## What Changes

- **Public page (UJ-07, D-09):** from publication, a public or unlisted tournament has a page in the public application at its link: organisation, game or variant, venue, dates with the time zone, participation structure (entry kind, team structure) and the lifecycle facts as separate labels (registration, competition: preparing, running, finalised or cancelled). From the schedule's publication it shows the published rounds and matches with opponents and resolution causes; from start, the standings with provisional or final status, the results revision and time, each entrant's explanation, shared positions shared and withdrawn or disqualified flags. The public part of the change log follows (`h1-change-log`). A cancelled tournament says so and when; final standings revised after reopening say so.
- **What never appears:** contacts, private reasons, rosters, lineups, drafts, withdrawn publications' content, internal identifiers other than the tournament's link. Entrant names are their reviewed aliases (D-22). Rests are shown as rests.
- **Not available:** a draft, a private tournament, a deleted or unknown link all give the same "This tournament is not available" page with status 404, revealing nothing (F-01a).
- **Visibility changes (§5.2):** the owner changes visibility in any state. To private: anonymous reads are refused from the moment the change commits; public responses are never stored by shared caches (`Cache-Control: no-store`), so nothing remains to invalidate. From private to public or unlisted: the owner first sees a preview of what becomes public (title, dates, and the list of entrant aliases), then confirms. In H1, without a directory, public and unlisted both open by link; the difference starts with H2's discovery. Each change is logged (`h1-change-log`).
- **Composition (D-08):** Tournaments serves the whole public page from its own records and from local projections of the published schedule, the results and the standings, so the visibility check and the data are read in one place (Q1). Standings publishes its table as a new revisioned snapshot.
- **Public application:** a server-rendered tournament page (`/tournaments/{id}`) with sections Overview, Rounds, Standings and Changes, in one column at every width; an anonymous visitor's next action is to read, never to act. The admin configuration page gains "Visibility" with "Change visibility" and a "View public page" link.
- **Notifiable facts (ADR 0017):** visibility changed (recorded by `h1-change-log`'s Tournaments facts).
- One end-to-end journey (28): a visitor reads a public tournament, then sees "not available" after it becomes private.

Out of scope: discovery and search (H2), participant pages (H2), live updates (H5), public history across tournaments (H2), embeds and feeds.

## Decision rows

| Row | Status | Used for |
|---|---|---|
| D-09 Public identity/history | Partial; H1 page confirmed 15 Nov 2026 | Alias-only content, from publication |
| D-27 Lifecycle/visibility/deadlines | §5.2 confirmed 15 Nov 2026 | Visibility in any state, private immediately, preview to public |
| D-26 H1 announcements | Confirmed 15 Nov 2026 | Public material changes |
| D-21 H1 onboarding/private access | Confirmed | Generic denial with no content |

## Open questions for the review

- **Q1** Tournaments composes the public page from projections of Competition's schedule and results and of Standings' table, so a switch to private is enforced by one synchronous check. The cost is that the public page may lag a result by the projection's delay, which it discloses with the revision and time. Confirm, or serve each part from its own module with a visibility projection in each (which could leak for a moment after a switch to private).
- **Q2** Public responses are `no-store` in H1 rather than cached and purged. Confirm; caching is revisited with M4's hosting.

## Screens

Prototypes in `prototypes/frontend/correct-close-open-states.html` (design.md, Visual input):

- **Public tournament page (new):** published before start; schedule published; running with provisional standings and an explanation; final; final revised after reopening; cancelled; not available; narrow layout.
- **Configuration page (modified):** visibility panel; change to private confirmation; private to public preview.

## Capabilities

### New Capabilities

- `public-tournament-page`: the public or unlisted page, its content rules and visibility changes.

### Modified Capabilities

- `standings`: the published table snapshot.
- `end-to-end-journeys`: journey 28.

## Impact

- `Herald.Tournaments`: `ChangeVisibility`; projections of the published schedule, results and standings; anonymous query `GetPublicTournament` in the public OpenAPI document; migration.
- `Herald.Contracts`: `TournamentStandingsChanged` v1 (revisioned snapshot: rows, positions, points, flags, status, final revision). `TournamentScheduleChanged` gains pairings with entrant aliases (optional, backwards compatible), if it lacks them.
- `Herald.Standings`: publishes the snapshot through the outbox.
- Public OpenAPI document and public client; admin client; Wolverine's generated code; public app `tournaments` route (SSR); admin `tournaments` feature.
- `e2e/`: journey 28 and its test script; `tools/Herald.Seed`: a public running tournament, an unlisted finalised one and a private one. Docs: visual direction §8 and §9.3.
