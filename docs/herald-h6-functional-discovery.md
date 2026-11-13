# Herald H6 — Advanced Teams and Game Submissions Functional Discovery

Version 0.1 · 13 November 2026 · Functional definition for review; no implementation claimed

## 1. Purpose, authority and decision status

H6 extends teams already present in Herald. It lets a director run an encounter composed of individually resolved boards, permits narrowly defined changes to participation, and protects game-list/configuration submissions. It must explain whose result counts, who actually played and which version was eligible, without counting one team victory several times.

This is the H6 extension of the [functional baseline](herald-functional-discovery.md). Its [single §15 register](herald-functional-discovery.md#15-decision-register-and-development-gates) owns D-66–74 and inherited statuses. The [roadmap](roadmap.md) owns sequence/exit criteria; [visual direction](herald-visual-direction.md#h6-screen-state-inventory) owns future surfaces/states. [H2](herald-h2-functional-discovery.md) and [H3](herald-h3-functional-discovery.md) are the language, structure and detail precedents. ADR 0013 accepts milestone scope, not every proposed default.

**Existing scope:** baseline §§10.2–10.5/14 H6 includes board/seat assignments, submatch aggregation, optional substitution windows, exceptional roster amendments, submission deadlines/locks/privacy and versioned participation. Direct shared team play is different from composite boards. H1's in-match substitution exclusion (D-19), H2's representative reporting, individual IP-01–06 simplicity and the existing correction limits remain applicable to their profiles.

**Proposed defaults:** all new H6 policies/examples here remain recommendations for maintainer review, D-66–74. No rule is accepted by making it concrete or merging discovery documentation. This request authorises documentary work, not production implementation, an official sporting profile or new privacy policy. H3's one-lineup Bo3 and H5's frozen-roster continuity stay unchanged; H6 requires a separately selected, announced versioned profile for its exceptions.

**Verified implementation:** base main `4d7074c` includes H2–H5 discovery documents, with H5 merged in PR #58. Implemented specifications still cover foundations and early H1 access/setup/manual registration/guest entries/rosters/check-in, not played encounters, result aggregation, substitutions or private game submissions. H1 remains incomplete; batch-1 PR #55 is proposals only. M4/H2–H5 completion is not established. Future implementation proposals recheck specifications and issue dependencies rather than treating these documents as delivered functionality.

## 2. Outcomes, actors and boundaries

### 2.1 Outcomes

1. Two teams play assigned boards under a fixed profile; only the effective parent outcome feeds team standings/advancement.
2. A permitted reserve change records the outgoing/incoming players and the exact next game affected, preserving all prior participation.
3. An exceptional roster amendment is distinguishable from an ordinary substitution and cannot quietly transfer an opponent's player.
4. A participant can submit the required private game configuration before a clear deadline and reconcile uncertain saves without leaking content.
5. Corrections expose child, parent, standings and published dependency impact; retries never add points or appearances twice.

### 2.2 Actors and permission limits

| Actor | Target authority | Limit |
| --- | --- | --- |
| Individual participant | Own required game submission; own individual reporting under H2 | No human roster/lineup step introduced for individual play |
| Team member/board player | Read own assignment/participation and own private per-player submission | Playing a board grants no team-reporting, representative or referee powers |
| Current representative | Submit team lineup/board allocation, request substitution/amendment, report/confirm for the represented team, manage a team-scoped game submission | Cannot overwrite locks, approve own exception, see another member's private per-player content by default or confirm for the opponent |
| Referee | Authorised board/parent incidents and reports; submission inspection where explicitly assigned | Cannot adjudicate own entry/represented team; no general roster administration from the role alone |
| Director | Fixed profile/deadlines, authorised lineup operations, independent exception review and competitive closure | No silent post-start profile change, retrospective participation rewrite or arbitrary contradictory parent score |
| Organisation owner | Existing scoped administrative delegation | Ownership alone does not bypass independent incident review or expose private submissions without the review permission |
| External application | Current delegated or server authority for named operations | Board execution/reporting and reading secret submissions need explicit capabilities; H4/H5 credentials alone are insufficient |
| Visitor/follower | Permitted aggregate results and reviewed public aliases | No private roster/lineup, submission content, sanction evidence or hidden board-player mapping |
| Automatic process | Validate/apply approved transitions, lock deadlines and derive current parent outcome | No invented play, winner, exception approval or legality certification |

Authority is evaluated at effect time for current actor, application, organisation, entrant and operation. Keep representative eligibility separate from player eligibility. A non-playing manager may represent a team; a playing captain's own dispute needs an independent resolver. If no independent authorised person is available, the incident stays blocked; no owner bypass is implied.

### 2.3 Included scope and dependencies

Recommend bounded initial profiles: equal-weight three-board composite league; an explicitly detailed direct-team first-to-two series with between-game substitutions; one announced exceptional roster-amendment policy; plain-text per-player or per-team game submissions. Each capability is opt-in before start, not an unrestricted combination matrix. Composite elimination/Swiss/combined-stage use requires its own decisive profile, expected fixtures and compatible consumer; the league template does not establish those automatically.

Exclude weighted boards, bidding, automatic board reseeding, overlapping player assignments, in-game substitution, composite mid-encounter player swaps, best-board statistics as a team tiebreaker, automatic player transfers, unrestricted emergency overrides, chat/attachments, official legality checking, external catalogues, public configuration search, H7 circuit continuity and arbitrary rules/plugin execution. More profiles may follow explicit scope/compatibility review.

Dependencies: H1 roster freeze, lineups, effective results/standings/history and safe corrections; H2 representation, reports/disputes and protected notices; H3 explicit ordered game evidence for the substitution series, not merely aggregate 2–1; M4 protected operational storage/access. H4 execution and H5 stages/delivery apply when selected and must negotiate the new capabilities. H6/H7 remain separately prioritised extensions after relevant core capabilities under baseline §14; this discovery neither marks earlier milestones complete nor invents a blanket H5-completion prerequisite for every H6 slice.

## 3. Profiles, identities and immutable participation evidence

### H6-CF-01 Separate the dimensions

Keep tournament entrant, human roster, starting lineup, ordered game segment, composite submatch and game-list/configuration distinct. A game-unit list is not a human roster. A parent encounter always has two team entrants; three boards do not create six new tournament entrants. Direct 5v5 is one shared outcome, not five fabricated boards. A one-player seat of a composite team still needs its team allocation/eligibility evidence; IP-01–06 apply to individual entry kind, not merely one player per side.

Publish fixed profile/version, board count/order, child result model, exact aggregation, tie/exception policy, completion/clinching rule, lineup disclosure, substitution/amendment permissions and submission requirements before start. Unsupported combinations return a compatibility error. No running direct match can be converted into composite play; no catalogue edit changes its historic rules.

| Candidate profile | Participation and result source | Bounded rule |
| --- | --- | --- |
| Three-board composite league | Three distinct eligible players/team, one assigned to each numbered board, independently effective child outcomes | All boards terminal before normal parent resolution; equal weights; no in-encounter substitutions |
| Direct-team ordered first-to-two | Configured active count k, eligible frozen roster, separately identified ordered games without drawn games | At most one approved one-player substitution/team/encounter between games; no return of outgoing player |
| Existing individual/direct aggregate-only | Existing result/participation profile | Remains usable unchanged; no H6 board or substitution workflow inferred |

No official governing-rule support is claimed. Board count/weights or a decisive composite profile need independently agreed fixtures, not an implicit inference from a game's name.

### H6-PT-01 Version and provenance

Retain stable parent/board/game identifiers, team entrant IDs, applicable roster version/eligibility revision, board assignments, starting and later lineup versions, result source, actual-play evidence, rule version, operation identity, actor/time/reason and predecessor. A segment references the participation version it actually started with, even after later approved changes. Intended allocation/lock is not proof of appearance.

Derive personal appearances once from evidenced play by player/parent/segment; also expose distinct parent appearances so a player in three games is not presented as having played three separate team encounters. A bench reserve, bye, administrative unplayed award or unused incoming substitute gets no appearance. A correction may amend evidenced participation only through explicit impact review, never by editing current team membership.

## 4. Composite lineup, boards and aggregation

### H6-BD-01 Simultaneous team allocations and start

Recommend one complete allocation per side: boards 1/2/3 each have one distinct eligible frozen-roster player; reserve players are not assigned. Both allocations lock before the parent starts. Until both are locked, the opponent sees submission status only, not the rival's draft players/order. Lock each against current roster/eligibility and parent revisions; reveal the two allocations together only to authorised participants/operators once both locks are valid. Public aliases still follow D-09, so private board-player mappings do not become public automatically.

Before parent start, an authorised operator can correct a lock with a reason/current revisions; retain predecessor, invalidate both sides' prior allocation review and require fresh acknowledgement/locks if either side has already seen the rival allocation. This is a proposed fairness procedure, not permission for a captain to silently reorder after viewing the opponent. If an opponent has seen a now-revised allocation, the interface discloses that fact; the maintainer must accept this procedure or select a different sealed-allocation rule before implementation.

Parent start validates both current locks, all eligibility, required submission/waiver state and current authority. Players cannot be assigned twice or on both teams, even if boards are scheduled sequentially. A player sanction before start blocks the affected allocation; entry check-in alone is insufficient. Initial H6 fixes board players for the entire parent: substitution between games of a child board is excluded from this template.

### H6-BD-02 Children effective, parent derived

Recommend draw-capable outcome-only child boards for the first composite league. Each board is a separate report/confirmation unit under H2: only a representative for that board's team reports/confirms; the opposing representative confirms the exact report version. A board player without representation may read their permitted evidence but cannot make it effective. Operator-entered mode remains possible under the fixed reporting policy. Pending/disputed reports have no aggregate or standings effect.

For each effective terminal board, assign exact board units: win 1/0, draw 1/2 each, loss 0/1. Single absence/concession awards 1/0 administratively with actual-play flag; double absence and neutral no contest award 0/0 with distinct causes. Use exact halves, not rounded display values. Child points are aggregation units, never tournament standings points.

While any board is unresolved/disputed, display partial board units as provisional only; parent has no effective normal outcome, team points or advancement. When all three are terminal, compare A's and B's exact totals: greater total wins, positive equal totals draw. A normal team win/draw/loss uses the selected parent league's 3/1/0 standing points once. If every board contributes 0/0, require an explicit independent parent no-contest decision, yielding 0/0 standings rather than a fabricated sporting draw. This exceptional direction is a D-67/71 gate.

Parent lifecycle: **scheduled → ready → running → awaiting child resolution → effective**, with **incident/voided** and tournament **cancelled** distinguished. The final effective child enables one derived parent revision after current child inputs have been verified. A delayed projection exposes updating; it cannot authorise round completion or finalisation. Standings consumes the highest effective parent revision idempotently, never one competitive award per child or one additive award per recalculation. No client may supply a normal parent result contradicting effective children.

### H6-BD-03 Exact review fixtures and clinching

| Effective board facts A/B | Exact totals | Parent consequence |
| --- | --- | --- |
| A win, draw, B win | 3/2 : 3/2 | Draw; parent standings 1 : 1 |
| A win, A win, B win | 2 : 1 | A win; parent standings 3 : 0, not six or nine points |
| A win, A win, board 3 disputed | Partial 2 : 0 | A is mathematically ahead but parent stays ineffective; no points/advance |
| A administrative single-absence win, B win, no contest | 1 : 1 | Draw under proposed profile; no invented play on boards 1/3 |
| A win, no contest, double absence | 1 : 0 | A win once; incident causes retained |
| Three no-contest/double-absence boards | 0 : 0 | Block for independent parent no-contest adjudication; no automatic draw |

Recommend playing/resolving all boards even after a clinch. Do not cancel remaining boards automatically, award fictitious results or finalise the parent early. This costs more play than a stop-on-clinch format but gives stable participation and correction semantics. A team concession/disqualification may instead terminate the parent through §8's explicit administrative path; it is not ordinary clinch completion.

A composite elimination profile is not implied by 3 boards: two wins/draws may still yield a tie, and no-contest boards can remove a decisive outcome. Before enabling it, announce a terminal team decider and its roster/appearance/aggregation rules or select a different profile; never choose by seed/name/ID. The initial template stays league-only until that gate is resolved.

## 5. Substitutions between direct-team games

### H6-SUB-01 A permitted boundary, not an overwritten lineup

Recommend an opt-in direct-team ordered first-to-two profile with one starting lineup version per team and one immutable game record per actual game. It extends rather than rewrites H3's no-substitution Bo3. Aggregate-only 2–1 cannot demonstrate when a reserve played; reject substitution capability on that profile. Game order follows the accepted H3 decisive-series rule: W–L–W is possible; no game after W–W.

A representative requests one outgoing player, one incoming eligible frozen reserve and the next game number/revision, with reason. One replacement player per team per parent is the candidate limit; the outgoing player may not return in that encounter. No in-game pause/disconnect substitution, no changing active count k, no double assignment, no expired representative or sanctioned/new roster member. Reconnecting the same player preserves identity and is not a substitution.

Request lifecycle: **requested → approved/rejected/cancelled**, or **stale/expired** when the target boundary no longer exists. Requesting creates no right to play. Recommend an independent authorised referee/director approve before next-game start. Pending request blocks that team's next-game readiness until explicitly resolved; it does not pause an already running game. Request rejection/cancellation preserves the current lineup. Approval consumes the allowance once, even if the incoming player never subsequently plays; approved records are not retractable representative edits. An erroneous approval requires operator incident/correction review under §8.

### H6-SUB-02 Boundary checks and races

Allow request only after the preceding game's effective terminal result and before the next game starts, with the series still undecided and no open prior-game dispute. Approve against current parent/preceding game, request, roster/eligibility and lineup revisions; approval creates a successor participation version effective for the named next game and later games. Both teams see the permitted lineup change; previous games retain their original players. Individual 1v1 has no such human substitution command.

Next-game start checks no pending request, current approved versions/eligibility, submission requirements and the fixed active count on both sides. A request racing start either becomes pending and blocks start, or start wins and request fails boundary; no request can appear to have paused an already started game. Approval racing a sanction, revocation, roster amendment or cancellation loses stale when the condition changes. Two concurrent approvals cannot consume the single allowance twice or assign one reserve twice. Lost-response retry returns the same approval/version; changed payload under the same operation conflicts.

If the series is already won, return “no next game” and reject. A disconnect during game 2 leaves game 2's actual participants intact; wait or use the announced incident policy. After reconnect, neither an offline application nor a previously displayed approval can authorise a substituted player in the running game.

## 6. Exceptional tournament-roster amendments

### H6-AM-01 An announced exception with future effect only

Existing frozen-roster profiles remain closed to new players. Recommend a separately announced opt-in H6 exception: at most one one-for-one amendment/team/tournament, independently approved with a reason at a between-round or between-stage boundary. No capacity increase, reset of substitutions or erased roster member. Default remains no amendment where this profile is not selected.

For the candidate boundary, all encounters in the preceding round/stage must be terminal/current, and no match in the destination round/stage may have started. Existing league pairings published in advance need not be withdrawn: entrant/opponent identities do not change. Every affected unstarted lineup/assignment becomes unusable until revalidated/resubmitted against the new roster revision; no game may start from the old eligibility view. The technical design must prove the boundary with authoritative match state, not wall-clock dates or a projected completed count. Out-of-order play that has already started a later round blocks this amendment window.

Require a distinct outgoing current roster member and incoming player not already on this roster. The incoming player must satisfy identity/acceptance, roster bounds, applicable submission and eligibility conditions and must never have been rostered for another team in this tournament, even if that team later cancelled. This proposed anti-transfer rule is stricter than ordinary active-entry exclusivity and requires explicit maintainer acceptance. Club membership alone is insufficient. Do not merge same-name guests or create an account automatically. A pending invitation is not acceptance/eligibility.

Representative request → independent director review → approved/rejected/withdrawn/stale. Review exposes outgoing/incoming identities, historical appearances, affected future locks, submission blockers and proposed effective boundary. Store the old frozen roster and amendment as successive evidence; mark outgoing unavailable for future selection, keep past play, and add incoming only from approval's effective boundary. Existing lineup versions remain historically accurate. No retrospective eligibility cure for an unapproved substitute is permitted.

An incoming player requiring a private submission must have a valid locked submission or a separately reasoned permitted deadline waiver before approval/start. Recommend a referee-controlled exception slot with a new explicit future deadline and protected draft; do not reopen all entrants' locks or reveal opponents' content. The amendment decision must show whether this separate exception is needed. An amendment request does not itself grant submission access or approve legality.

### H6-AM-02 Atomic admission to the future roster

Concurrent approval/start, two teams requesting the same known player, allowance exhaustion, eligibility revocation and cancellation are checked at effect time. Exactly one approval can claim that player's eligibility; all-or-nothing outcome includes the new roster revision and invalidation of affected future locks. A response lost after approval reconciles by receipt/current roster, not a second one-for-one addition. General membership edits cannot enact or reverse an amendment.

A mistaken approval before any affected play may be superseded only by explicit independent impact review, retaining consumed allowance/evidence unless the approved policy specifically permits restoration. No implicit second amendment is available. Once affected play started, preserve actual participants and resolve the incident under §8; do not remove the incoming player retrospectively to make the match appear valid.

## 7. Private game-list and configuration submissions

### H6-GS-01 Scope and authorisation

Recommend plain UTF-8 text, candidate maximum 16 KiB per version, with a fixed requirement mode **none**, **per individual/player**, or **per team entrant**. It describes game units/configuration, not human eligibility. No file uploads, rich HTML, official content catalogue or automatic legality certification. Validate required/non-empty/size/encoding, label “received, not legality validated”, and treat submitted text as untrusted inert content everywhere.

Publish the requirement, scope, reference time zone, authoritative edit deadline, any permitted exceptional deadline, reveal policy and effect of missing/invalid content before start. Per-player team mode covers every roster member who may play, including reserves, without inferring that they actually played. An individual uses their entry directly without roster/lineup objects. Team mode has one logical slot for the entrant, not one per roster member. The first bounded profile uses one tournament-scoped submission per required subject; stage-specific replacement lists are separate scope.

An account holder may submit/read their own slot; a current representative may submit/read the team-scoped slot and see per-player completion status, not other players' private per-player content. A director may assign explicit referee inspection permission. For guests, recommend an explicitly delegated operator/referee records the guest's supplied text and source with reason; no public bearer-link submission or guessed identity. The writer's authorship and the competitive subject are separate. Broad organisation administration or API read-state grants alone do not reveal content.

### H6-GS-02 Versioned deadline and lock lifecycle

Lifecycle: **missing → draft received → locked**, with inspection **not reviewed/accepted for this requirement/issue found**, **waived** as a separate reasoned requirement exception, and **superseded** versions retained. Inspection never silently edits the author's content; “accepted” is the assigned referee's review under the announced checklist, not universal legality certification.

Before the deadline an authorised author can replace the current draft using its expected revision; save a new immutable version, preserve predecessor/receipt, and never accept a partial truncated body. Compare the server's commit time to the deadline: a new write is allowed only strictly before it. At/after the deadline the last fully committed draft becomes the locked version, even if the scheduler has not run. A clock-driven lock does not invent missing content. Reads report actual effective lock/deadline state rather than waiting for a worker to catch up. A retry of a previously committed operation may return its original receipt after deadline if current read authority permits; a fresh late write is rejected.

Missing, issue-found or requirements without a waiver block the relevant competitive start, not admission/check-in and not a retrospective no-show award. Where inspection is configured, acceptance by an assigned reviewer is also required; absent reviewer work is a visible pending blocker, not implicit acceptance. Before any play in scope, the independent director may grant a specifically announced reasoned waiver/exception deadline or reject the entrant's readiness. Do not extend a deadline retroactively by overwriting the old configuration; preserve old/new time, scope, actor and notice. A replacement following an inspection issue needs its own authorised exception window/version and cannot alter other locked submissions. Once play starts, a late missing/illegal list is an incident, never a silent retrospective edit.

Request/receipt idempotency, expected versions and deadline checks are shared by web and API. Two devices editing one slot cannot lose a version silently. Deadline/save race has one result: committed-before accepted-and-locked or too-late rejected with preserved local input. The scheduler and request path must converge on the same locked version. Deadline changes, cancellation or permission revocation race against new writes at authoritative effect time. No offline timestamp can backdate a save.

### H6-GS-03 Privacy, reveal and retention

Default private throughout: author/current authorised submission agent and explicitly assigned reviewers only. Human roster privacy remains D-09's separate restriction. Completion status is available to scoped operators/representatives as needed; neither status endpoints nor errors reveal content from other entrants. Never put content/digests in public live hints, webhook bodies, email, generic logs, search, SSR/shared caches, filenames or downloadable public URLs. A hash of a small predictable list can itself disclose information and is not a public anonymisation strategy.

Optional public reveal is a distinct policy gate under D-73: recommend only after reviewed tournament finalisation, if announced before start and each affected author/subject's permission has been explicitly settled, followed by a director content preview/redaction and a revisioned release action for named versions. Recommend affirmative named-version release consent from each per-player author, or the current representative for team-scoped content; a guest's permission needs recorded verification by the assigned reviewer, never an assumed owner override. Redact unrelated personal information before release. No automatic deadline/round-end reveal. If the policy is not selected and approved, no reveal route exists. Reopening a final tournament does not silently substitute a corrected secret into an earlier public release; any new release requires review and its own record. Already downloaded material cannot be recalled, though future access may be withdrawn.

Secure private storage, reviewer access audit, export/deletion/redaction ownership and concrete retention periods are D-73/74 gates before real submissions. Separate minimal competitive proof (which version/requirement/waiver applied) from retention of full sensitive text. Purge must not erase the audit that a match used an approved version; retain a lawful minimal reference and explicit redaction/expiry status, without claiming indefinite content recovery. Account deletion or representative revocation cannot cascade-delete opponents' results or permit future private reads. No new product privacy policy is approved here.

## 8. Incidents, corrections and recovery barriers

### H6-CR-01 Child changes propagate through the parent

Preview previous/proposed child resolution, actual-play evidence, exact aggregate, parent outcome, standings delta, appearances and every dependent round/stage/cut/assignment. Ordinary correction remains blocked by published competitive dependencies under D-07/45/54/59, even if the corrected child would leave the same parent winner. Started/played successors are necessarily blocked. Reopening a finalised tournament retains the previous final revision and follows the same gates.

Before a published successor exists, a permitted child correction may revise the parent from effective to pending if the child becomes unresolved, removing the parent's old standings contribution through a new current revision. Block dependent publication/finalisation until parent/standings are current and all disputes settled. Retain old child and parent revisions; a parent correction is not deletion and must not be counted as a second result. Invalidated unpublished dependent drafts require fresh review. Correcting a child's historical participation does not retroactively approve an unapproved substitute or give them future eligibility.

Child acceptance, parent derivation and standings may cross asynchronous boundaries. The future design must ensure current highest child revisions determine one parent revision and current highest parent determines one standings contribution, with visible updating and authoritative publication barriers. A pending projection cannot authorise an irreversible transition. If a parent administrative override is already effective, a new child correction requires a combined independent review confirming or superseding that override; do not quietly replace it by normal aggregation.

### H6-EX-01 Administrative parent resolution

| Incident | Proposed treatment |
| --- | --- |
| One board absent, other boards can play | Reasoned board absence 1/0, no fabricated play, continue remaining boards |
| Both board players absent or neutral no contest | Separate 0/0 causes; resolve all remaining boards; apply the all-zero parent gate if necessary |
| Team concedes/disqualified before all boards resolve | Independent parent administrative resolution with cause/reason and actual-play evidence; unresolved boards marked not played/terminated by parent, not fictitious wins |
| Parent administrative award differs from partial board leader | Explicit override shown alongside retained child evidence; ordinary caller-supplied contradictory score is rejected |
| Team becomes understrength in a direct running game | Preserve starting players; wait/resolve incident, no in-game swap or automatic whole-team withdrawal |
| Eligibility issue discovered after start | Retain actual players and version; independent incident/result review; current membership edits cannot cure history |
| Whole tournament cancelled | Reject new competitive writes/approvals; preserve earlier play and void unresolved work without new points/champion |
| External output arrives after revocation/cancellation | Reject new unauthorised effect; retain permitted incident evidence for an authorised resolver, never restart execution from a redelivered hook |

Recommend single-team concession/disqualification may give the eligible opponent an administrative parent win; both teams absent/withdrawn or neutral termination yields parent no contest, 0/0 standings and no invented advancement. If the latter occurs in an eventual decisive composite format, its explicit no-qualifier/exceptional closure policy is required. An administrative outcome changes the parent through a separate permitted operation; preserve completed/pending/disputed child evidence and prevent late ordinary child writes after parent termination. No silently fabricated 3–0 board score.

### H6-RC-01 Concurrency, retries and restart

Every retryable mutation carries operation identity, expected relevant revisions and current authority. Same identity/content returns the original authorised receipt; changed content conflicts. Unknown network outcome triggers receipt/current-resource read before a fresh operation. Conflict preserves local form content but requires new impact/boundary review, not automatic resubmission. Receipt possession grants no authority.

Two last-board reports, out-of-order child events, replay outside inbox retention and a service restart must converge to the same effective parent once. Reconcile from retained child/participation sources, not transport delivery count. Start versus substitution/amendment/submission lock and cancellation versus approval/result have an authoritative ordering; no mixed state may expose a usable stale lineup. H4 consumers need the exact new child/parent/profile capabilities and fenced attempt ownership; result-source permission for a parent does not implicitly authorise private submission reads or independent duplicate board execution.

## 9. API, notices, history and boundaries

Web and API expose the same parent/child identities, profile capability negotiation, applicable revisions, board allocation disclosure, current lineup/participation segments, substitution/amendment requests, private submission status/content scopes, receipts, validation/permission/state/conflict errors and updating/current aggregate. Reject unsupported composite/substitution modes explicitly. An individual consumer never sends synthetic team, roster or empty lineup payloads just to submit a game list or result.

Target notices include board report/confirmation/dispute, parent effective/revised resolution, allocation readiness, substitution/amendment requested/decided, deadline reminder/missing/locked/issue/waiver and approved public release. They follow proposed ADR 0017's fact/recipient/channel deduplication and H2/H5 delivery boundaries. Route board notices to the relevant representatives and permitted assigned players, not every roster member's private evidence. Deduplicate parent notices separately from child notices. No secret content or private reason enters an email/webhook/invalidation hint; delivery failure never changes readiness or points. This discovery adds no row to ADR 0017's recorded/published event inventory.

Durable evidence includes exact rules/source/participation revisions, assignment/reveal acknowledgements, requests and decisions, independent approver, effective boundary, actual play, locked submission reference/waiver, result predecessors and receipt. Keep audit distinct from expiring inbox/outbox/logs. History separates team outcome, board result, game segment and actual player appearance, without exposing private roster or configuration text to a public reader. Public aggregate board outcomes can be shown without private board-player mappings. Public personal statistics/leaderboards are not added by this milestone.

Functional ownership: Registration owns roster eligibility/amendment evidence; Competition owns assignments, encounter/game participation, substitutions, child/parent outcomes and competitive start barriers; Standings owns derived team rankings; Tournaments owns fixed configuration/deadlines/lifecycle; Notifications consumes target facts. Private submission storage/access and cross-owner deadline/eligibility coordination need an explicit technical owner/design before implementation; this document creates no module or cross-schema shortcut. A submission's acceptance is not authoritative human roster eligibility. Future designs respect ADR 0004 boundaries and ADR 0007/0008/0016 durable revisioned coordination.

## 10. Complete user journeys

| Journey | Goal, end-to-end path and recovery |
| --- | --- |
| H6-UJ-01 Composite league | Director fixes three-board equal-weight profile; four teams enter with eligible frozen rosters. Representatives lock board allocations and authorised players see the joint reveal. Teams play six parent encounters/18 boards, representatives report/confirm or independent referee resolves, every parent derives once, current standings enable final review. A 2–0 clinch still requires third-board resolution; a dispute holds parent effectiveness. Public page shows team/board outcomes without private rosters. |
| H6-UJ-02 Reserve between games | Five starters and two eligible reserves play a direct first-to-two series. After A loses game 1, representative requests P5→P6 for game 2; independent official approves at boundary. Game 1 keeps P1–P5; games 2/3 use P1–P4/P6 and A wins 2–1 once. P7 remains unused. Lost approval response reconciles to the same version; a second substitution or running-game change is rejected. |
| H6-UJ-03 Exceptional amendment | Announced policy permits one one-for-one change. Current round finishes, next round has no started match, director independently reviews outgoing/incoming and submission exception. Approval creates a future roster version and invalidates unstarted locks; representative resubmits/relocks before next play. Opponent-team history or started future match blocks approval. Earlier appearances and entrant identity stay unchanged. |
| H6-UJ-04 Private submission | Individual author or team representative selects the correct slot, sees deadline/scope, saves draft revisions and reconciles a lost response. Last pre-deadline version locks; assigned reviewer accepts or records issue. Missing/issue state blocks start until permitted waiver/exception; neither captain nor visitor sees private per-player content. A late fresh save fails with input retained. Optional later reveal requires the separately approved preview/release policy. |
| H6-UJ-05 Correct and rebuild | Official previews a board correction from A win to draw, with parent/standings/appearances and dependency impact. Before successor publication a safe correction revises/reconciles parent once and requires fresh final review. After successor publication it is blocked even if winner unchanged. Restart/out-of-order events rebuild to the same state; old receipts/results remain attributable. |
| H6-UJ-06 Independent API consumer | Application negotiates supported participation/result/submission capabilities, obtains explicit grants, assigns eligible boards or executes permitted series, submits revisioned reports and reads current parent/standings. Unsupported profile or revoked permission denies new effects; duplicate child submission cannot double-score parent. Protected submission content never rides public hooks or ordinary read-state grants. |

## 11. Observable target acceptance

These are future executable scenarios, not tests run in this documentary change. Use synthetic personas, independently agreed expected fixtures and web/API equivalents; repeat applicable cases with direct teams and preserve individual regression evidence.

| ID | Given / action | Observable expected result |
| --- | --- | --- |
| H6-AT-01 Composite tournament | Four teams complete six three-board parents in UJ-01 | 18 identified boards, six parent standing contributions, reviewed final standings; no extra entrants or per-board team points. |
| H6-AT-02 Equal halves | A win/draw/B win on three boards | Exact 3/2:3/2 board units, one parent draw, 1:1 standing points. |
| H6-AT-03 Clinch not completion | A wins boards 1/2; third pending/disputed | Partial 2:0 only, no effective parent/points/advance; board 3 still resolves under announced rule. |
| H6-AT-04 Exceptional board matrix | Single absence/B win/no contest; then all three 0/0 | First yields 1:1 parent draw with no fabricated play; all-zero case awaits independent parent no-contest 0/0 decision. |
| H6-AT-05 Allocation validation | Duplicate player, other-team player, reserve not accepted, sanctioned starter | Allocation/start rejected with private scoped blocker; check-in cannot bypass; no fake appearances. |
| H6-AT-06 Sealed allocation | One side locked, other drafting; later authorised pre-start correction | No rival draft disclosure; both valid locks reveal together. Revealed revision replacement requires recorded review and fresh locks, not silent reorder. |
| H6-AT-07 Reports and authority | Board player without representation reports; representative disputes opponent report | Unauthorised write denied; current rival confirmation/referee policy applies per board; pending/disputed never aggregates. |
| H6-AT-08 Derived once | Concurrent last-board results, replay/older events and restart | Current child revisions converge to one effective parent revision/contribution; no duplicate points/appearances/notices. |
| H6-AT-09 Parent contradiction | Client supplies normal parent win against effective child draw | Rejected; separate reasoned authorised administrative path required and visibly distinguished. |
| H6-AT-10 Valid substitution | UJ-02 P5→P6 after game 1, then W–W for A | One approved successor lineup, original game-1 play retained, 2–1 result once, P7/unused incoming not credited. |
| H6-AT-11 Invalid windows | Swap during game, after decisive W–W, on aggregate-only/composite/individual profile | Explicit boundary/capability error; no new player starts, no fabricated ordered evidence. |
| H6-AT-12 Allowance and identity | Second substitution, outgoing re-entry, incoming not frozen/eligible; same player reconnects | Forbidden swaps rejected; reconnect is same participant and consumes no allowance. |
| H6-AT-13 Request versus start | Concurrent substitution request and next-game start | Request wins and blocks start, or start wins and request fails boundary; no pending pause on already started game. |
| H6-AT-14 Approval races | Duplicate approvals, sanction/revocation/cancellation versus approval, lost response | One current valid decision/lineup/allowance; stale/unauthorised approval denied, retry returns same receipt. |
| H6-AT-15 Amendment success | UJ-03 announced allowance/current closed round/no next play | Old roster retained, one future amendment, affected unstarted locks invalidated, incoming readiness/submission checked, no historical rewrite. |
| H6-AT-16 Amendment blockers | Unannounced exception, exhausted allowance, incoming formerly on other team, later round already playing | Approval blocked with reason; no new eligibility from club membership or alias changes. |
| H6-AT-17 Atomic amendment | Two teams claim same known incoming player, or next match starts during approval | At most one valid claim; one authoritative start/approval ordering, no usable stale lock or partial roster write. |
| H6-AT-18 Individual simplicity | Individual submits required list and plays existing individual format | Entry/player scope only; no team/roster/lineup requests or synthetic team, unchanged existing results. |
| H6-AT-19 Submission scope | Captain requests another player's private per-player content; ordinary app read-state grant tries it | Denied; permitted completion status only, team-slot rights separate, guest operator source attributed. |
| H6-AT-20 Deadline race | Two devices save; final write competes with deadline/lock worker | Expected revision prevents lost update; strictly pre-deadline commit locks once, at-deadline late write rejected; prior receipt can reconcile under current read rights. |
| H6-AT-21 Missing/issue/waiver | Required slot missing or configured review pending/issue found | Relevant start blocked; independent announced exception/waiver recorded, never silent acceptance or automatic no-show/result. |
| H6-AT-22 Inert content | Blank/oversized/invalid text or active markup is submitted | Requirement/byte validation rejects invalid input without truncation; permitted text rendered inert, no legality-certification claim. |
| H6-AT-23 Submission confidentiality | Inspect public API/history/SSR/cache/hooks/email/logs and revoke reviewer/representative | No secret text/digest/private player mapping; subsequent protected reads denied, prior authorship retained. |
| H6-AT-24 Optional release/purge | Default-private version, or approved post-final release, later supersession/purge | No default reveal; approved named-version preview/release only, no silent replacement; minimal proof/redaction state survives lawful content purge. |
| H6-AT-25 Safe child correction | No published successor; effective child changes to draw or pending | Impact exposes exact parent/standings/appearances; old parent superseded or pending with old contribution removed once, updating barrier blocks dependent publication. |
| H6-AT-26 Dependency and override | Published successor, or administrative parent with child correction request | Ordinary correction blocked by dependency; otherwise combined independent review required to retain/replace override, no silent normal recalculation. |
| H6-AT-27 Administrative termination | Team concedes after one played board while others pending/disputed | Explicit parent award, prior evidence kept, unresolved boards terminated without fabricated wins; late ordinary board write rejected. |
| H6-AT-28 Closure/recovery | Cancellation or final review races board result/approval/rebuild | Current authority/lifecycle/revisions decide; no revived play/new points after cancellation, stale final review rejected, old final revision retained on reopening. |
| H6-AT-29 External compatibility | Old H4 consumer or parent-only grant attempts composite child execution/private list read | Explicit unsupported/grant error; no reinterpretation/duplicate execution or implicit secret access. |

## 12. Visual exploration handoff

The [canonical H6 inventory](herald-visual-direction.md#h6-screen-state-inventory) owns future screens/states and desktop/mobile/accessibility exploration. No screen or mockup is created/approved here. Future proposals follow `herald-screens` and ADR 0018; existing direct-team forms do not approve board allocation, participation timelines, exception review or private submission/reveal flows. Screenshots complement executable authority/concurrency/privacy scenarios; they cannot prove them alone.

## 13. Pending decisions and implementation gates

Statuses remain solely in [baseline §15, D-66–74](herald-functional-discovery.md#15-decision-register-and-development-gates). The maintainer approves product policy; specialist roles below supply evidence and must be nominated before their gate. This handoff assigns review, not a second decision register.

| Register reference | Recommendation/evidence to review | Responsible reviewer and gate |
| --- | --- | --- |
| D-66 | Bounded composite league/ordered direct profiles, sealed board assignments and supported combination matrix | Maintainer with competition/design owners; before profile/assignment implementation; accept reveal/correction fairness procedure. |
| D-67 | Exact equal board units, no parent effect before all terminal, continue after clinch, all-zero adjudication | Maintainer with competition/standings owners; independent arithmetic/incident fixtures before aggregation. Decisive composite variants need separate approved decider. |
| D-68 | One independently approved one-player swap/team/parent between direct games, no return, ordered evidence and request/start barrier | Maintainer with participation/referee owners; before substitution implementation; approve allowance/error-correction treatment. |
| D-69 | Announced one-for-one future roster amendment, strict anti-transfer history, round/stage barrier and submission exception | Maintainer with Registration/Competition owners; before post-freeze eligibility writes; agree restoration policy and atomic race fixtures. |
| D-70 | Slot scope, delegated guest authorship, private text format and exact server-time lock/review/waiver semantics | Maintainer with submission/identity/referee owners; before real submission capture and deadlines; agree owner, size cap and exception checklist. |
| D-71 | Child→parent correction/administrative override propagation, current publication/finalisation barriers | Maintainer with module owners; before results/correction coordination; close inherited D-07/24/45/54/59 where applicable. |
| D-72 | Capability/grant parity, attributed appearances, protected target notices and connected execution compatibility | Maintainer with API/consumer/notification owners; before public/connected H6 claims; independently exercise web/API journeys. |
| D-73 | Private default, explicit inspection permission, optional announced post-final named-version reveal and consent/redaction | Maintainer with privacy/security owners; before storing real text or enabling release; approve policy and access/export evidence. |
| D-74 | Concrete supported board/roster/game/byte limits, retention/purge, measured operational boundaries and full journey fixtures | Maintainer with engineering/operations/design owners; before release/support commitments. Candidate limits here require acceptance, not silent defaults. |

The [roadmap handoff](roadmap.md#h6-discovery-and-delivery-handoff) owns proposed delivery sequence and exit evidence. Each future slice closes its relevant inherited/H6 gates, has an approved OpenSpec change and reviewed visual input, and executes its acceptance. This documentary discovery is complete for policy review without authorising any production feature.
