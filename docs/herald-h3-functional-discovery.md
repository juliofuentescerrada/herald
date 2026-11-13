# Herald H3 — Elimination, Single Match, Functional Discovery and Delivery Scope

Version 0.1 · 13 November 2026 · Functional definition for review; no implementation claimed

## 1. Purpose, authority and decision status

H3 lets organisers run single-elimination and single-match tournaments with compatible result profiles, for individuals and direct teams. Participants can identify their opponent, understand the source of a future bracket slot and distinguish a played win from an administrative advance. The same journey is available through web and API.

This is the detailed H3 extension of the [functional baseline](herald-functional-discovery.md). Shared vocabulary, lifecycles, identity, permissions and effective-result rules remain there; the [H2 discovery](herald-h2-functional-discovery.md) owns participant reporting, representation and protected history. The baseline's [§15 decision register](herald-functional-discovery.md#15-decision-register-and-development-gates) remains the single product decision register; D-39–47 identify the proposed H3 policies below. The [roadmap](roadmap.md) owns sequencing and implementation status. [Visual direction](herald-visual-direction.md) owns screen contracts. `openspec/specs/` continues to describe implemented behaviour.

**Existing H3 scope:** the baseline §14 includes reproducible brackets/seeding, byes, advancement, final/shared places, single match, no-draw and aggregate best-of-three profiles, with game/map detail where needed. Individual and direct-team entrants use the same systems. This milestone definition does not approve every operational default below.

**Author-defined defaults for review:** bracket distribution, publication/fixing policy, exceptional progression, single-match tied positions and detailed profile limits are concrete recommendations for the maintainer to accept or replace. Preparing this documentation change does not confirm them or approve production implementation. §13 identifies their gates. Existing partial/proposed H1/H2 policies retain their recorded status.

**Delivery compatibility:** H3 follows H2; H1 and M4 retain their earlier place in the delivery order. No prerequisite is claimed complete by this discovery. H1's draw-capable league and the H2 reporting/authority boundary are preserved. Optional direct-score support and detailed game recording remain conditional under §7; the separate [result-profile proposal](result-profiles-proposal.md) is not blanket-approved here.

## 2. Outcomes, actors and boundaries

### 2.1 Outcomes

1. An organiser prepares a reproducible bracket, reviews its byes, publishes pairings and directs a complete elimination tournament.
2. Individuals and direct teams advance by entrant identity, with one competitive effect per match regardless of lineup size.
3. A participant understands their next action and whether a slot is provisional, published, awaiting a result or blocked by an incident.
4. A compatible outcome-only or best-of-three profile produces a validated effective result; a terminal draw never advances an entrant where a winner is required.
5. Corrections preserve evidence and cannot silently invalidate a published competitive dependency.
6. A two-entry single-match tournament completes without requiring a bracket journey or team-only work for individuals.

### 2.2 Actors and authority

| Actor | H3 authority | Explicit limit |
| --- | --- | --- |
| Visitor | Read permitted published bracket, match and final results | Current public/unlisted/private visibility applies; no private roster or dispute evidence |
| Individual participant | Own match preparation, report, response and correction request under the selected mode | No roster/lineup command; no authority over advancement or seeding |
| Team representative | Prepare the represented team's lineup and handle its results | Current representation required; ordinary membership alone grants no result powers |
| Organisation owner/director | Configure, review and publish pairings; direct incidents and finalisation within current scope | No silent replacement of entrants or override of correction dependencies |
| Referee | Resolve incidents/disputes and permitted corrections within scope | H2 independence applies; cannot adjudicate their own entry or represented team |
| Automatic process | Derive advancement from effective facts; recognise terminal round completion | No silent confirmation, sporting judgement, next-round publication or tournament finalisation |
| External application | Explicitly authorised equivalents of web actions | Resource identifiers, result origin and receipts do not confer authority |

No new role or broader organisation permission is introduced. Check the current acting person, scope and representation on every privileged action, including a submission prepared before revocation.

### 2.3 Included and excluded scope

