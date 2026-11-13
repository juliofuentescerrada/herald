# Herald H4 — Swiss and Connected Consumer Functional Discovery

Version 0.1 · 13 November 2026 · Functional definition for review; no implementation claimed

## 1. Purpose, authority and decision status

H4 lets an organiser run reproducible Swiss rounds and complete a connected tournament with a real external consumer. Herald supplies competitive opponents and effective standings; the consumer executes assigned matches. Individuals and direct teams remain competitive entries, not collections of scoring slots.

This is an extension of the [functional baseline](herald-functional-discovery.md), especially §7.4, F-11/F-12 and H4 in §14. The [single decision register, §15](herald-functional-discovery.md#15-decision-register-and-development-gates) owns status. D-01/03/11/12/13/15 remain dependencies; D-48–56 describe the recommendations developed here. The [roadmap](roadmap.md) owns delivery order, and [visual direction](herald-visual-direction.md#h4-screenstate-inventory) owns future screen/state coverage. Implemented behaviour remains in `openspec/specs/`.

**Existing scope:** Swiss, shared scoring/tiebreaker formulae, synthetic entrants, stable external references, an authorised result source and reconnect/cancellation/concurrent-revision handling already belong to H4. The public API is confirmed scope; the proposed F-12 division of connected authority is not thereby confirmed.

**Proposed defaults:** all new sporting and execution policies below are recommendations for maintainer review. Preparing this discovery confirms no new policy, runtime contract or implementation approval. Where an inherited rule is partial/proposed, its status remains unchanged. §13 gives owners and decision gates rather than requiring policy agreement to finish documentation.

**Observed baseline:** at `132721b` on `main`, H1 foundations, access, setup, registration, guest entries, rosters and check-in have implemented specifications. Competition start, pairings, results, standings and connected execution are not implemented milestones. H2 is a documented target. The [H3 discovery in PR #56](https://github.com/juliofuentescerrada/herald/pull/56), branch `docs/h3-functional-discovery` at `878cd8b`, is an unmerged reference for format and depth, not accepted authority. Its D-39–47 are reserved here to avoid collision; no content from that branch is incorporated. H4 does not assume H1, M4, H2 or H3 completion.

## 2. Outcomes, actors and boundaries

### 2.1 Outcomes

1. A director announces one versioned Swiss policy and round count, explains every pairing/bye and reproduces it from retained evidence.
2. Participants distinguish draft opponents, published assignments, real play, administrative outcomes and provisional/final positions.
3. A real consumer verifies compatibility, executes only assigned work and recovers a lost response without replaying an already-produced result.
4. Concurrent corrections, withdrawals and executor changes cannot create two effective outcomes or publish stale pairings.
5. Unsupported rules, exhausted search and engine failures become visible incidents without fabricated sporting results.

### 2.2 Actors and authority

| Actor | Authority in the target flow | Limit |
| --- | --- | --- |
| Visitor | Read permitted published rounds, standings and explanations | No draft field, credentials, private mappings or operational evidence |
| Individual participant | Own readiness, reports/responses under the selected reporting mode | No pairing, assignment or result-source powers; no lineup work |
| Team representative | Own represented team's readiness, lineup and permitted results | Current representation; membership alone grants no powers |
| Owner/director | Configure/review/publish rounds, resolve scoped operational incidents, review final results | Cannot silently relax pairing constraints, erase execution evidence or bypass correction blockers |
| Scoped referee | Reasoned independent incident/result resolution | Inherited H2 independence and scope; no adjudication for their own side |
| Delegated interactive client | User's explicitly permitted operations | Application identity does not increase user authority |
| Execution application | Read and execute current assignments; submit outcomes under its explicit source grant | No general administration, entry ownership, new-round publication or unrestricted result correction |
| Automatic process | Validate/derive effective state and recognise terminal rounds | No automatic next-round publication, tournament start, sporting judgement or finalisation |

Revocation is checked on every new privileged action, including previously prepared submissions. Retain responsible person where applicable, application/source and effective grant in evidence; a receipt or external reference grants no permission. A human director's corrective action is separately attributable from engine output.

### 2.3 Scope and dependencies

Includes one-stage Swiss over individual/direct-team entries; a fully specified generic candidate policy; shared numerical fixtures; explicit byes/floats; current-round operations and safe corrections; one real connected adapter; synthetic competitors; compatibility negotiation; assignment and recovery semantics; web/API parity; protected history and target notices.

Excludes official federation certification, game rules in the core, arbitrary pairing scripts, acceleration, colour/side balancing, venue scheduling, cross-round simultaneous Swiss play, cuts or combined stages, play-offs, local-tournament imports, bidirectional offline direction, mid-tournament authority switching, multiple concurrent executors, per-action game streaming, composite team encounters, substitutions, email and webhooks. Those need separate scope decisions; H5/H6 retain their roadmap responsibilities.

H1's effective-result, revision and organisation boundaries are prerequisites to implement, not proof of current availability. M4 precedes H2; H2 owns participant authority, confirmation/disputes, inbox and protected history. H3 profiles may be reused only where delivered and explicitly compatible. The real consumer, supported game/variant and result granularity must be identified and validated under D-11/51 before claiming H4 interoperability.

## 3. Configuration and invariants

### H4-CF-01 Versioned competition policy

Before start announce entrant kind, effective result profile, Swiss algorithm/version, fixed round count R, scoring, complete tiebreak order, bye/withdrawal rules and participation requirements. Recommend a minimum of two eligible entries, R ≥ 1, and R ≤ n−1 for starting field n. The bound is necessary but does not guarantee feasible later rounds, especially after departures. No elimination or cut is implied by the number of rounds. Do not silently shorten R or repeat opponents when the field shrinks; use §6.

Eight entries over three rounds and 32 over five are baseline validation fixtures, not a logarithmic round-count rule or operational maximum. Agree supported size/search limits and measurable response bounds before implementation. Lock rules and seed order at start; catalogue changes do not change a running tournament. Public material distinguishes configured rounds, completed rounds and current provisional ranking.

### H4-CF-02 Competitive identity and play

One entry receives one pairing, bye or explicit inactive status per round. Eight five-player teams are eight entries, not forty. A team bye needs no fictional lineup. A played team match needs the eligible, locked lineup revisions of both teams; substitutions/composite submatches remain excluded. Count actual appearances only from evidenced play, never from admission, a bye or merely locking a lineup.

An individual completes web/API flows without synthetic teams, singleton roster arrays or lineup commands. Synthetic entries carry a distinct non-human classification; controlled actors of a synthetic team are not human accounts, roster memberships or personal history claims. Exact mapping of synthetic team actors to executable participation is an adapter gate, not permission to bypass team readiness.

## 4. Swiss pairing and publication

### H4-SW-01 Input snapshot and deterministic objective

Recommend a deliberately generic global matching policy rather than claiming an official Swiss ruleset. Pair only the active field for round k using all effective results through k−1. Every prior round must be terminal, all disputes resolved and the authoritative points input current. Never generate from an eventually consistent screen count or pending report.

Retain tournament/rules version, round, ordered active entrant IDs, seed rank, prior opponents, competitive-bye history, effective result/field revisions, points, candidate policy version and search outcome. Seed rank is admission order or an explicit recorded draw before start; the stored resulting order is the tie key. Retries reproduce the same input/output, not a fresh random choice.

Hard constraints: no self-pair; no repeat opponent (including a previously published administrative encounter); every active entry covered exactly once; one competitive bye only if odd; no entry receives a second competitive bye. An unpublished draft creates no prior-opponent history. A withdrawn unpublished round creates no played result; restoring an earlier publication must preserve its history explicitly.

For an even field enumerate feasible complete matchings. For each compute all absolute match-point differences, sort them descending and minimise that vector lexicographically. This minimises the largest gap first, then the next, rather than making a locally attractive pair that strands another group. With equal gap vectors, sort each pair's seed ranks ascending, sort pairs lexicographically and choose the smallest flattened seed vector. Table/side presentation follows that order and has no sporting preference. Entrant IDs never depend on translated aliases.

A float is a cross-score pairing, not an extra slot or round. Display both score groups and the gap. This candidate policy does not balance repeated up/down floats or colours; if the real consumer requires those properties, select a separately versioned compatible policy before execution. It cannot silently substitute them.

### H4-SW-02 Odd field and feasibility

For an odd field, order eligible bye candidates by ascending points, then descending seed rank (lowest-ranked first among equals). A prior competitive bye excludes a candidate. Recommend also excluding recipients of an administrative win without play, preventing multiple free win-point awards; a draw/no-contest without win points does not exclude them. For each candidate in order, test whether the remaining graph admits a complete legal matching; select the first feasible candidate and then §4.1's optimum for that remaining graph. Bye priority takes precedence over comparing gaps across different bye candidates.

The bye awards the profile's win points and no played match/game/appearance. At most one such bye per entry per tournament. If all candidates fail, publish nothing. Show separately proven infeasibility and search-budget exhaustion; the latter does not prove no matching exists. Never relax a hard constraint automatically. A bounded deterministic search must prove the optimum before presenting the draft as publishable; an interrupted search retains diagnostic evidence and can be retried with the same input.

Example: A–E all have zero points, seeds 1–5. E is the first bye candidate; absent history the pairs are A–B and C–D. Next round E is excluded from another bye even if E is again lowest on points. A different candidate can be necessary if removing E leaves two remaining entries whose only possible opponent is each other and they have already met.

### H4-SW-03 Draft → review → publication → completion

| State/transition | Required condition | Observable effect |
| --- | --- | --- |
| Generate draft | Started competition; prior rounds terminal/current; active field and policy known | Versioned preview, pairings, floats, bye and explanations; no executable assignment or public opponent |
| Replace draft | Explicit director action on current inputs | Retain predecessor and reason; unchanged inputs reproduce output |
| Publish | Current authority, same reviewed field/results/rules, complete valid draft | Whole round becomes published once; bye effective without play; eligible assignments may be requested |
| Execute/resolve | Current assignment and readiness, permitted reporting mode | Pending result changes no points; effective result changes standings once |
| Complete | All matches terminal including explicit administrative incidents | Round terminal; director can review next draft; no automatic publication |
| Review/finalise | R rounds terminal and authoritative standings current | Reviewed final revision; no automatic champion while incidents remain |

A concurrent withdrawal/correction invalidates an affected draft even when points/count happen to remain equal. Publication is all-or-nothing. Unlike H1's planned out-of-order league play, Swiss round k+1 cannot be published before k is terminal. No future published opponents are guessed. Duplicate publication returns its receipt; stale intent requires a fresh review.

## 5. Points, tiebreakers and ranking

### H4-ST-01 Proposed shared generic profile

Recommend a first explicit outcome-only profile: played win = 3, draw = 1 per side, loss = 0; competitive bye = 3; explicit no contest/double absence = 0 each. Administrative win = 3 and loss = 0, with cause separate from actual play. This is a new Swiss proposal, not an extension of H1 approval to every system. A consumer requiring game-win percentages or best-of-three detail must supply a separate complete profile and fixtures; do not derive game statistics from outcome-only results.

Recommend ordering by total match points, then opponents' match-win percentage (OMW), then shared position. No head-to-head, random winner or seed rank breaks a standings tie. Seed rank is only a pairing tie key. Tied entries show the same position, followed by competition ranking (1, 1, 3); stable seed order may order display rows without claiming distinct sporting positions. Tied first remains tied first, no invented unique champion.

For entry i, let m_i be its terminal two-entry matches so far, including administrative outcomes and no contests; exclude its competitive byes, future rounds, pending results and rounds missed after withdrawal. Let p_i be points earned in those matches only, excluding bye points. Define q_i = max(1/3, p_i / (3 × m_i)) when m_i > 0; q_i = 1/3 otherwise. For an entrant's opponent list O (one occurrence per terminal two-entry match), OMW = sum(q_j for j in O) / |O|; if O is empty use 1/3. These are exact rational values. Do not round per opponent or for comparison; display percentages to two decimals, rounding half up. The one-third floor is exactly 1/3, not 0.33.

A bye adds total points but no opponent or denominator. An administrative two-entry match contributes its opponent and recorded points but no actual games. A withdrawn opponent retains their terminal matches: no future losses or fictitious matches enter q. Historical round views keep their original input revision; current provisional OMW uses opponents' current terminal records and can change even without another match for the displayed entrant. Corrections recompute affected opponent statistics transitively.

### H4-ST-02 Numerical review fixtures

| Fixture | Hand-derived expectation under §5.1 |
| --- | --- |
| A beats B; C draws D in round one | A has 3 points, OMW 1/3; B has 0, OMW 1; C/D each have 1, OMW 1/3 |
| E only receives a bye | E has 3 points, no played match, q_E = 1/3, OMW = 1/3, no appearance |
| A has opponents B and C with q_B = 1/3 and q_C = 2/3 | A's OMW is exactly 1/2, displayed 50.00% |
| Opponent B wins once then withdraws | q_B = 1; withdrawal adds no denominator; earlier opponent's OMW uses that retained record |
| Administrative A win over B; C–D no contest | A/B points 3/0, C/D 0/0; each has m = 1; q_A = 1, other q values 1/3; no actual game inferred |
| Two equal point/OMW rows, then a lower row | Shared position 1, 1, 3; seed display order does not award a winner |

Before delivery, Herald and the actual consumer must agree independent expected outputs for complete eight-/32-entry runs, byes, draws, administrative wins, no contests, withdrawal, correction, exact ties and near-equal fractions with identical displayed percentages. These examples are arithmetic review evidence, not an executed suite or a promise of compatibility with an official game's formulae.

## 6. Incidents, withdrawal and corrections

### H4-EX-01 Departures and unsatisfiable rounds

Before publication, withdrawal removes the entry from the next draft and invalidates an existing review. After publication, retain both opponents; an authorised director/referee resolves the current encounter under the announced administrative policy. Recommend preserving played outcomes and awarding only the current published unplayed encounter, not manufacturing opponents/losses for Swiss rounds not yet generated. A future inactive entry receives no new pairing or bye and remains in standings/history, visibly withdrawn. Re-entry after competitive withdrawal is excluded from the first policy.

For two withdrawn opponents, propose one order-independent double-absence outcome with zero points, superseding any provisional administrative award under the same dependency/correction checks. For engine failure, computation limit, interrupted session or unsupported configuration, leave the encounter unresolved: retry/recover execution or request an explicit human decision. None is automatically a draw, concession or no contest.

If fewer than two active entries remain or no legal next round exists, stop with a reasoned incident. Recommend exceptional closure with completed results and a conspicuous incomplete-round-count label only after maintainer policy agreement; do not reduce R, award a final bye to create a champion or mark configured success. Search exhaustion may instead be retried or investigated. A manual pairing proposal must satisfy every hard constraint and disclose that the director selected it; permission to relax rematches/byes is outside this initial policy.

### H4-CR-01 Current-state impact and recovery

Propose ordinary correction only while no dependent later Swiss round has been published (D-07/54). All later rounds depend on prior results/field for their pairing inputs, even if correcting a score appears not to change the winning side. Preview old/new outcome, points, affected OMW, draft invalidation and final-review consequences. Recheck authority and all relevant revisions atomically at application; a concurrent publication and incompatible correction cannot both succeed.

Before dependent publication, retain predecessor, actor/source, time, reason and input references; invalidate drafts and rebuild standings from effective records. A stale standings projection shows updating and blocks pairing/finalisation, rather than authorising from the old table. Published dependencies produce an explicit blocker and no partial repair; exceptional rollback/replay needs a separate policy. Reopening a final review preserves the old final revision, creates a new review and never bypasses a dependency. Recovery from worker failure reconciles retained effective state, not operational logs as audit truth (ADR 0007).

## 7. Connected authority, identity and compatibility

### H4-CO-01 One competitive authority

Develop F-12's proposed split: Herald owns entries, published pairings, accepted results, points and final review; the consumer owns game execution/state and executable configuration. Neither side treats copying a local bracket as reconciliation. In connected mode no new opponents, competitive bye, next round or local correction is generated offline. Existing authorised work may finish offline, but acceptance still checks the current assignment/grant/state on reconnect.

Recommend binding mode, consumer and compatibility agreement before first publication; no in-place switch to local authority. Local tournaments remain visibly separate. Importing/merging local state or switching authority is excluded. No credential or database is provisioned by this documentation change.

### H4-ID-01 Stable external references and synthetic entries

Map external references within application + organisation + resource kind; retain the Herald tournament/entry IDs returned. Retrying identical registration returns the same mapping, changed content conflicts, and changing an alias never creates another entrant. Do not infer identity from name/email. The same external string in another organisation/application is independent. A mapping update must be explicit, auditable and cannot transfer prior results to another competitor.

Synthetic individual/team entries do not need human sign-in or create public personal histories. Label them as synthetic in permitted competition views; expose only aliases and competitive facts allowed by visibility, never engine internals or external private identifiers. Human team members retain accepted membership/representation and protected appearance semantics. Do not relabel a guest/human as synthetic to evade rights or eligibility.

### H4-CP-01 Compatibility before executable work

The consumer declares supported system/profile versions, entrant kinds, active-player counts, result granularity, draw/administrative handling, round/field bounds and relevant game/variant/configuration versions. Both sides compare exact scoring/tiebreak semantics, not just a profile name. Return a concrete incompatibility (for example: team requires five active players but adapter supports individual only) before assignment.

Store the agreed versions with the tournament/execution evidence. An engine update does not reinterpret completed results or silently change a running tournament's profile. An incompatible update pauses new work; either continue the recorded supported version or obtain an explicit separately reviewed migration. The first real adapter may support individuals only; independent team fixtures still validate Herald's entry and locked-lineup contract. A test double alone does not satisfy the real-consumer exit.

## 8. Execution lifecycle, reattempts and cancellation

### H4-EXE-01 Assignment and fencing

Recommend one authorised execution application per connected tournament initially, with at most one current attempt per match. One application may restart or have two process instances, so a single configured executor is insufficient protection against duplicate work.

| Execution state | Transition and evidence |
| --- | --- |
| Unassigned | Published match, current readiness, accepted compatibility and explicit source grant allow assignment |
| Assigned | Persist unique attempt identity, generation/fence, application, match/entrant IDs, profile, expected revisions and team lineup references; retry returns same assignment |
| Running / outcome retained locally | Consumer durably records assignment and terminal payload before submitting; status is execution evidence, not an effective result |
| Submitted | Validate current fence, authority, state, revisions, identities and result profile; retain received/applied/rejected receipt |
| Applied or pending confirmation | Direct effect only under explicit result-source authority; otherwise H2 reporting mode applies; application identity alone never confirms |
| Failed / revoked / superseded | No sporting result; explicit reasoned recovery may create a new generation; reject submissions from the old generation |

Propose explicit replacement without automatic time expiry for the first pilot: a timeout flags stalled work for review but does not transfer authority. Replacement fences the old attempt before new work; record actor and reason. This supports disconnected completion without pretending a wall-clock lease remained valid. A new lease/multiple-executor scheme requires its own agreed expiry/clock/fencing contract before scope expands (D-13/53).

### H4-EXE-02 Submission and lost response

Send Herald match/entrant IDs, assignment/attempt generation, execution reference, completed outcome/score, operation identity, expected revisions and applicable locked lineups. Propose binding one immutable terminal payload to an attempt. Same operation/content returns the same receipt; changed content conflicts. A second operation identity cannot apply another result for the same terminal attempt/match. Correction is a separate authorised operation, not a mutated engine retry.

After a lost response, keep the produced outcome locally, query the authorised receipt and current match/attempt, then resend the identical operation only if needed. Received/processing is not applied. Rejected/stale intent needs inspection; do not replace its expected revision automatically. If the receipt is temporarily unavailable, wait/reconcile rather than simulate again. If local evidence was lost, query Herald before any re-execution; if neither side has enough evidence, open an incident and fence/reassign explicitly.

Recommend retaining immutable operation receipts and terminal attempt identity through tournament archival, with a published minimum recovery window before pilot approval. Exact duration, purge/identity retention and post-expiry behaviour remain D-55 gates. Inbox deduplication windows are not the API's business idempotency guarantee (ADR 0008). Past receipt reads remain subject to current access; revocation does not erase evidence.

### H4-EXE-03 Races and revocation

| Race/failure | Required observable resolution |
| --- | --- |
| Two instances claim the same match | Same assignment or one explicit conflict; at most one current generation |
| Old attempt submits after reassignment | Stale assignment rejection; retain attempted provenance, no points |
| Cancellation races result acceptance | Authoritative ordering: acceptance first is retained as pre-cancellation history; cancellation first rejects the late outcome; no new work after cancellation |
| Readiness/lineup changes before play | Invalidate stale assignment/start permission; lock replacement under inherited policy; no silent player substitution |
| Grant revoked during offline play | Reject new submission under revoked authority; director reviews retained output via a separately authorised action |
| Process crashes after remote apply | Recover receipt/current result; no repeated points, notice or game execution required |
| Message redelivery/reordered projection | Highest source revision only; no rollback, duplicate result or stale next-round authorisation |

Competition state and assignment validity need authoritative current-condition coordination. Cancellation cannot rely solely on a delayed projection and accept forbidden late work. The implementation design must specify owners and revision barriers under D-08, not invent cross-module direct references.

## 9. API, notices, privacy and durable history

### H4-API-01 Functional contract

Expose authorised equivalents for capabilities/profile agreement, mappings, Swiss preview/explanation, publication, assignments, receipt reconciliation, result status, incidents, permitted corrections and revision-aware standings/final review. These are capabilities, not selected URL/payload designs. Desktop clients use outbound authorised queries/polling; no inbound server, webhook or access to Herald's internal broker is required for H4.

Distinguish unauthenticated, forbidden, invalid/unsupported profile, stale revision/assignment, blocked dependency, pending processing, proven infeasible, search exhausted and rate-limited responses. Resource existence is not disclosed to an unauthorised caller. Document consumption limits/retry hints, receipt retention and version retirement before pilot use. A retry hint is never permission to resubmit changed sporting intent.

### H4-NT-01 Target facts and history

Target notices: published Swiss opponent/bye to affected human participants/representatives; material pairing withdrawal/cancellation to those affected; pending confirmation/dispute/result correction under H2; stalled or incompatible execution to the scoped director; final/revised standings where inherited policy requires. A synthetic entry has no participant inbox; operational responsibility belongs to its authorised human organiser/source, without exposing private data to spectators.

Follow ADR 0017: owning operations retain effective fact evidence; Notifications later resolves current recipients, deduplicates per fact/recipient/channel and cannot reverse a result after delivery failure. Integration diagnostics belong to operational views, not a new participant notification for every network retry. This is a target inventory only: no events are recorded/published by this PR and ADR 0017's implemented inventory is unchanged.

History retains original and successor result/pairing/assignment revisions, actor/application, reason, time and referenced policy/lineups. Separate played, bye, administrative, pending, corrected and cancelled evidence. Public reads show only permitted aliases and competitive explanations; no private external mapping, credential, engine configuration, referee reason or personal roster/contact data. Protected history and deep links recheck current visibility/representation. Synthetic execution never becomes a human's appearance or global profile history.

## 10. Complete user journeys

| ID / actor | Main path | Recovery and completion evidence |
| --- | --- | --- |
| H4-UJ-01 Director, eight individuals | Announce three rounds/profile → admit/check in → start/fix seed order → generate/review/publish → resolve all matches → repeat → review current standings/finalise | Explain each score gap/bye; no roster commands; disputes block next publication; reviewed final input revision retained |
| H4-UJ-02 Direct teams | Configure five active players → eligible frozen rosters → same Swiss entry flow → lock both lineups per played match → one team result | Four starters block execution; a bye creates no lineup/appearance; reserves get no appearance; team size never multiplies points |
| H4-UJ-03 Real connected individual consumer | Authorise scoped client/source → agree exact profile → create connected field/mappings → fetch Herald assignments → persist/execute/submit → read receipt/standings → director publishes next round | Lose result response, restart and recover existing outcome without simulation; complete agreed rounds and compare final formula fixtures |
| H4-UJ-04 Incident and departure | Withdraw after publication or fail engine → view unresolved assignment → reasoned recovery/administrative decision → invalidate draft → regenerate/review | No future invented opponents; impossible round stops visibly; configured completion is not claimed after exceptional close |
| H4-UJ-05 Correction and concurrency | Preview correction → inspect later-round blockers → apply while safe or report blocked → rebuild standings → refresh review | Race with publication has one compatible winner; old input cannot finalise; prior result and final evidence retained |
| H4-UJ-06 Participant/spectator | Open permitted tournament → inspect published next match/bye and provisional ranking → handle human report if applicable → read final revision | Drafts/private source data absent; revoked deep link denied; synthetic entrant is labelled without fabricated personal history |

The consumer journey must identify the actual application/build and supported profile before its implementation review. A complete connected league can de-risk authority/recovery first, but cannot substitute for the real connected Swiss exit. Execute essential web/API equivalents in later slices, using synthetic test personas and retained reference fixtures.

## 11. Observable acceptance scenarios

These are target scenarios for future implementation, not tests run by this documentation change. Policy-dependent expectations require §15 decisions before their implementation slices.

| ID | Given / action | Expected observable outcome |
| --- | --- | --- |
| H4-AT-01 Eight-entry run | Complete three configured rounds with resolved outcomes | Every active entry covered once/round; no repeats; current explained standings and reviewed final revision |
| H4-AT-02 32-entry run | Complete five rounds, including odd score groups and a withdrawal | Reproducible complete pairing snapshots; floats explained; no phantom future opponent for withdrawn entry |
| H4-AT-03 Odd field | Five entrants A–E, no history; generate twice | E bye, A–B/C–D; same seed/input yields same preview; no play/appearance for E |
| H4-AT-04 Feasible bye search | Lowest eligible bye leaves no perfect matching but another candidate works | First feasible eligible candidate chosen; no greedy partial publication |
| H4-AT-05 Bye exclusions | Prior bye or unplayed administrative win at low score | Excluded under proposed rule; no second free win award disguised as bye |
| H4-AT-06 Global objective | Compare complete feasible matchings with different gap vectors | Minimum descending gap vector, then canonical seed vector; no dependence on input enumeration |
| H4-AT-07 Infeasible versus exhausted | Two remaining entries already met; separately exhaust search budget | Distinct incident reasons, no rematch or partial round; retry budget failure does not claim impossibility |
| H4-AT-08 Round gate | Pending/disputed match, stale projection or changed field | Next-round publication blocked; invalidated draft cannot publish |
| H4-AT-09 Formulae | Apply §5.2 and independently agreed complete fixtures | Exact rational comparison and shared positions; bye points separate from denominator; display rounding not tie logic |
| H4-AT-10 Correction | Change effective result before/after later-round publication | Before: predecessor retained and drafts invalidated; after: dependency blocker, no partial standings repair |
| H4-AT-11 Race | Correct/withdraw while director publishes reviewed draft | Incompatible intents cannot both apply; stale side refreshes and reviews again |
| H4-AT-12 Direct teams | Eight teams of five; attempt four-player start; allocate bye | Eight scoring entries; incomplete lineup blocked; bye no lineup/appearance; one outcome per match |
| H4-AT-13 Individual simplicity | Complete same flow with individual client | No team-only payload or roster/lineup command |
| H4-AT-14 Real adapter | Agree supported individual profile; complete connected Swiss | Opponents/standings from Herald, games from identified real consumer; shared final outputs match |
| H4-AT-15 Unsupported compatibility | Team profile to individual-only adapter; mismatched formula/version | Explicit refusal before executable assignment; no inference that same profile name means compatible |
| H4-AT-16 Mapping identity | Retry same external reference, rename alias, reuse in another organisation | One stable local entrant; changed intent conflicts; cross-scope mapping isolated |
| H4-AT-17 Synthetic privacy | Synthetic team/actors complete game | Competitive alias/classification only in public data; no human account/history/appearance invented |
| H4-AT-18 Lost response | Apply result then lose response/restart consumer | Recover same receipt/outcome; one competitive effect, no required repeated simulation |
| H4-AT-19 Duplicate intent | Same key/content; changed content; new key for same completed attempt | Original receipt; content conflict; no second terminal effect |
| H4-AT-20 Fencing | Two instances claim; director replaces attempt; old instance submits | One current generation; superseded submission rejected with reason |
| H4-AT-21 Offline cancellation | Finish assigned game offline, cancel/revoke, then reconnect | No new round offline; late unauthorised/cancelled submission rejected; retained output available for authorised incident review |
| H4-AT-22 Engine failure | Crash, unsupported configuration or computation limit | Unresolved encounter, retry/recover or explicit human decision; no inferred draw/no contest |
| H4-AT-23 Double departure | Withdraw both published opponents in both orders | Same effective zero-point double absence; no future manufactured losses; dependency checks honoured |
| H4-AT-24 Small active field | Leave one active entry before configured final round | Incident and proposed exceptional-close review; no silent shortened success or manufactured champion |
| H4-AT-25 Visibility/revocation | Guess private mapping, assignment, receipt or inbox deep link | No protected-content disclosure; new operations use current authority |
| H4-AT-26 Delivery failure | Duplicate fact delivery or fail notice | One visible notice per recipient/channel; no competitive rollback; synthetic entry has no participant recipient |
| H4-AT-27 Final review | Correct while reviewing final standings; stale finalise | Current barrier prevents stale finalisation; old final revision remains evidence when reopened |
| H4-AT-28 Version and retention | Update engine/profile; recover near receipt expiry | Running agreement preserved or work paused; documented recovery/purge policy, no silent duplicate after expiry |

## 12. Visual exploration handoff

[Visual direction's H4 inventory](herald-visual-direction.md#h4-screenstate-inventory) is the sole maintained screen/state inventory. Explore the complete individual/direct-team flow, a five-entry bye, a failed pairing search and a disconnected/reassigned execution, including mobile and keyboard recovery. Show draft versus published opponents, updating versus current standings, and execution status versus effective competitive result as separate dimensions.

No UI changes or approved H4 mockups are delivered here. Future screen slices need the `herald-screens` review process, canonical visual references and executable journeys. Public pairing explanations must be useful without showing private diagnostic state or engine configuration.

## 13. Pending decisions, gates and delivery handoff

Authoritative statuses remain in baseline §15. The maintainer owns each product decision; the named contributors below supply evidence. Existing API scope and H4 roadmap scope do not approve these defaults.

| Decision | Concrete recommendation / unresolved choice | Accountable owner and contributors | Gate before implementation |
| --- | --- | --- | --- |
| D-48 | Fixed R, no repeat/second bye, global lexicographic policy, deterministic seed ties | Maintainer; competition engineer | Pairing policy approval with independent odd-group/unsatisfiable examples |
| D-49 | Explicit 3/1/0 and exact OMW formula, shared places; consumer may require another version | Maintainer; standings engineer and consumer owner | Shared formula fixture approval before standings/adapter compatibility |
| D-50 | Preserve past results, current published administrative handling; exceptional close without silent R reduction | Maintainer; director/referee | Agree no-contest, double departure, incomplete closure and positions before complete Swiss delivery |
| D-51, D-01/11 | Herald competitive authority, fixed mode, exact compatibility with an identified real consumer | Maintainer; consumer owner and integration engineer | Select real application/profile/build and approve responsibility agreement before connected execution |
| D-52, D-03/15 | Scoped immutable mappings and explicit synthetic classification; no human claims | Maintainer; identity/privacy and consumer owners | Agree synthetic team actor/readiness contract before registration/adapter writes |
| D-53, D-12/13 | Single execution application, fenced current attempt, explicit replacement; no automatic expiry initially | Maintainer; integration/security engineer | Grant/provisioning ADR and assignment/revocation/cancellation race design before executable work |
| D-54, D-07/08/24 | Block ordinary correction after dependent publication; verify current authoritative inputs | Maintainer; module owners | Correction/publication/finalisation barrier design with race examples |
| D-55, D-09/38 | Recoverable receipts through archive; current access; bounded polling and target notices | Maintainer; API/privacy/operations owners | Set receipt/audit retention, purge, retry/rate limits and authorised notice recipients before pilot |
| D-56 | Eight-/32-entry evidence; no guessed operational maximum/search budget | Maintainer; engineering/design and consumer owner | Agree supported limits; prove deterministic search, accessibility and recovery at those limits |

Record any agreement with date, accepted example and confirming change in §15. Do not mark a production proposal approved merely because this discovery is merged. Unresolved consumer identity/compatibility blocks the real integration, not this documentation review. Any hard-to-reverse authentication, contract or owner-boundary change needs its own ADR; existing ADR statuses are preserved.

The [roadmap H4 delivery handoff](roadmap.md#h4-discovery-and-delivery-handoff) owns the proposed sequence. Each later batch follows ADR 0018, dependency merges, decision/visual review, executable web/API acceptance and preview evidence. Do not move these target rules into `openspec/specs/` until implemented. No change here publishes runtime facts, provisions credentials, migrates data or authorises offline competitive direction.
