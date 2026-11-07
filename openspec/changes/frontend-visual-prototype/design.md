# Frontend visual prototype

## Current review baseline — 7 November 2026

Functional/visual baseline v0.7. This change supplies disposable documentation prototypes, not production Angular implementation, an API or an extra product application. [Opening instructions](../../../prototypes/frontend/README.md) cover direct file access and a local HTTP server. No install, build or remote asset is required.

The [visual guide](../../../docs/herald-visual-direction.md) is the visual reference; discovery §15 remains the single register for accepted scope and proposed policies. Graphite/neutral surfaces, square corners and the declared spacing scale including 12px are preserved. Lime remains the proposed accent. System sans-serif fallback is used locally; the selected production Tabler library need not be installed in this prototype.

### Review surfaces and boundaries

| Entry point | Current scope | Limits |
| --- | --- | --- |
| `prototypes/frontend/index.html` | Eight-entrant individual league, 28 unique matches, result/correction form, effective 3/1/0 standings, finalisation; public detail and H2 discovery | State lives only in memory and resets on reload; no production revision history, permissions or team engine |
| `prototypes/frontend/journeys.html` | Nine navigable snapshots for individual and direct-team H1: organisation, setup, entries, readiness, rounds, result, correction, final review, public following | Four entrants, six matches; local query parameters carry illustrative outcome choices. Jumping to a step loads a fixture rather than executing a command |
| `prototypes/frontend/review-states.html` | Twelve named H1 states: onboarding, incomplete configuration, entries/check-in, blocked/ready team, administrative outcome, blocked correction, stale/current finalisation, public following, private denial, uncertain save | Controls explain intended actions. Proposed defaults remain explicitly pending; no real account, save, publication, permission enforcement or reconciliation occurs |

H1 public following by link is represented. Discovery, participant self-service, invitations and report/confirm/dispute remain H2. Public fixtures expose selected publication aliases/team names and exclude private roster/lineup details. The API journey is covered in functional documentation, not by inventing another UI console. UJ-01–03/06/07 coverage and remaining screen/state gaps are listed precisely in visual guide §9.3.

The corrected-outcomes round PNG is the canonical historical composition reference; the original `herald-round-management.png` is explicitly superseded. Raster geometry predates the zero-radius decision. Deterministic HTML is the reviewable reference for these new states; a polished fixture does not approve every screen or policy.

### Applied corrections

- Neutral badges explicitly define dark text; inverse artwork no longer supplies an unreadable inherited foreground. Control boundaries and focus rings have separate light/inverse mappings. Decorative separators retain their lighter treatment.
- Result labels are secondary to values; old/new outcomes and point impact are separate. An unresolved match opens with no winner and disabled confirmation until an explicit valid outcome. Corrections retain the current result and require a reason.
- The existing individual interaction stays in memory. Corrections replace the effective result and recalculate points once. The new journey snapshots do not claim to implement a team engine or production concurrency barrier.
- Spacing follows the guide's scale. Border/focus strokes, control heights, geometry and fluid public gutters are explicit exceptions, not accidental spacing values. Mobile entries keep all four facts as labelled cards; operational values remain 14px or larger.
- Pairing publication and competition start remain separate operations; the readiness link explicitly navigates to a later snapshot.
- Team review separates roster, eligible locked starters and actual play. The seven/five/two and blocked four-of-five examples illustrate a proposed profile. Finalised correction requires reopening; ordinary round-robin rounds do not invent result dependencies on earlier rounds.
- Stale finalisation distinguishes result revision 13, displayed standings 12 and reviewed 12. The current fixture shows 13/13/13. Unavailable private links reveal no tournament content. Pending D-21–27 policies stay labelled.

## Validation — current evidence

Chrome 157.0.8103.38 through installed Playwright, local file URLs, 7 November 2026. Final evidence uses exact viewports 1600×1100 and 390×844, device scale 1. Full-page captures can be taller than the viewport. Modal captures use the viewport only so the native backdrop matches the visible browser surface. The earlier CLI dump-DOM measurements were superseded because their first script execution preceded the final viewport resize; they are not used as final mobile evidence.