Includes single elimination; reproducible seeding and initial byes; winner destinations and shared places; single match; decisive outcome-only and aggregate best-of-three profiles; compatibility checks; direct-team readiness; correction impact; web/API parity; target notices and protected history for these journeys.

Excludes double elimination, repechage, reseeding between rounds, automatic replacement of withdrawn entrants after the bracket is fixed, third-place matches, different series lengths per round, an arbitrary rules editor, unrestricted best-of-N, sport-specific sets, new ranking feeds and rollback of played brackets. Swiss and the real connected consumer remain H4; combined stages, cuts, email and webhooks H5; composite team submatches and substitutions H6; circuits H7.

Preparing an external adapter does not claim compatibility with a particular game's timed rounds, drawn games, Swiss formula or official regulations. A shared team game/map is not a collection of individual submatches.

## 3. Configuration, field and competitive identity

### H3-CF-01 Independent dimensions and supported combinations

Keep discipline/variant, entrant kind, participation structure, competition system and result model distinct. A discipline may suggest an available profile, but does not silently bind it or promise complete rules support. Offer implemented, versioned combinations rather than an unrestricted matrix.

| Competition system | Outcome-only | Aggregate best-of-three | Direct score, if separately delivered |
| --- | --- | --- | --- |
| H1 league | Preserve its draw-capable profile; no-draw is a separate variant | Only through an explicitly validated combination | Profile-specific; match score is not standings points |
| Single elimination | Winner required | Decisive first to two wins | Winner required; terminal equality rejected |
| Single match | Winner or draw according to profile | Decisive first to two wins | Equality only under a draw-capable profile |

Do not change H1's confirmed 3/1/0 profile or infer new tiebreakers from richer evidence. H3 acceptance covers elimination and single match; supporting Bo3 in a league needs its compatible profile and acceptance, not just a shared input form.

### H3-CF-02 Field and start gates

Propose a minimum of two eligible entrants for elimination. A one-entry field cannot start and acquire a champion by default. Agree a supported maximum before implementation, with web/API validation and bracket navigation evidence at that size; this discovery does not invent an operational limit.

A single-match tournament has exactly two competitive slots. Existing waiting-list semantics may apply before the field is fixed, but never create a third competitor or another match. Reject a capacity setting inconsistent with that system.

Use the current eligible field, applicable check-in and fixed rules at the inherited start gate. H2's registration-deadline minimum counts admitted entrants; it does not establish match readiness. Regenerating a bracket does not bypass registration, admit a waiting entrant or unfreeze a roster.

### H3-CF-03 Individual and direct-team invariants

An entrant, not a player account or roster member, owns the bracket slot and advancement. Six five-player teams produce six entrants, not thirty. Individual 1v1 follows baseline IP-01–06 without synthetic teams, roster fields or lineup commands in either web or API.

Direct teams keep their eligible tournament roster and match-specific locked lineup. Propose one lineup for the entire Bo3 match, with no substitutions between its games/maps in H3. Another match may select other eligible roster members under the inherited policy. A bye requires no lineup for an unplayed match and credits no appearance. Actual play, not merely a submitted lineup, establishes personal participation.

## 4. Seeding, bracket preparation and publication

### H3-BR-01 Reproducible field and seed order

Take a revisioned snapshot of the eligible field and a complete seed order without duplicates. Propose admission order by default or an explicit operator-run random draw, borrowing the available H1 procedures without treating the H1 decision as approval of elimination placement. Manual ranking and external seeding feeds remain separate needs to decide.

Retain field identities/revision, input and resulting order, procedure/version, the inputs needed to reproduce a draw, slot assignments and draft revision. Retrying or rereading does not draw again. An intentional new draw creates a new attributable draft; it never overwrites the evidence of the preceding proposal.

### H3-BR-02 Bracket size, seed placement and byes

For n entrants, bracket size B is the next power of two. Allocate B−n initial byes. With n ≥ 2 and no other incidents, there are n−1 played matches. A bye advances an entrant without inventing games, sporting wins, scores or appearances; distinguish it from an odd-field league rest.

