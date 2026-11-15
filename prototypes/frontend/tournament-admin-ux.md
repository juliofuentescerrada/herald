# Tournament administration UX visual references

Status: proposed, not approved. Generated at the maintainer's explicit request for OpenSpec change `tournament-administration-ux`. These are original synthetic fixtures, not application screenshots or implemented capabilities. No API, account access, persistent storage or writes. Controls simulate review destinations; disabled/busy/recovery fixtures are deterministic, not fault-injection tests.

Open [the navigable review](tournament-admin-ux.html). Use the labelled Review state selector to inspect every fixture; links between pages and simulated outcomes stay inside this review. Serve the repository with a static HTTP server. Page plus variant is selected with `?state=page:variant`. Review at 1440, 390, 699, 700 and 320 px; keyboard and 200% zoom also require acceptance checks.

## State inventory

Every page additionally has `loading`, `error`, `conflict`, `busy` and `permission` states. The access fixture replaces record content; page loading and load failure do not show stale records. Conflict preserves editable content and disables operations requiring a current revision. Busy states disable operation controls; they do not imply success.

| Page | Specific variants | Review task |
| --- | --- | --- |
| list | populated, empty, long | Distinct Running, direct Schedule, safe action wrapping and long names |
| create | individual, team, validation, dirty | Conditional team configuration, field feedback, leave protection |
| configuration | preparing, ready, running, saved | Phase context, readiness and start-fixed settings |
| review | complete, incomplete, publishing | Saved values and explicit irreversible publication consequence |
| entries | admitted, waiting, empty, mandatory, locked, running, cancel, admit, add, duplicate, search-error, row-error | Separate admission/check-in; local feedback and queue consequences |
| roster | editable, empty, frozen, cancelled, add, search-error, duplicate, history | Contextual membership work and preserved read-only evidence |
| schedule | blocked, draft, stale, published, withdraw, withdraw-error, withdrawn, running, odd | Generation blockers, revisions, grouped match records and history |
| match | individual, chosen, team-preparation, team-incomplete, team-ready, team-dirty, start-confirm, in-play, team-in-play, resolved, team-resolved | Native outcome choices, explicit submission, lineup preparation then result priority |

## Design choices for review

- G-01/RU-01–03: shared section navigation; operational result before locked lineup evidence; no invented new dashboard or standings route.
- G-02/G-11/RU-06,10: Running uses information emphasis while publication and registration stay neutral. Text remains authoritative; these documentation fixtures use the repository's prototype icon exemption and add no production icon meanings.
- G-03–05/RU-04–08: square geometry; 4/8/12/16/24/32 spacing; one below-700 breakpoint; full-width stacked groups and independently limited prose; tabular numbers and wrapping action groups including beside the desktop rail.
- G-06/G-09: native links, buttons, labelled fields, fieldsets and radio inputs; selected outcome has both indicator and text; no default result or write on selection. Modal fixtures use native dialog. Full screen-reader acceptance is not established by those semantics.
- G-07–08/RU-09: error/retry, busy, conflict and permission fixtures are explicit. Same-query search retry is local; repeated Add actions are secondary; confirmation names consequences and starts on the safe action.
- G-10/G-12: British English and synthetic names; proposal status always visible. Original screenshots remain audit evidence; this review is the proposed replacement and awaits maintainer approval.

## Deliberate fixture limits

Creation/reference forms illustrate the fields being changed, not every current configuration field. Existing registration, visibility and fixed-profile semantics remain governed by their production specifications and older references; the proposal adds no ability to change them. Roster/lineup players are short synthetic samples, not an eligibility engine. Successful save notifications shown here describe retained state; they are not a proposal to replace the existing toast contracts. H2 participant and public flows remain outside this administrator review.

These visual references require approval before implementation. Their presence does not check the approval task or authorise production edits.