- 68 compositions rendered: four individual-demo surfaces, twelve state fixtures and eighteen journey variations, each at desktop/mobile width. No page JavaScript errors, document horizontal overflow or operational table overflow in the final matrix. Horizontal mobile navigators are deliberate and show the selected step.
- 21 selected PNGs (~2.7MB total) include desktop/mobile and CSS grayscale/4px-blur variants. Representative admin, discovery, result/correction, team readiness, entry cards, finalisation and private/public compositions were visually inspected. A render pass alone is not a pixel-by-pixel review of all 68 views.
- Nine affected captures were refreshed after the second review: readiness separates publication/start, canonical decision IDs replace old gap IDs, and modal images use viewport-only capture. No horizontal overflow in these targeted checks.
- 12 browser interaction checks passed: empty result and disabled confirmation, focus on the native result select, Escape dismissal, explicit draw preview and query-state propagation through correction for both individual and team journeys.
- 11 result-state checks passed in Chrome: invalid submission does not change a result; selection enables confirmation; draw points apply once; correction prefills the prior result, requires a reason, replaces the effective result and does not duplicate points.
- `node --check` passed for all three scripts; 28 static local HTML references resolved. The [manifest](../../../docs/assets/mockups/journeys/manifest.json) records sources, hashes and viewports; the [QA summary](../../../docs/assets/mockups/journeys/qa-summary.json) records the assertions.

Text/control/focus contrast was calculated from source CSS pairs and sampled computed styles, never estimated from the generated PNGs. Examples: neutral badge 14.49:1; control line on white 4.17:1 and canvas 3.79:1; focus on white 6.37:1; inverse focus on graphite 9.13:1 and inverse hover 6.38:1. These ratios cover the named pairs, not every interaction or accessibility requirement. The exact mapping and earlier corrected failures are recorded in the guide appendix.

## Refactoring UI diagnostic — scoped current assessment

Scope: the rendered documentation compositions and representative captures above, using the project's existing square geometry and scale. This is not a score for the complete unimplemented product, its old generated PNGs or all assistive-technology behaviour. **8 of 8 rows pass; `round(8 / 8 × 10) = 10/10`.** No corrective row remains within this sample. Preserve the listed evidence while adding the still-missing states; production gates below remain open independently of this visual score.

| Diagnostic row | Status | Evidence / action to preserve 10 |
| --- | --- | --- |
| Hierarchy reads blurred | Pass | `admin-blur.png` and `journey-team-blur.png`: title, work surface and primary next action remain distinct; keep corrections and contextual links secondary |
| Works in grayscale | Pass | Both grayscale captures preserve textual status, selected context and action hierarchy; never make state depend on lime/red alone |
| Enough white space | Pass | Group gaps 24/32 and field/row gaps 8/12/16 separate tasks. Mobile cards retain all facts and action space; recheck long real names |
| Labels secondary to values | Pass | Result dialogs and readiness facts use 14px muted labels versus 16/18px values; mobile entry labels 12px support 14px facts |
| Consistent spacing scale | Pass | Guide scale 4/8/12/16/24/32/48/64 and explicit geometry/fluid-gutter exceptions; no leftover 28px footer or 80px profile gap |
| Text width constrained | Pass | Prose is constrained around 55–75ch, forms/dialogs around 600px or less; broad tables are operational data rather than long prose |
| Sufficient colour contrast | Pass for checked mappings | Explicit neutral badge, light/inverse focus and boundary pairs above; validate each new component/state rather than extrapolating a blanket pass |
| Appropriate elevation | Pass | Borders organise work surfaces; the native dialog uses a restrained shadow/backdrop. Cards and notices do not all float |

### Remaining gates

The static surfaces are review inputs. They do not replace acceptance of pending policies, complete component/state coverage, keyboard traversal/focus restoration across every flow, screen-reader/zoom testing, production SSR/hydration, backend authorisation, revision history, optimistic concurrency or network recovery tests. No full WCAG compliance claim is made. The visual guide names missing states rather than treating every journey as complete.

## Historical review — 6 November 2026

The initial individual prototype had only source-level verification, and its provisional diagnostic was 4/8 (5/10). Its browser/blur/grayscale QA was then outstanding. The first refinement addressed operational hierarchy, compact desktop rows/mobile cards, inverse hover, readable status sizes, numeric alignment, filter labels and correction impact. Those statements describe that historical snapshot only. The current render, behaviour evidence and scoped diagnostic above supersede that verification status.