Proposed standard placement: start with seed order [1, 2]; when doubling to size B, replace each seed s with [s, B+1−s]. For eight slots the order is [1, 8, 4, 5, 2, 7, 3, 6]. Seeds greater than n are empty; initial byes therefore go to the highest seeds and remain distributed. The maintainer must accept this procedure or supply an alternative before the bracket slice.

Reference field A, B, C, D, E, F, in seed order:

| Node | Assignment | Competitive consequence |
| --- | --- | --- |
| Q1 | A / empty | A advances by bye without play |
| Q2 | D / E | Winner feeds S1 |
| Q3 | B / empty | B advances by bye without play |
| Q4 | C / F | Winner feeds S2 |
| S1 | A / winner of Q2 | Winner feeds final |
| S2 | B / winner of Q4 | Winner feeds final |
| Final | Winner of S1 / winner of S2 | Determines winner and runner-up |

Eight slots and two byes produce five played matches: Q2, Q4, S1, S2 and the final. Q1/Q3 are bye allocations, not two extra games. Repeat this fixture with teams; lineup size changes readiness, not the bracket.

### H3-BR-03 Draft, fixed bracket and publication

Before fixing, show the field, seed procedure, byes, crossings and future-slot sources for explicit review. A field change invalidates the draft; regeneration and a fresh review are required. A stale preview cannot be published, even if its entrant count is unchanged.

Propose that the first pairing publication fixes the entire bracket topology and entrant allocations. After fixing, no reseeding or entrant replacement: a departure becomes an incident at its existing slot. This is stricter than the baseline's minimum prohibition of replacement once running and requires explicit review. A future withdrawal/republication operation is not implied by generating another preview.

The full bracket may be visible as structure while future slots still say “winner of Q2”. This does not publish the dependent match. Record separately the planned source, its current derived entrant, and whether that pairing is published. Do not label a draft opponent as a confirmed published opponent.

## 5. Advancement, round operations and final positions

### H3-AV-01 Effective results and destinations

Each non-final winner feeds exactly one declared successor slot; a loser never advances. The final has no successor: its effective result enables final review. Slot sources remain traceable through result revisions. A pending report, open dispute or correction request is not an effective winner. Silence does not resolve a report. Apply H2's selected reporting mode, independent-referee rules and current representative authority.

Where a successor exists, an effective resolution derives its assignment once. A bye derives its advancement without a fictitious effective played result. A future slot may show its source while unresolved; do not populate it with a predicted winner.

### H3-AV-02 Round publication and readiness

Propose complete-round publication. The terminal completion of a round makes the next round reviewable, but does not publish it automatically. Require current effective sources and settled incidents for every destination before publishing the next round. A source explicitly resolved without a qualifier follows §6 rather than pretending to supply a winner. Independent branch publication is an alternative decision, not silently included.

Derived bracket/position views must disclose when updating. Never publish dependent pairings from a stale projection. Publishing does not start play: recheck current authority, state, eligibility and required team lineups at match start. Missing eligible starters block start and require an explicit incident decision; they do not automatically withdraw the team.

### H3-AV-03 Positions and review barrier

In an ordinary completed bracket, the final determines first and second; semifinal losers share third and quarter-final losers share fifth, continuing by elimination round. Do not break these shared positions by seed, score or game differential. No third-place match exists by default.

A resolved final enables review, not automatic finalisation. Apply the baseline §9.3 review-barrier proposal, extended to current advancement and final positions; D-24 must be settled before that slice. Current competitive facts, applied derived state and reviewed state must agree. A concurrent correction, sanction or withdrawal invalidates review; preserve the previous approved final revision on reopening.

Terminal exceptions, sanctions and an empty final require the policy in §6. Do not silently give them ordinary placing labels or a fabricated champion.

## 6. Withdrawal, absence and exceptional progression

### H3-EX-01 Distinguish causes and advancement

The H1 league's proposed 0/0 handling does not determine who occupies an elimination successor slot. Maintain separate cause, effective outcome, actual-play evidence and advancement. The following is a proposed complete direction requiring the decisions in D-42, including exceptional positions, before implementation.

