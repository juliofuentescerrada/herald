# Implementation conformance — 15 November 2026

Audience: H1 owner operations (XP-01). Reference: the approved tournament administration prototype and its state inventory. The implementation preserves the existing domain and access contracts; no API, schema, event, permission or shared control API changes were needed.

## Findings and disposition

| Criteria | Observation and correction | Verification |
| --- | --- | --- |
| G-01/06, RU-01/02 | Direct published-list Schedule links and native Configuration/Entries/Schedule links remove the configuration detour. Match retains Schedule context. | Source, seeded navigation and existing route/access journeys |
| G-02/10/11, RU-06/10 | Running uses the existing information tone with its text and trophy. Preparation/publication/registration remain neutral. Start-fixed fields explain their lock; phase copy no longer claims that no matches have started. | Shared mapping tests, seeded running configuration capture |
| G-01/04/06, RU-02/04 | Pairing and outcome share a record; View match names the destination. Native result radios use larger labelled surfaces and a visible Selected indicator. Started team result work precedes collapsed locked lineups. | Seeded individual/team result submission, row-scoped outcome/state assertions and DOM order assertions |
| G-07/08/09, RU-09 | Dirty lineup work uses the existing leave dialog and access-state draft registry; explicit stay/discard preserve the intended choice. Failed match recovery retries both dependencies. Same-query search retry stays inside its drawer. | Unit tests, seeded leave/retry interactions; existing concurrency/access journeys retained |
| G-03/05, RU-05/08 | List/Entries wrap actions and long content at the shared breakpoint; timestamps/counts use numeric roles. | Browser overflow assertions and synthetic captures at 320/390/699/700/1440 CSS px; additional long-title layout sample at 320 |
| G-06/08/10, RU-03/09 | Repeated guest actions are secondary; redundant empty-entry headings and empty roster history are omitted; schedule history is collapsed. Catalogue copy/actions now illustrate those existing meanings. | Unit expectations, withdrawal/history browser script, source inspection of catalogue |

The prototype is a composition reference rather than a pixel-exact substitute for the real controls. Production retains the existing form groups, notices, confirmation dialogs and per-side lineup saving. No new component or icon API was required, so the live component API and icon registry remain unchanged. Tournament navigation is app-local presentation; feature imports do not cross feature boundaries.

## Evidence boundaries

Only screenshots produced by the synthetic E2E scripts are intended for PR review. No local signed-in owner screenshot or identifier is included. Captures are generated under `e2e/test-results/screens/` and uploaded by CI as `test-script-screens`.

Source inspection covers the affected loading, busy, rejected, conflict and permission replacement branches. Executed browser checks cover normal operations, local search failure/retry, stay/discard, publication withdrawal, and selected keyboard/axe checks. Unit tests cover failed dependent loads and browser-unload protection. This is not a browser pass for every fixture in the 94-state prototype.

Not verified: a real 200% browser zoom session, a screen-reader spot check, every long-content/error variant, and full manual keyboard traversal of every changed screen. Automated narrow-width checks do not establish zoom or screen-reader conformance. The axe helper excludes colour contrast; semantic token reuse and prior palette measurements are source evidence, not a new all-state contrast audit. These remain explicit acceptance limits rather than claimed passes.

## Read-only review

The required herald-reviewer found no production correctness or architecture findings. It identified two tests whose scenario markers overstated their assertions. The team-result script now checks initial unselected radios, operational order, explicit result recording and schedule propagation. The schedule-results script now checks unresolved destinations and row-scoped resolved outcome/state. Both findings are resolved by executable assertions.

## Validation results

- Pass: all 314 web unit tests across admin, public, catalogue, UI and API client; web lint and boundary fixtures; all three production builds.
- Pass: SSR isolation with 50 concurrent requests and no forwarded credentials.
- Pass: all 20 existing browser journeys with one worker, including creation/publication, entries/check-in, schedule/start, lineups/results and revision/access boundaries. The first parallel run timed out in three long journeys; one serial rerun passed all 20. The withdrawal journey explicitly expands the now-collapsed history before reading its reason.
- Pass: six UI guidance/routing inventory tests. Full repository rules passed before the implementation checkpoint; the final archive is checked again before commit.
- Build warnings retained: the admin initial bundle exceeds its 900 kB warning budget; schedule styles exceed their 4 kB warning budget by 14 bytes. Builds complete successfully; neither warning is hidden or disabled.
- Pass: all nine synthetic seeded scripts, including axe scans of list, entries, schedule, match, unsaved-exit dialog and failed-search drawer (contrast excluded), keyboard activation of navigation/results, Escape preserving dirty input and drawer focus return. Changed captures wait explicitly for loaded content.
- Pass: all eight new specification scenarios have covers annotations (165 of 430 total scenarios covered, with the existing 265-scenario baseline unchanged); OpenSpec change/spec validation and full repository rules.

Visual inspection of synthetic wide team-result and narrow schedule captures confirms the approved hierarchy and wrapping. Existing toasts can overlap lower content and remain dismissible; their placement follows the existing shared-control contract, not a new toast design.
