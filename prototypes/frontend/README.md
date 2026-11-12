# Herald documentation prototypes

Functional/visual baseline v0.7, 7 November 2026. These are local review assets, not production Angular applications.

## Open

Open `journeys.html`, `review-states.html`, `shell-states.html`, `access-states.html`, `tournament-setup-states.html`, `registration-window-states.html`, `entries-states.html`, `feedback-layout-states.html`, `team-rosters-states.html`, `check-in-states.html` or `index.html` directly in a browser. Alternatively, from the repository root:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory prototypes/frontend
```

Then open `http://127.0.0.1:4173/journeys.html`. Stop the temporary server with Ctrl+C. There is no install or build step and no external dependency.

## Choose a review surface

- `journeys.html`: nine snapshots for each H1 operator variation, selected with `kind=individual` or `kind=team`. Steps: access, setup, entries, readiness, rounds, result, correction, finalise, public. The navigator can jump to any example. New result choice starts empty; its selected outcome is carried through local query parameters into the subsequent illustrative table.
- `review-states.html`: twelve fixtures selected with `state=onboarding`, `configuration`, `entries`, `team-blocked`, `team-ready`, `administrative-result`, `correction`, `finalisation-stale`, `finalisation-current`, `public-following`, `private-denied` or `recovery`. Controls explain intended actions; they never mutate a backend.
- `shell-states.html`: M0 shell fixtures for `m0-web-shell`, selected with `state=public-shell` (add `menu=open` for the narrow menu), `controls`, `api-unavailable`, `route-failed`, `not-found-public`, `not-found-admin` or `context-replaced`. Captures and status: `docs/assets/mockups/shell/README.md`.
- `access-states.html`: 24 UJ-01 organisation/access fixtures selected with `?state=`. Covers assigned-only sign-in, owner creation, organisation switching, revoked access, expiry, recovery and generic denial under confirmed D-21. [State table, desktop/mobile captures and review assumptions](../../docs/assets/mockups/access/README.md). Proposals pending maintainer review; no real authentication, authorisation or persistence.
- `tournament-setup-states.html`: 18 H1 setup fixtures selected with `?state=`: list empty/populated/loading/failure; individual/team drafts, incomplete configuration, validation, saving/failure/conflict; read-only publication previews, publishing/failure; editable published configuration. [State table, desktop/mobile captures and visual decisions](../../docs/assets/mockups/tournament-setup/README.md). Review material approves no product default; no real save or publication.
- `registration-window-states.html`: 11 deterministic H1 registration fixtures selected with `?state=`. Published configuration with manual opening, closure, reopening, blockers, progress, failure, conflict and a rejected date removal; list with three separate lifecycle labels. [Captures and visual decisions](../../docs/assets/mockups/registration-window/README.md). Review material approves no product default.
- `entries-states.html`: 22 deterministic H1 guest-entry fixtures selected with `?state=`: individual/team fields, guest choice/creation/duplicates, admission, cancellation, progress/failure/conflict, capacity mismatches, configuration constraints and tournament list counts. [Desktop/mobile captures, provenance and visual decisions](../../docs/assets/mockups/entries/README.md). Review material approves no product default.
- `feedback-layout-states.html`: 38 deterministic feedback and layout fixtures in three batches, selected with `?state=`. Entries, configuration, administrative pages, public home and inline catalogue specimens. [79 captures, provenance, checks and visual decisions](../../docs/assets/mockups/feedback-layout/README.md). Review material approves no product default; no API or persistence.
- `team-rosters-states.html`: 19 deterministic H1 team roster fixtures selected with `?state=`: team readiness, roster sizes, guest search/creation/duplicates, add/remove progress and failure, history, cancelled read-only access, awaiting terms, conflict and load recovery. [38 desktop/mobile captures, provenance and visual decisions](../../docs/assets/mockups/team-rosters/README.md). Review material approves no product default; no API or persistence.
- `check-in-states.html`: 11 deterministic H1 check-in fixtures selected with `?state=`: mandatory/optional policy, empty field, progress, success and undo toasts, row failure, conflict, cancelled evidence, independent team roster readiness and locked configuration. [22 desktop/mobile captures, provenance and visual decisions](../../docs/assets/mockups/check-in/README.md). Review material approves no product default; no API or persistence.
- `index.html`: the original eight-entrant individual league demo. `#admin`, `#discover` and `#public/saturday` select its views. Its results/standings are in memory and reset on reload. Discovery illustrates H2.

## Scope and review status

UJ-01–03 and UJ-06/07 have representative H1 compositions. UJ-08 is documented through the functional API journey and receipt/recovery examples, not another app UI. There is no sign-in, real organisation/guest creation, team engine, persistence, permission enforcement, notification delivery or production revision history. Navigating between journey snapshots does not execute the named command. Public views use fictional publication aliases; team roster/lineup details do not appear there.

The functional decision register remains authoritative. New policy proposals, including onboarding/private access and the finalisation revision barrier, are not approved by these fixtures. Refer to `docs/herald-visual-direction.md` §9 for represented/missing states and `openspec/changes/archive/2026-11-08-frontend-visual-prototype/design.md` for validation and the scoped Refactoring UI diagnostic.