| Condition | Proposed observable treatment |
| --- | --- |
| Departure before fixing | Revise field, invalidate old draft, regenerate and review |
| Departure after fixing; eligible opponent remains | Keep slot; explicit concession/absence resolution and administrative advance of opponent |
| Winner departs before next round publication | Keep prior effective result; resolve their next slot under departure policy; never revive the earlier loser |
| Team understrength | Block play and show the readiness incident; no automatic team withdrawal |
| Double absence/disqualification or no contest | Reasoned resolution without winner; successor source becomes “no qualifier”, requiring director review |
| One successor source has no qualifier and the other has an eligible entrant | Explicit administrative advance; distinguish from an initial bye; no invented play or score |
| Both sources have no qualifier | After review, propagate no qualifier; no reserve insertion or reinstatement of eliminated entrants |
| Final cannot produce a winner | Exceptional reviewed closure without a champion; retained causes/history; positions must follow the explicitly agreed exceptional policy |
| Tournament cancelled | Remain cancelled; retain earlier facts and add no champion from partial progression |

If both entrants withdraw in a different order, final resolution and slot state must be the same. Where a second withdrawal invalidates an earlier administrative advance, revise only under the dependency checks. A published successor blocks the ordinary operation and leaves an incident for review; do not partially apply the departure or rewrite published opponents.

Whether the non-qualifier/exceptional-closure policy is accepted, how affected positions are shown and which director action resolves each incident are blocking product questions. They remain explicit in D-42. Until settled, the elimination profile is not implementation-ready; no arbitrary fallback winner is permitted.

### H3-EX-02 Administrative evidence

Concession before play, concession after play, absence, disqualification, no contest and cancellation remain distinct. Require reason and authorised source under the inherited result contract. Retain actual-play evidence even if the match receives an administrative winner or no winner. A Bo3 conceded at a real 1–0 does not acquire an invented second game.

## 7. Result profiles and compatibility

### H3-RP-01 Decisive outcome-only

Record a winner among the assigned entrants without requiring a numeric score. Reject a terminal draw when advancement needs a winner; explain the profile rule without discarding input. A contradictory or unsupported result is not coerced into a win or decided by seed.

Preserve the H1 generic draw-capable outcome-only profile; no-draw is a separate versioned profile choice. Profile/version is fixed for a started tournament under the baseline lifecycle. A catalogue update never alters its validation retrospectively.

### H3-RP-02 Aggregate best-of-three

Propose a decisive first-to-two-wins profile, without drawn games or time-limit rules in its initial form. Ordinary completed scores are 2–0, 2–1 and their reverses. Reject 0–0, 1–0, 1–1, 2–2, 3–0, negatives and fractions. Derive the winner on the server; reject a supplied winner inconsistent with evidence.

Aggregate 2–1 does not establish game order. Do not invent ordered games to complete a display. The series is one match with one effective result and, where a successor exists, one advancement, including when each side fields several players. Administrative resolution of an unfinished series follows §6, retaining actual evidence rather than passing ordinary completed-series validation.

### H3-RP-03 Conditional detail and direct score

Game/map detail is in the H3 milestone where needed, but must have a concrete first use case and explicit recording mode. If delivered, detailed W–L–W is a valid 2–1; W–W–L is invalid because play continued after the decisive win. Required detail cannot be omitted and supplied detail must agree with the aggregate. Aggregate-only does not require fabricated detail.

The [result-profile proposal](result-profiles-proposal.md) separately proposes a bounded direct-score follow-on to H1, or H3 if deferred. Check actual delivery before including it. If approved, use two non-negative integers with explicit numeric limits, higher score wins and equality only where the profile permits it. These scores do not change standings points. Do not claim this optional addition or sport-specific sets approved through this discovery.

Configuration and result entry expose supported capabilities, profile/version and required inputs. Unknown models produce an explicit compatibility error, not silent reinterpretation as a generic win. Two tournaments with different profiles run concurrently without changing client logic or contaminating each other's validation. A generic renderer or public rules/plugin SDK is not required.

