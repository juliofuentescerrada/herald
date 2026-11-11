## Status

**Approved for implementation on 10 November 2026** (gate 1.1). Scope, the first row of §5.1 (D-27), the D-08 note, the rule decisions R-1 to R-5, the assumptions A-1 to A-4 and the deviation Q-1 were confirmed by the maintainer the same day; the mockups ([tournament setup states](../../../../docs/assets/mockups/tournament-setup/README.md)) were supplied the same day and are referenced in `design.md`.

## Why

H1's first slice gave Herald people and organisations, but there is still nothing to organise: every remaining H1 slice (entries, pairings, results, standings, public reads) acts on a tournament. F-02 is too large for one change, so this one delivers its base: a tournament an owner can configure and publish.

## What Changes

- An organisation owner creates a draft tournament, edits its configuration, reviews a read-only summary and publishes it. A draft needs only a title; everything else is required at publication (CP-01).
- Configuration: title, game/variant as free text, entry kind (individual or team), team structure (minimum and maximum roster size, active players per side), capacity in entries, planned start, registration opening and closure, reference time zone, venue or online, admission (automatic or manual), check-in (optional or mandatory) and visibility (public, unlisted or private). The competition profile is fixed: single round-robin, 3 / 1 / 0 (D-04).
- Publishing makes the tournament published and nothing else: registration stays not open, no entries or pairings exist, and there is no unpublish (§5.1, first row).
- A published tournament stays editable, but every save must keep it complete.
- Writes carry the revision they were based on; a stale write is rejected as a conflict and the typed input is kept. A repeated write with the same content returns the original outcome.
- Admin application: a **Tournaments** destination with the tournament list, the configuration form, the review page and the published tournament header, with publication, registration and competition shown as three separate labels.
- Tournaments are organisation-owned: another organisation's owner gets the same generic denial as for any other resource.
- Two end-to-end journeys: create and publish, and a conflicting save from a second tab.
- Documents: D-27 becomes partially confirmed (publication row), the F-02 rule decisions and D-08 note are recorded in the functional baseline, and the visual direction's screen/state inventory gains the tournament setup references.

Out of scope, each waiting for the slice that needs it: opening and closing registration, entries and capacity enforcement, announcements of material changes, cancellation and archival, the public tournament page and visibility-change effects (§5.2), a "tournament published" integration event (defined when Registration consumes it), pilot API access (D-12), and any second competition profile.

## Capabilities

### New Capabilities

- `tournament-setup`: creating, configuring, reviewing and publishing a tournament within an organisation; its validation and publication rules; revision-aware writes; the owner's tournament list and the admin screens for them.

### Modified Capabilities

- `end-to-end-journeys`: the list of critical journeys gains the two tournament setup journeys.

## Impact

- Backend: `Herald.Tournaments` gains its domain, features and first migration, and its `DbContext` becomes organisation-scoped. `Herald.ModuleHosting` exposes the acting person's identifier in the organisation context so a module can record who made a change without referencing Organisations. New test project `tests/Herald.Tournaments.Tests`. No new packages.
- API: five admin operations under `/api/organisations/{organisationId}/tournaments`; the admin OpenAPI document, the generated client and Wolverine's generated code are regenerated. The public document is unchanged.
- Frontend: a `tournaments` feature in the admin application and a **Tournaments** rail link. The form reuses the admin application's existing field presentation; `ui` gains no control. No new packages.
- End-to-end: a new journey file and fixtures in `e2e/`.
- Documents and assets: `docs/assets/mockups/tournament-setup/`, `prototypes/frontend/tournament-setup-states.*`, functional discovery (D-08, D-27, F-02), visual direction §9.3, roadmap, README and `CLAUDE.md`/`openspec/config.yaml` status at completion. No new ADR: the decisions here apply ADRs 0004, 0005, 0007 and 0014 and are recorded in `design.md`.
