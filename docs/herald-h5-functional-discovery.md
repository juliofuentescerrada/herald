# Herald H5 — Combined Stages, Live Following and API Ecosystem Functional Discovery

Version 0.1 · 13 November 2026 · Functional definition for review; no implementation claimed

## 1. Purpose, authority and decision status

H5 lets a director take a tournament through qualification and a decisive stage, lets people follow current progress, and gives authorised applications a recoverable delivery contract. A cut must be explainable before it changes opponents; a notification must never become competitive authority.

This is the detailed H5 extension of the [functional baseline](herald-functional-discovery.md). Its [single decision register, §15](herald-functional-discovery.md#15-decision-register-and-development-gates), owns D-57–65 and all inherited decision statuses. The [roadmap](roadmap.md) owns delivery order and exit criteria; [visual direction](herald-visual-direction.md#h5-screen-state-inventory) owns the future screen/state inventory. ADR 0013 accepts milestone scope and sequence; it does not accept the defaults below. The H2 and H3 extensions supply the language and functional-detail precedent.

**Existing scope:** baseline §14 H5 includes groups/Swiss followed by elimination, seeding and terminal cut criteria, email, live views, server subscriptions/webhooks, integration documentation and application registration/revocation. Stable team entries and eligibility continue across stages. Baseline F-09 already requires a published terminal criterion for a unique cut; §9 constrains corrections with dependencies; §13 requires scoped, versioned, revocable API access and reconciliation.

**Proposed defaults:** every new H5 policy/example here is a recommendation under D-57–65. The maintainer retains approval. A recommendation made concrete for review is not a confirmed policy, approved batch or implementation instruction. Inherited partial/proposed gates, including D-07/09/14/17/24/27/38 and D-39–56, remain unresolved within their recorded limits.

**Verified repository state:** at base `505869c`, implemented specifications cover foundations and early H1 access/setup/manual registration, guest entries, rosters and check-in. They do not describe competition stages, results/standings, live transport, email, webhooks or general application management. H1 still has remaining batches; the open batch-1 proposals PR is not implementation. M4 has not been declared complete. H2–H4 discoveries are now on main and remain target documents. Their presence does not demonstrate prerequisite completion. Later implementation proposals must recheck current specifications and issue state.

## 2. Outcomes, actors and boundaries

### 2.1 Outcomes

1. A director can explain each qualifier, seed, exclusion and source revision, including a tie at the boundary.
2. Entrants retain identity and eligibility across stages; a stage transition is neither new admission nor a roster reset.
3. A spectator can distinguish current, updating, provisional, final and disconnected information.
4. A participant receives permitted operational email without disclosing private details to spectators or other recipients.
5. A consumer survives duplicates, gaps, revocation and lost responses using authorised API reads; delivery failure never changes a match outcome.

### 2.2 Actors and authority

| Actor | Target authority | Limit |
| --- | --- | --- |
| Visitor/follower | Read and follow permitted public/unlisted tournament state | Following grants no private read or write authority; unlisted stays undiscoverable |
| Participant | Own notices/preferences and permitted participation views | Cannot select qualifiers or authorise an application for the organisation |
| Team representative | Represent the current team under H2 grants; receive applicable team notices | Representation is distinct from membership and playing eligibility |
| Director | Configure/review stages, approve eligible cuts and publish successor rounds in tournament scope | Cannot override published rules, frozen rosters or dependency blockers by editing a preview |
| Referee | Resolve permitted incidents/results with attributable evidence | No implicit stage configuration, grant administration or self-adjudication |
| Organisation owner | Authorise/revoke scoped application grants and manage delivery destinations | Registration alone never grants competitive result-source authority |
| Application owner | Register and manage their application's credentials and verified endpoints | Does not inherit access to any organisation or another application's deliveries |
| External application | Only granted queries/commands/subscriptions in current scope | Hook receipt or live update is not a command, execution assignment or result acceptance |
| Delivery process | Resolve current recipients/scope, deliver and reconcile status | No power to admit, qualify, finalise or reverse competitive changes |
| Platform operator | Credential incidents, abusive destinations and operational suspension | No silent sporting intervention; record actor/reason for privileged operations |

Check current application, user if delegated, organisation, tournament, operation and representation together. Losing any required grant denies subsequent use even with an unexpired credential. An owner directing their own entrant still follows inherited incident/conflict rules.

### 2.3 Included scope, exclusions and dependencies

Develop two bounded combined templates: round-robin groups → single elimination, and Swiss → single elimination. Develop live read subscriptions and application webhooks separately, operational email, registration/grants, credential/destination lifecycle and published compatibility/consumption contracts. Include individual and direct-team paths, API parity, audit and recovery.

Exclude arbitrary stage graphs, parallel progression paths, double elimination, loser brackets, carry-over points, reseeding each round, automatic replacement reserves, cross-tournament rankings, H6 composite encounters/substitutions, H7 seasons, promotional campaigns, chat, SMS/mobile push, arbitrary internal-event access and offline competitive authority. More than two stages requires an explicitly scoped follow-on, not a generic graph editor slipped into H5. These are proposed first-delivery bounds, subject to D-57.

Dependencies: H1 effective results, current standings and safe corrections; M4 hosting/identity/operations; H2 reporting, representation and notices; H3 decisive bracket/profile behaviour; H4 Swiss and connected compatibility where selected. Live/email/grants may be developed as bounded capabilities after their own dependencies, but their delivery does not complete combined-stage acceptance. A connected cut also needs the real H4 consumer to support its successor profile explicitly.

## 3. Stage configuration and lifecycles

### H5-ST-01 A fixed, bounded plan

Propose publishing the complete stage plan before tournament start: stage identifiers/order, entry kind, compatible result profiles, group assignment, qualification quotas, cut criteria, seed procedure, decisive-stage size, dates/time zone and exception policy. Rules are versioned and fixed at start. A displayed schedule date does not automatically publish a cut or start play.

For groups, propose balanced group sizes differing by at most one, with at least two entrants per group, and a retained operator-run random assignment unless an explicitly reviewed seed procedure is configured. Keep draw inputs, procedure/version and allocation. Quotas are fixed per group; recommend no cross-group wildcard comparison in the first template because unequal group sizes, rests and withdrawals make raw points incomparable. Validate that each group can supply its quota and that total qualifiers are a power of two, at least two. A Top 8 therefore has eight entrants, not eight teams' players. A different successor size/byes needs an announced profile and separate accepted fixture.

For Swiss, publish its fixed round count and complete ranking/cut procedure before start. H4's shared positions and exact arithmetic remain; the H5 terminal selector resolves only the boundary/seed ambiguity it was announced to resolve. It does not silently replace Swiss tiebreakers with rounded values.

Configuration lifecycle: **draft → reviewed/published plan → fixed at tournament start**. A pre-start edit requires revision-aware validation and renewed publication where permitted by the inherited lifecycle; no unsupported unpublish action is implied. A post-start rule error blocks the affected transition for an explicit incident decision; it is not permission to change quota or improvise a draw.

### H5-ST-02 Stage and cut are separate resources

Stage lifecycle: **planned → ready → running → awaiting closure review → closed**, with **cancelled** distinct. All source groups must be closed from current effective results and settled disputes before the destination cut is reviewable. Closing a source stage does not finalise the tournament or send a final tournament result. Closing the final stage enables the normal tournament finalisation review.

Cut lifecycle: **unavailable → draft → blocked/ready for review → committed**, with an unpublished draft **invalidated** when any relevant input changes. A committed cut is immutable evidence; if safely superseded, retain the old revision and its successor. A successor field derived from a cut is not a second application/admission. Proposed dependencies become published competitive dependencies when successor pairings are published, not merely when a draft is displayed.

Propose explicit director actions for closure, cut commitment, successor publication and match start. Automation may calculate previews but cannot pass those gates. A ready destination awaits authoritative field/eligibility/profile and lineup checks; it never becomes running because a browser subscribed to it.

## 4. Qualification, terminal ties and seeding

### H5-CUT-01 Reviewable input and atomic effect

A cut preview names the source stages and their closed result revisions, exact applied standings revisions, eligibility revision, fixed qualification/seed policy and destination plan revision. Show selected and excluded entrants, reasons, boundary ties, seed and destination slot, and outstanding blockers. Every published source result/dispute must be terminal; stale derived rankings are a visible pending-update blocker.

Commit checks current authority, tournament state, all relevant authoritative revisions, source closure, eligibility and uniqueness again. A concurrent correction or withdrawal rejects the whole stale request; never commit seven of eight qualifiers. Retain the reviewed snapshot, terminal-selector evidence, actor, time, operation identity and predecessor. A repeat with the same operation/content returns the original receipt; changed content conflicts. An uncertain response requires receipt/current-cut reconciliation before a fresh operation.

Use a composite revision barrier where necessary: no global counter or cross-schema transaction is prescribed. Competition owns the cut/advancement intent; Standings supplies applied source evidence, Registration authoritative eligibility and Tournaments current plan/lifecycle. The future technical design must establish a durable all-or-nothing public transition under cancellation and cross-module races. Matching projected counts alone is insufficient.

### H5-CUT-02 Terminal selector without fabricated ranking

Recommend a supervised recorded random draw as the initial terminal selector, announced before start, applying only after the profile's competitive criteria are exhausted. Do not select by alias, entrant ID, request arrival, floating-point rounding or director preference. A competitive decider is a legitimate alternative, but adds matches, readiness and closure rules and must be selected explicitly before play; it is not an incident shortcut.

Top-8 example: A–G rank above a three-way shared eighth between H, I and J. Record the tied set, one available place and procedure inputs; draw order I, H, J qualifies I, with H/J excluded by selection rather than falsely assigned competitive ranks nine/ten. Retrying preserves this exact draw. If a tie is wholly inside the eight, it still needs the announced deterministic seed selector to establish distinct bracket seeds; it does not affect qualification. A tie wholly outside the cut requires no draw unless an announced downstream purpose needs it. Show competitive shared position separately from cut priority/seed.

Recommended Swiss seed slots follow H3's reviewed placement: [1, 8, 4, 5, 2, 7, 3, 6]. No reseeding after a round. A cut record links every seed to source ranking and selector evidence; successor scores start at zero with its own profile. Source points remain in source history; never add league and elimination points to produce a fabricated tournament total.

### H5-CUT-03 Group example and crossings

Concrete first fixture: 16 entrants, four equal round-robin groups A–D, top two per group. Each group has six matches; qualification follows 24 effective group results. Recommend fixed crossings Q1=A1/B2, Q2=C1/D2, Q3=B1/A2, Q4=D1/C2; semifinals Q1/Q2 and Q3/Q4, then final. This keeps same-group qualifiers in opposite halves, so they can meet only in the final. There are seven played elimination matches with no incidents/byes, 31 total. The crossing policy and its expected fixtures remain D-58 proposals, not an imported official rule.

If group B has a shared second, resolve B's one remaining place using the announced selector. Do not compare B's second with C's third to fill it. If a group cannot provide its quota after eligibility checks, block with the source/quota incident; no wildcard, smaller bracket, highest historical score or operator-picked substitute appears automatically. Uneven groups (for example 15 entrants as 4/4/4/3) use per-group quota/rank, never total points across groups, and require fairness review before that template is approved.

## 5. Incidents, corrections and recovery

### H5-CR-01 Published dependencies are the conservative boundary

Propose extending D-07/24/45/54: block ordinary source correction as soon as dependent successor pairings are published, including a same-qualifier edit that changes only points. Started/played successors are necessarily blocked. Never partly rewrite source standings while leaving its committed cut and published opponents apparently current.

Before successor publication, permit a reasoned correction only through impact review: reopen the closed source if necessary, invalidate unpublished successor drafts and the current applicability of its cut, retain all predecessor evidence, apply the correction once, rebuild and close the source on current inputs, then create/review a replacement cut. Do not claim the old committed cut remains authoritative while its source is reopened. Destination publication is blocked during recovery. Reopening a tournament final revision preserves the previously approved final and does not bypass any dependency gate.

A correction racing successor publication must have one serialisable functional outcome: correction succeeds and publication fails stale, or publication succeeds and correction fails dependency. No transient externally usable successor can be based on partly corrected inputs. Correction notices identify supersession and link to current state; old live/email/hook deliveries cannot be retracted and must never overwrite newer state.

### H5-EX-01 Withdrawals, understrength and cancellation

| Situation | Proposed handling |
| --- | --- |
| Departure during a source stage | Apply its existing format-specific incident policy and preserve prior play; do not inherit league/Swiss rules into elimination |
| Qualifier becomes ineligible before cut commitment | Invalidate preview and block for the published quota/eligibility policy; default no automatic replacement |
| Departure after cut commitment | Preserve selected identity and slot; handle at destination under H3 departure policy, with dependency-aware revision if eligibility changes before publication |
| Team lacks eligible starters | Qualification is distinct from match readiness; block start for an incident, never add a player or qualify the reserve team automatically |
| Required source never obtains a valid closed ranking | Block cut; recommend explicit cancellation/exceptional closure review rather than invented qualifiers; exceptional labels need D-59 approval |
| Tournament cancelled while cut commits | One authoritative ordering; if cancellation wins, no cut becomes usable; otherwise retain committed evidence but cancel unresolved destination work |
| Connected consumer fails after assignment | Reconcile H4 current fenced attempt and durable execution receipt; a hook redelivery cannot authorise a new simulation |

No new entries, roster unfreeze or new player identity is permitted through stage advancement. Do not silently promote the next source rank when an entrant leaves. A reserve/replacement policy could be valuable but changes sporting expectations and remains an explicitly excluded follow-on unless the maintainer selects it before the fixed plan.

## 6. Individual and direct-team continuity

Individual entry IDs carry through both stages without roster/lineup payloads, fictitious one-player teams or extra readiness commands (IP-01–06). Group/Swiss participation and elimination participation remain traceable to that same entrant. An unplayed administrative advance records no personal appearance.

A direct team carries the same tournament entrant and frozen tournament roster, including eligibility restrictions, across the cut. Team membership in a persistent club is not a replacement tournament roster. Match lineups may differ among eligible frozen members under the inherited rules, but stage transition opens no transfer or substitution window. A five-starter team with only four currently eligible members may qualify on results but cannot start its next played match. Understrength follows the incident policy; it is not permission to draft an additional starter.

A team earns one outcome and one advancement per match. Do not multiply points, webhook facts or tournament wins by roster size. Team notices target currently entitled representatives and affected members only according to the agreed notice category; selecting a team never exposes its private roster in a public cut. Personal history credits actual appearances by stage/match, not every rostered player's team result. Byes, draws and administrative advances retain distinct play evidence.

## 7. Live following and reconciliation

### H5-LIVE-01 Current snapshots, not guaranteed instant delivery

Recommend a tournament-scoped read subscription carrying small public/protected invalidation hints, followed by authoritative API queries. Browser following and server webhooks are different products with different acknowledgement/retry contracts. Choose SignalR or server-sent events in a later technical ADR; this discovery selects neither. Initial SSR and shared caches follow ADR 0011, never embedding private subscriber state.

A snapshot identifies tournament/stage, effective resource revision, source/applied standings revisions and generation time. An updating standings view retains its last permitted snapshot with a visible pending-update label; it is not current cut/finalisation evidence. Provisional ranking, closed source and final tournament status remain distinct. “Connected” reports channel state, not ranking freshness or a guarantee that every fact was observed.

On connection, establish a snapshot plus cursor supporting reconnection without a read/subscribe gap. Proposed contract: obtain a scoped snapshot with a cursor and subscribe after that cursor; replay covers intervening changes. On unsupported/expired cursor, signal full resynchronisation explicitly. The implementation may use an equivalent subscribe-and-buffer barrier but must prove no lost change at the boundary. Reconnect always queries current snapshot before claiming current; skipped intermediate hints are acceptable because the read converges.

### H5-LIVE-02 Failure and access changes

Ignore older/duplicate resource revisions. Resource revisions are local: do not compare a match's revision 9 against a stage's revision 3, and do not treat a timestamp as a total ordering. A higher tournament invalidation cursor signals a read, not permission to compose an inconsistent cross-resource snapshot. Show pending reconciliation if dependencies have not caught up. A reconnect may collapse many hints into one current read; it must not replay obsolete success toasts as new competitive facts.

States include connecting, following, updating, reconnecting, offline and access lost. Manual refresh remains usable; propose polling at 30 seconds while live is unavailable, with backoff under errors/rate limits and a pause when the page is hidden/offline. Resume with a fresh authorised read. This is a candidate fallback, not a promised freshness SLO. D-60/65 must fix measurable delivery/recovery limits and load caps before release.

Public→private or grant revocation closes/denies further subscription reads and queued delivery, invalidates shared public caches and clears inaccessible content in the active view once the access change is observed. Use a content-free invalidation/denial rather than disclosing private state as the final event. Recheck current authorisation for each protected dispatch/reconnect/read; a connection is not a permanent grant. Already downloaded material cannot be recalled; clearly state this limitation. Unlisted resources never enter public topic discovery.

## 8. Operational email

### H5-MAIL-01 Address, preferences and recipient authority

Recommend email as an optional operational channel complementing H2's in-app inbox, never a competitive start/confirmation dependency. Propose categories for entry/admission, next published match, material date/cancellation change, action needed (confirmation/dispute) and reviewed final/revised outcome. Exclude promotions, bulk arbitrary messages and evidence attachments. Reading an email does not confirm a match report or accept an invitation.

Use an account-controlled verified delivery address separate from login identity; address changes require verification and invalidate pending verification links. Propose no raw guest email collection in H5's first path: unlinked guests retain organiser-managed communication until separately agreed consent/contact ownership exists. This avoids quietly changing D-22's no-contact guest contract. Team representatives use their own verified addresses; one team member cannot supply an arbitrary address for another. Shared addresses do not merge identities or disclose other recipients.

Default channel off until verification and operational category choice; in-app delivery follows its inherited policy. Users may disable email categories without withdrawing or losing portal access. Security/account-recovery mail belongs to the identity provider's process, outside this channel. A revoked representative receives no subsequently dispatched private team mail; resolve current scope again immediately before sending. Verification is possession of the address, never proof of tournament authority.

### H5-MAIL-02 Delivery lifecycle and uncertain provider response

Logical delivery identity is fact/subject revision + recipient + channel. Resolve current recipient rights, address verification and preferences at dispatch; never expose other addresses in To/CC. Minimal subject/body links to current authorised detail and omits private evidence, roster/contact data and free-text reasons. For a private tournament, propose a generic subject without tournament title/opponent/result. The link grants no read authority and carries no reusable credential.

Lifecycle: **queued → sending → provider accepted → delivered if authenticated provider evidence exists**, with **deferred**, **failed**, **bounced**, **suppressed** or **unknown** as distinct outcomes. Provider acceptance is not inbox receipt or reading; do not promise either. Deduplicate authenticated provider callbacks, and preserve a later bounce even if an earlier accepted callback arrives afterwards. Recommend no open/click tracking. A bounce suppresses further sends to that address until correction/reverification; no competitive mutation follows.

Recommend bounded retries for transient failure over 24 hours, honouring provider retry instructions, with a candidate schedule of 1 minute, 5 minutes, 30 minutes, 2 hours and 12 hours after the preceding failure, stopping at the window. A permanent rejection is terminal. For a timeout after provider acceptance may have occurred, reuse a provider-supported idempotency identity/status lookup; if neither exists, record unknown for operator reconciliation rather than retry blindly and promise exactly-once email. Provider choice, cost/licence, callback authenticity and concrete retention remain gates under D-61/65.

Withdrawn access/preferences suppress queued work and any manual retry. An explicit resend retains the original fact and records a new delivery attempt/reason, respects current rights, and warns that external delivery may already have occurred. Obsolete pairing/action-needed mail is suppressed if the referenced action is no longer current; revised-outcome mail links to current state. In-app evidence stays available under its access policy even when email fails.

## 9. Applications, grants and public compatibility

### H5-APP-01 Registration is not authorisation

Recommend lifecycle **registered/inactive → enabled → suspended/revoked**, with attributable owner/contact, declared interactive/server kind and supported contract/profile versions. Verify ownership of endpoints before activation. An enabled application still needs an organisation's explicit resource/operation grant; an interactive application additionally acts within the current user's rights. Grant lifecycle is **requested → approved → revoked/expired**; privilege expansion is a fresh approval, not an application-owner edit. Scope reductions are effective immediately for new operations/delivery. A credential rotation cannot restore a revoked grant.

Organisation owners approve named scopes such as read state, subscribe, manage entries or submit results; exact catalogue/authentication design needs D-12/62 review. Result-source authority remains a separate explicit permission under H4, and webhook access never implies it. A desktop application cannot keep a shared confidential server secret. Credential values are shown only through the appropriate secure creation/rotation flow, never in public docs, logs or delivery history. Record credential identifiers, not secret material.

Propose explicit credential rotation with a displayed old-key expiry, bounded overlap agreed before release, immediate compromise revocation and no unbounded second credential. Suspend blocks new use without erasing past operations; reinstatement requires an explicit action and fresh validation of grants/endpoints. Revoked credentials cannot reactivate. Application deletion/revocation retains appropriately minimised audit attribution; competitive records do not cascade-delete. General third-party onboarding/abuse handling and identity-provider configuration need a reviewed technical ADR, not assumed extension of H1 administrator registration.

### H5-APP-02 Documented API contract

Publish supported versions, schemas, granted operation examples and full individual/direct-team journeys; business error catalogue; pagination/consistent snapshot semantics; expected revisions; operation identity scope and retention; receipt queries; rate-limit headers/retry guidance; visibility; credential rotation/revocation and subscription recovery. Include connected-profile negotiation and unsupported-version handling. Examples use synthetic personas and endpoints only, never real credentials or identifiers.

Recommend major public API/webhook versions, additive optional fields only within a supported version, tolerance of unknown optional fields/types with reconciliation, and explicit rejection of unsupported required semantics. Propose at least 90 days' announced overlap for a retiring major version; consumers see supported versions and sunset date in documentation and operational notice. Emergency security suspension may override overlap with attributable reason and recovery guidance. This candidate commitment is subject to owner/cost review D-64/65; no general-availability promise is made here.

Before general access, publish concrete per-application/organisation/tournament and anonymous read limits, burst/concurrent-subscription caps, payload sizes, endpoint timeouts, receipt/cursor/delivery retention and support/escalation ownership. A rate limit returns retry guidance and never silently discards an accepted competitive write. Idempotency scope must include application, organisation and operation kind; changed content under the same identity conflicts. Expired guarantees return an explicit outcome requiring current-state reconciliation rather than implying the original write never happened.

## 10. Webhooks and server subscriptions

### H5-HOOK-01 Subscription and safe destination lifecycle

Recommend subscriptions bound to one application grant, organisation, explicit tournament set, approved public event categories, schema version and verified HTTPS endpoint. No global wildcard private feed. Lifecycle: **pending verification → active → paused → active**, or **revoked** terminally. Endpoint edits/ownership changes require new verification and a revision/fence; old queued work never silently moves to a different URL. Pausing stops dispatch; resume reconciles current state before any requested replay. Revocation ends the feed and invalidates pending attempts. Delivery visibility is restricted to its owner/current authorised operators.

Destination verification must prove control and prevent arbitrary server-side requests: reject credentials in URLs, local/private/link-local/metadata destinations and redirects; validate resolution at every attempt against DNS changes and apply outbound restrictions. Do not log verification/signing secrets. The future security ADR selects verification/authentication, key management and network enforcement. A reachable endpoint is not evidence it belongs to the organisation. No production endpoint is registered by this documentation change.

### H5-HOOK-02 Public envelope and receiver responsibilities

Propose public integration categories for published/changed competitive state, cut committed/superseded, reviewed final/revised outcome and tournament cancellation. These are candidate contracts, not additions to ADR 0017's published-event inventory. Never forward internal domain/integration events unchanged or expose transport queues to an external webhook receiver (ADRs 0004/0016/0017).

Envelope: stable logical event ID, schema version/type, subscription ID/revision, permitted organisation/tournament/stage/resource identifiers, subject revision, occurrence time, stream cursor and authorised reconciliation link. Payload minimises content: no contact, private reason/evidence, hidden roster or credential. Streams/cursors remain scoped and opaque; time is informational. Authenticity covers raw payload, timestamp and delivery-attempt identity with a key ID; require a bounded replay-validation window and overlapping key rotation. The security design must fix the algorithm/window before implementation; do not treat an unsigned event ID as proof of origin.

The receiver authenticates, durably stores/deduplicates the logical event, acknowledges promptly, then queries the API with current grants. A 2xx acknowledges durable acceptance of the message, not completion of its competitive effect. Redelivery keeps logical ID/body/subject revision, while attempt ID/signature time change. A sender cannot guarantee exactly-once effects at another server; the receiver must make its own applied operations idempotent. A paused/revoked grant cannot be bypassed by fetching an old event URL.

### H5-HOOK-03 Retry, replay, gaps and revocation

Recommend at-least-once delivery while active within a 24-hour retry window, no total-order guarantee. Retry timeouts, 408, 429 and 5xx using 1 minute, 5 minutes, 30 minutes, 2 hours and 12 hours after each failure, stopping at the window and applying bounded jitter; honour Retry-After within that window. Other 4xx fail terminally and require endpoint/operator correction. Do not follow 3xx redirects. Proposed 10-second endpoint timeout, 64 KiB payload limit and seven-day authorised replay/cursor retention remain D-63/65 review candidates. Retries check current subscription/grant/visibility first and stop after revocation.

Delivery states: **queued, attempting, retry scheduled, acknowledged, failed/exhausted, suppressed**. Persist each attempt and reason separately from the logical event. Repeated failure is visible to the authorised operator and in-app application owner; it never reopens a match or reverses a cut. A timeout after receiver persistence redelivers the same logical event. Manual replay uses its original logical identity, requires current authority and is bounded by retention; it cannot force receiver reprocessing.

Concrete reconciliation: consumer has match M revision 6; receives revision 8 twice and then 7. Store event IDs once, fetch current M (possibly 9), retain 9 and ignore older hints. Missing revisions 7/8 is acceptable for a current-state mirror, but not proof of a complete historical ledger. If a cursor predates retention, return resynchronisation-required and enumerate a consistent scoped snapshot with a cursor, including deleted/withdrawn-resource treatment, before resuming. Do not infer deletion from a missing page in a changing pagination sequence. A history-oriented consumer needs the separately authorised durable history API, not an assumption that hooks are an eternal event log.

No read/subscribe gap is permitted when creating/resuming a subscription: snapshot/cursor barrier follows §7. A replay may omit facts no longer authorised; return a generic resynchronisation/access outcome without leaking metadata. Revocation is checked before dispatch and before protected replay/read; a worker's earlier lease is insufficient. Already dispatched requests cannot be recalled: the contract distinguishes queued/dispatch-started/acknowledged time and acknowledges possible completion of an in-flight request after revocation. Subsequent retries are suppressed. Consumer receipt never authorises a new H4 execution attempt.

## 11. Privacy, history and functional ownership

The public baseline remains aliases only and no public roster/lineup/contact/private evidence unless D-09 is separately changed. Apply visibility to stages, brackets, cut previews/history, live streams, SSR, delivery logs, search and APIs. Public cuts show only reviewed public identities and selection explanation; internal eligibility/sanction reasons stay protected. Application owners see their own delivery receipts and redacted diagnostics, never another application's credentials or private competitive evidence.

Retain stage plan, draw/selector inputs/output, source result and standings revisions, cut predecessors, destination provenance, eligibility/roster references, actor/application, time, reason and operation receipts as durable business evidence (ADR 0007). Delivery logs, provider callbacks and transient transport retention cannot substitute for this history. Rebuild current projections from retained source records; a lagging rebuild blocks dependent publication. Account deletion minimises identity according to the agreed policy while preserving opponents' competitive evidence; do not silently retain raw email indefinitely.

Candidate retention separates immutable competitive evidence from short-lived live cursors and delivery bodies. Concrete deletion/anonymisation, receipt deduplication windows, provider retention and operational access must be agreed before release (D-65). Never purge an identifier still required by a promised retry/replay guarantee without an explicit expiry response. Audit access/grant/endpoint changes and suppressions without storing secrets, personal addresses in public artefacts or private free-text bodies in generic logs.

Functional boundaries: Tournaments owns plan/visibility/tournament lifecycle; Registration entrant/roster eligibility; Competition stages/cuts/pairings/effective results; Standings applied/explained ranks; Notifications recipient preferences and email under proposed ADR 0017. Public subscription/application delivery ownership is a technical design gate; do not automatically put external credential grants into Notifications or create a new module here. Its owner must consume permitted public contracts through the existing boundaries and cannot make competitive decisions.

## 12. Complete user journeys

| Journey | Complete path and observable recovery |
| --- | --- |
| H5-UJ-01 Individual groups to champion | Director publishes four-group/top-two plan and terminal selector, admits 16 individual entrants, starts/fixes plan, plays 24 group matches, resolves a shared-second draw, reviews/closes all groups, previews and commits eight qualifiers, reviews/publishes crossings, plays seven elimination matches, reviews/finalises. Entrant IDs persist; no lineup requests. A stale cut fails wholly and is reviewed again; final page separates group rankings, cut priority and final positions. |
| H5-UJ-02 Direct-team Swiss cut | Director configures supported Swiss rounds/Top 8 and compatible team profiles for 32 team entrants; teams freeze rosters and play under H4. Current source closure enables cut review. One selected team has four eligible starters for a five-starter destination: the slot remains theirs, start blocks for an incident, no transfer opens. A valid match lineup later uses only eligible frozen members. Elimination counts one outcome/advance per team; final and personal histories preserve actual play. |
| H5-UJ-03 Correct before dependency | Director detects a source error after cut commitment but before destination publication, reviews impact, safely reopens source, invalidates destination applicability/draft, corrects and closes again, commits successor cut and publishes. A concurrent publication either blocks correction or loses stale; if it already won, operator sees the published dependency and cannot alter source ordinarily. Earlier delivery links reconcile to the retained supersession/current state. |
| H5-UJ-04 Follow through outage and privacy change | Follower reads permitted snapshot/cursor, subscribes, sees effective update and provisional/updating labels, loses connection and uses fallback read, reconnects past cursor retention and resynchronises. Tournament becomes private: further anonymous reads/delivery stop, cache invalidation runs and the view clears on observed denial; downloaded content cannot be recalled. Another organisation's access gives no private rights. |
| H5-UJ-05 Operational email recovery | Participant verifies address and selects categories, receives in-app and optional pairing mail without exposed recipients/evidence. A changed pairing suppresses obsolete queued mail. A provider timeout is reconciled by idempotency/status or remains unknown. Bounce suppresses future email; user fixes/reverifies address, uses portal meanwhile and may request a current-authority resend. No result or admission changes. |
| H5-UJ-06 Independent consumer lifecycle | Application owner registers/verifies endpoint, organisation owner grants scoped reads/hooks, consumer obtains snapshot/cursor and accepts duplicate/out-of-order hints durably, queries current stages/standings and performs only separately authorised mutations. Endpoint outage triggers bounded retries/exhaustion; correction and replay retain logical IDs. Rotate credential/signing key within agreed overlap, revoke grant, suppress queued/retry work and deny reads. Preserve prior competitive authorship and expose the in-flight-delivery limitation. |

## 13. Observable target acceptance

These are future executable acceptance scenarios, not checks performed in this documentation change. Use independent expected fixtures and synthetic identities; repeat competitive fixtures through web and API and with direct teams where applicable.

| ID | Given / action | Observable expected result |
| --- | --- | --- |
| H5-AT-01 Group Top 8 | Complete H5-UJ-01 with no incidents | 24 source + seven elimination played matches; exact fixed crossings, eight unique stable entrants, one reviewed champion; source points not carried over. |
| H5-AT-02 Swiss Top 8 | Complete 32-entry supported fixed-round source with current closed rankings | Exact profile criteria select eight; seed provenance retained, placement follows accepted fixture; no implied completion of H4 without real-consumer evidence. |
| H5-AT-03 Boundary tie | A–G above shared eighth H/I/J; draw I/H/J | I selected once, H/J excluded by selector; shared competitive eighth retained; retry never redraws. |
| H5-AT-04 Seed-only tie | Two qualified entrants share rank above boundary | Announced selector fixes distinct seeds without inventing competitive ranks or changing membership. Tie wholly below cut triggers no unnecessary draw. |
| H5-AT-05 Group quotas | Unequal groups or a shared second in B | Per-group quota and accepted B selector; no comparison of raw cross-group totals, no wildcard substitution. Invalid/unsatisfied quota blocks. |
| H5-AT-06 Incomplete source | Last match pending/disputed or standings applied revision behind | Source closure/cut blocked with named condition; no successor publication from apparent table order. |
| H5-AT-07 Concurrent input | Cut reviewed then result, eligibility or plan revision changes; counts unchanged | Whole commit fails stale and retains input for new review; no partial field or destination side effects. |
| H5-AT-08 Lost response | Cut commits, response lost; same operation/content retried | Original cut/selector/receipt returned, one advancement effect; altered content conflicts. |
| H5-AT-09 Safe supersession | Source correction before destination publication | Reasoned reopening/correction/renewed closure, previous cut retained but unusable, fresh reviewed cut required. No publication during recovery. |
| H5-AT-10 Published blocker | Source correction races/is after successor publication, including same-qualifier score edit | Exactly one transition wins race; published dependency blocks ordinary correction; no partially rewritten source/cut. Started successor is blocked too. |
| H5-AT-11 Departing qualifier | Withdrawal before commitment or after fixed destination | Before commitment invalidates/blocks quota review; after commitment preserves identity/slot and uses incident policy; no automatic replacement. |
| H5-AT-12 Individual path | Individual starts and advances through both stages via API | No team, roster, lineup or empty team-only payload required; actual play credited distinctly from administrative advance. |
| H5-AT-13 Team continuity | Five-starter selected team loses eligibility of two of six frozen members | Qualification preserved, start understrength blocked; seventh/new member rejected, allowed frozen lineup changes retained; one team outcome, no unused reserve appearance. |
| H5-AT-14 Cancel race | Cancellation concurrent with cut commit/destination publication or H4 execution | Authoritative ordering, cancelled work never usable after cancellation; prior facts retained; retries cannot resurrect tournament or assignments. |
| H5-AT-15 Live boundary | Change happens between snapshot and subscription | Replayed hint or equivalent barrier forces a current read; no missed change, correct provisional/applied-revision labels. |
| H5-AT-16 Live outage | Duplicate/older hints, offline period, expired cursor, rate limit | No state regression; stale/offline label, bounded fallback, explicit resynchronisation and consistent snapshot on resume. No fabricated historical completeness. |
| H5-AT-17 Access removal | Public→private or representative/application grant revoked while delivery queued | No new protected dispatch/read/cache entry; active UI clears on observed denial; in-flight external/download limitation disclosed. Other organisation denied. |
| H5-AT-18 Email choice/privacy | Unverified/disabled channel, revoked captain or unlinked guest | No new email; in-app/organiser route unaffected. Enabled verified recipient gets no other address, private evidence or bearer access link. |
| H5-AT-19 Email uncertain/bounce | Timeout after possible acceptance; reordered provider callbacks | Provider idempotency/status reconciliation or explicit unknown, no blind exactly-once claim; authenticated bounce suppresses, callbacks deduplicated, no competitive effect. |
| H5-AT-20 Application grants | Enabled application without grant, delegated user loses authority, revoked credential reused | Denied within current scope; no implicit result-source power, credential rotation cannot restore grant, prior result authorship retained. |
| H5-AT-21 Endpoint safety | Changed URL, redirect or DNS now resolves internally | Verification/fence and per-attempt restrictions prevent dispatch/leak; old work not rerouted silently; no secrets in logs. |
| H5-AT-22 Receiver replay | M6, hints M8/M8/M7, current API M9; receiver accepted first request but response lost | Stable logical deduplication, M9 retained, transport retry produces no new competitive effect; fresh attempt signature; receiver durable ack distinct from processing. |
| H5-AT-23 Failure window | Timeout/429/5xx then exhaustion; permanent 4xx or redirect | Agreed bounded schedule/Retry-After/timeout; no redirect; terminal/exhausted state visible and competitive facts unchanged. Manual replay retains logical ID/current rights. |
| H5-AT-24 Cursor/retention | Consumer resumes after window with resources removed during paginated snapshot | Explicit resynchronisation, consistent scoped enumeration/deletion semantics and gap-free new cursor; no inference from a changing page or eternal-log promise. |
| H5-AT-25 Rotation/versioning | Old key within/after overlap; supported/retiring/unknown schema | Authenticated permitted overlap then rejection; advertised sunset/support and unknown-field handling; no silent required-semantic downgrade. |
| H5-AT-26 Limits/rebuild/history | Exceed agreed caps; rebuild views after interruption; inspect superseded cut and attempt | Retry guidance and no silent loss of accepted writes; dependency blocked until current; durable cut/result history separate from expiring/redacted delivery diagnostics. |
| H5-AT-27 Final review | Last final result resolves, then concurrent correction/incident | Closure only on current applied/reviewed facts; old final revision retained on reopening; final notice never equates source closure with tournament finalisation. |

## 14. Visual exploration handoff

The [canonical H5 inventory](herald-visual-direction.md#h5-screen-state-inventory) lists future surfaces/states and cross-cutting desktop/mobile/accessibility exploration. No screen, mockup or visual approval is created here. Future proposals follow `herald-screens` and ADR 0018; existing league concepts cannot approve combined-stage cuts, application administration or delivery recovery. Visual review complements the authority/race fixtures; screenshots do not demonstrate concurrency or successful external delivery.

## 15. Pending decisions and implementation gates

Decision status stays solely in [baseline §15, D-57–65](herald-functional-discovery.md#15-decision-register-and-development-gates). This handoff assigns review work without creating another decision register. The maintainer is product approver; named specialist roles supply evidence, and if not yet staffed the maintainer nominates them before the gate.

| Register reference | Recommendation/evidence to review | Responsible reviewer and gate |
| --- | --- | --- |
| D-57 | Bounded two-template plan, balanced groups, fixed quotas/power-of-two field; reject arbitrary graphs/carry-over | Maintainer with competition owner; before stage configuration design. |
| D-58 | Recorded terminal draw, separate rank/selection/seed, exact 16-entry group crossing and Swiss Top-8 fixtures | Maintainer with standings/competition owners; before qualification implementation. Confirm sporting/fairness examples independently. |
| D-59 | Current atomic cut barrier, safe pre-publication supersession, conservative published blocker, no replacement; explicit unsatisfied-source closure | Maintainer with module owners; before lifecycle/correction slices. Agree exceptional labels/actions and prove races. |
| D-60 | Snapshot/cursor live reconciliation, 30-second fallback candidate, current authorisation and content-free revocation | Maintainer with frontend/API/security owners; before live transport choice and visual acceptance. |
| D-61 | Verified opt-in operational email, no initial guest contact capture, unknown-response/bounce handling and provider choice | Maintainer with identity/privacy/operations owners; before contact storage/provider integration; verify cost/licence and callback authenticity. |
| D-62 | Scoped app/grant/credential lifecycle, independent result-source grant, endpoint verification and revocation | Maintainer with identity/security owners; before public application registration; reviewed authentication/security ADR required. |
| D-63 | Public minimal webhooks, signed attempts, durable receiver ack, bounded retry/replay and in-flight limitation | Maintainer with integration/security/consumer owners; before subscription dispatch; agree public schema/authenticity and adversarial endpoint fixtures. |
| D-64 | Complete API/recovery documentation, major-version semantics and candidate 90-day overlap | Maintainer with API/real-consumer owner; before general third-party access; independently exercise both participation journeys. |
| D-65 | Concrete quota/freshness/retention/overlap/support values, privacy/purge and bounded cost evidence | Maintainer with operations/privacy/engineering owners; before release commitments. Proposed numeric candidates above require approval; unresolved caps are blockers, not unlimited defaults. |

The [roadmap handoff](roadmap.md#h5-discovery-and-delivery-handoff) owns proposed delivery sequence and completion evidence. Each future slice closes its relevant inherited and H5 gates, has its approved OpenSpec change, reviewed surfaces and executable scenarios. This document alone authorises neither implementation nor acceptance of the candidate policy.