## 8. Single-match tournaments

### H3-SM-01 Two entrants and one match

Exactly two entrants, one stage and one match. Reuse admission, readiness, pairing publication, result acceptance, incidents, correction, history and final review. No separate shortcut bypasses authority or outcome validation. With one eligible entrant, do not start or convert the tournament into a bye victory. Team matches require their lineup; individual matches do not.

### H3-SM-02 Draws and final presentation

Propose allowing a single-match draw where its selected profile permits one, because no later slot requires a winner. With a winner, positions are first and second. For an allowed draw, propose a clearly labelled tied result with shared first position and no unique champion; this placing/presentation policy needs maintainer agreement under D-44. A decisive profile still rejects a draw. An absence requires an authorised explicit resolution, not a timer or the opponent's silence.

## 9. Corrections, notices and protected history

### H3-CR-01 Impact and published dependencies

Preview old/new outcome, evidence, cause, winner, affected appearances, destination slots and dependent pairings. Even a score-only correction with the same winner retains revisions and passes the dependency policy; no silent exception bypasses it.

Propose retaining D-07's initial safe-correction limit: without published competitive dependencies, apply once and update derived unpublished slots consistently. Invalidate a dependent draft for fresh review, including participant-specific preparation that referred to the displaced entrant. Do not reuse another team's lineup.

If a dependent semifinal is published, identify it and block the ordinary quarter-final correction. Withdrawal/republication without play would need a separately defined operation and approval; this discovery does not deliver it. A started/resolved semifinal also blocks ordinary correction. Showing future bracket structure alone is not publication and does not create that blocker.

Publication and correction racing on an origin cannot both succeed with incompatible facts. Validate current authoritative conditions at confirmation; return a recoverable conflict requiring refreshed impact review. Reopening a finalised tournament neither removes dependency checks nor erases its prior approved result. A participant correction request leaves the effective result unchanged until an allowed decision.

### H3-NT-01 Target notices and history

Reuse H2 in-app notices for published opponents, requested confirmation, disputes/resolution, relevant corrections and revised final results. Derivation of a future slot is not itself a published-match notice. Failure to deliver does not roll back advancement; deduplicate by fact, recipient and channel. Guests without accounts remain organiser communication work, without a false delivery claim.

History distinguishes played matches, byes, administrative advances, registered reserves and actual appearances. Corrected results disclose revisions. Public bracket/results contain reviewed aliases and permitted facts, never private rosters, lineups, contact details or dispute evidence. Inherit current visibility and representation on every read, including notice targets; a bracket node identifier grants no private access.

These are target notifiable facts, not new published contracts. Follow [ADR 0017](adr/0017-notifications-consume-fact-events.md) and update its fact/consumer inventory when a production slice introduces them. Email and webhooks remain H5.

## 10. Public API and observable recovery

All H3 operations have authorised API equivalents: read capabilities/profiles and field, prepare/review bracket, publish rounds, read slot provenance/status, start, report/respond/resolve, preview permitted corrections and review/finalise. These are functional capabilities, not endpoint names or final payload designs.

Keep planned source, currently derived entrant and published pairing status distinguishable. Use current permissions, expected revisions and operation identities. The same operation/content returns its original receipt without duplicate result, advance or notice; changed content conflicts. Lost responses are reconciled through authorised receipts/current state, never assumed successful. Distinguish validation, forbidden, stale, blocked dependency, processing and confirmed success without disclosing private resources.

Profile and bracket views disclose revision/freshness. Stale projections may show “updating”, but cannot authorise dependent publication or finalisation. The coordination design must identify authoritative field, result and pairing conditions across owners; this document selects no module split, global counter, persistence or messaging mechanism.

## 11. End-to-end user journeys

| Journey | Main path | Recovery and success |
| --- | --- | --- |
| H3-UJ-01 Individual bracket | Configure → admit/check in → seed/review → publish → play/resolve → review next round → finalise | Six entrants, two byes, five played matches; no lineup work; traceable winner destinations |
| H3-UJ-02 Direct-team bracket | Prepare eligible roster → review same bracket → lock each match lineup → resolve series → advance | One entrant per team; understrength blocks play; no appearance from a bye or unused reserve |
| H3-UJ-03 Single match | Configure two entrants/profile → publish → resolve → review/close | Draw only by compatible profile; no one-entry automatic champion |
| H3-UJ-04 Correction | Propose old/new result → review impact → apply or inspect blocker | Unpublished destination updates once; published dependency blocks partial repair |
| H3-UJ-05 Exceptional branch | Record departure/no winner → review destination → administrative progression or exceptional close | No revived loser, invented game or implicit champion; policy subject to D-42 |
| H3-UJ-06 Independent API | Complete individual/team journeys through authorised client | Receipts, stale conflicts, current grants and profile differences explain the same state as web |

## 12. Acceptance scenarios and visual handoff

These are target acceptance scenarios for later slices, not claims of passing executable tests. Repeat the essential journeys by web and an independent API client; unresolved policy gates prevent declaring their scenarios implementation-ready.

| ID | Given / action | Expected observable outcome |
| --- | --- | --- |
| H3-AT-01 Six individuals | Generate and complete the A–F reference field | Eight slots, two initial byes, five played matches absent incidents; correct shared places; no loser advances |
| H3-AT-02 Six teams | Repeat with five active players per team | Same bracket counts; four starters block play; bye needs no lineup and adds no appearances |
| H3-AT-03 Field sizes | Prepare 2, 3, 5 and 8 entrants; try zero/one | B = 2/4/8/8, byes = 0/1/3/0, played matches = 1/2/4/7 without incidents; invalid start rejected |
| H3-AT-04 Reproducibility | Retry draw; intentionally redraw or alter field | Retry preserves assignment; explicit redraw retains predecessor; field changes invalidate reviewed draft |
| H3-AT-05 Pending/disputed | Report Q2, leave silent, then dispute | No effective winner or confirmed S1 entrant from the pending report; independent decision required |
| H3-AT-06 Publication | Last effective result completes round; review/publish next | No automatic publication; current sources assign each winner to exactly one correct slot |
| H3-AT-07 Terminal draw | Submit draw to decisive elimination profile | Rejected without advancement; explanation and input retained |
| H3-AT-08 Bo3 validation | Submit 2–0/2–1/reverses; 3–0/1–1/fraction or contradictory winner | Only valid ordinary terminal scores accepted; one derived winner and advance where a successor exists |
| H3-AT-09 Evidence | Aggregate 2–1; administrative concession with real 1–0 | No invented order in first case or second game in second; cause/evidence preserved |
| H3-AT-10 Profiles | Run different profiles concurrently; update catalogue | Independent validation/presentation; started tournament keeps its version |
| H3-AT-11 Individual API | Complete individual journey without team payloads | No roster/lineup ID, singleton array or lock command required |
| H3-AT-12 Safe correction | Correct origin before dependent publication | Predecessor retained; unpublished slot updated once; obsolete draft invalidated |
| H3-AT-13 Published blocker | Correct quarter-final after semifinal published or started | Affected dependency named; no partial result/opponent change |
| H3-AT-14 Race | Publish semifinal while correcting its origin | Incompatible operations cannot both apply; stale side refreshes/reviews |
| H3-AT-15 Departure | Withdraw before and after fixing | Before: review regenerated field; after: slot retained and explicit administrative treatment, no replacement |
| H3-AT-16 Double departure | Withdraw both sides in both orders; empty a branch | Same final state; published dependency blocks revision; no revived loser or fictitious score |
| H3-AT-17 No final winner | Apply the agreed exceptional-closure policy | Reasoned closure without champion; affected positions follow explicit decision, no fabricated play |
| H3-AT-18 Single match | Individual/team, draw-capable/decisive; capacity three | Two entrants/one match; draw only by compatible profile; inconsistent capacity rejected |
| H3-AT-19 Recovery | Duplicate result, lost response, revoked grant | One result/advance; recoverable receipt; new revoked operations denied |
| H3-AT-20 Privacy | Read private bracket/node/dispute as unauthorised visitor | No protected-content leak; public aliases never expose private team data |
| H3-AT-21 Final review | Correct during final review; reopen after finalisation | Stale review cannot finalise; new approval retains previous final revision |
| H3-AT-22 Team Bo3 | Attempt lineup change between games | Rejected under proposed H3 policy; unused reserves have no appearances; one team outcome |
| H3-AT-23 Notice | Duplicate or fail delivery after advancement | No duplicate visible notice or competitive reversal; target rechecks access |
| H3-AT-24 Accessible bracket | Navigate pending origin, bye and errors on mobile/keyboard | Equivalent meaning in round list; state and next action understandable without colour or tree layout |

If direct score or ordered detail is approved, its slice adds §7.3 acceptance for numeric limits, compatible equality, contradictory evidence and play after resolution. Preserve H1 league and H2 confirmation/privacy regression coverage.

Future surfaces are configuration/profile compatibility; field/seeding/bracket preview; desktop bracket/mobile round list; match/profile/result/incident; round operations; correction impact; final review and protected history/notices. [Visual direction §9.5](herald-visual-direction.md#95-h3-screenstate-inventory) owns the concrete screen/state inventory. No H3 mockup is approved by this document. Each later screen slice needs reviewed visual evidence and executable scenarios; this documentation change creates no screen and needs no executable UI script.

## 13. Decision summary, gates and delivery handoff

Authoritative statuses remain D-39–47 in the [single decision register](herald-functional-discovery.md#15-decision-register-and-development-gates). This summary identifies review topics without creating another status ledger. The maintainer owns product decisions; engineering/design provide feasibility, contracts and acceptance evidence.

| Register | Decision covered | Rule reference |
| --- | --- | --- |
| D-39 | Seed source, reproducibility and proposed recursive distribution of initial byes | §4.1–4.2 |
| D-40 | First publication fixes bracket; no post-fixing replacement; changed field invalidates draft | §4.3 |
| D-41 | Complete-round publication, visible future structure, effective advancement and shared places | §5 |
| D-42 | No qualifier, double departure, administrative progression, exceptional final closure and positions | §6 |
| D-43 | Decisive outcome-only/Bo3 scope; detail by use case; direct score conditional | §3.1, §7 |
| D-44 | Two-entry single match, compatible draw and tied final presentation | §8 |
| D-45 | Safe corrections and current revision barrier; no ordinary published-dependency rollback | §9.1, §10 |
| D-46 | One lineup for whole team series; no substitutions or appearance from byes | §3.3 |
| D-47 | Supported field maximum and operational/accessibility evidence | §3.2, §12 |

First explore the six-entry fixture and settle D-39–41. Then simulate double withdrawal, no contest, an empty final and a correction/publication race, settling D-42/45; agree affected exceptional positions rather than leaving them to implementation. Validate profiles, single match and lineup invariants for D-43/44/46, followed by maximum-field and screen review for D-47. Each agreement needs a rule, example and counterexample in the shared register or linked accepted decision.

Implementation gates: verify the contracts actually delivered by H1/H2; resolve inherited D-07/23/24/25 and reporting/authority gates where relevant; agree field/result/advancement coordination and current grants; review profile capabilities; complete affected mockups and target-test assignment. Scope agreement neither fixes architecture nor proves a prerequisite implemented.

Suggested functional batches: (1) decisive profiles and single match; (2) reproducible elimination preview; (3) round operations, progression and positions; (4) aggregate Bo3; (5) exceptional progression, correction and final review, with each earlier batch including the incidents/authority/notices needed for a valid vertical journey. These are sizing inputs, not approved delivery tasks. Direct score and ordered detail are separate conditional slices after D-43 review. Follow the repository's current batch/preview process when proposing production changes.

H3 exit requires the §12 scenarios assigned to reviewed slices with observable evidence, both individual and direct-team web/API journeys, the six-entry reference bracket, no fabricated play, compatible profiles, safe corrections, protected history and current final results. Keep this documentation change active for review; do not archive H3 product targets into implemented specifications.
