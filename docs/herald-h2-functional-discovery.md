# Herald H2 — Participant Portal, Functional Discovery and Delivery Scope

Version 0.1 · 13 November 2026 · Functional definition for review; no implementation claimed

## 1. Purpose, authority and decision status

H2 lets an individual or team representative discover, enter and compete without an operator mediating every step. It builds on H1's individual/direct-team league and follows M4's deployed environments. It adds participant self-service, representation, collaboration, protected history, in-app notices and bounded automatic transitions.

This is the detailed H2 extension of the [functional baseline](herald-functional-discovery.md). Shared vocabulary, competition rules and H1 contracts remain there. Its [§15 decision register](herald-functional-discovery.md#15-decision-register-and-development-gates) remains the single product decision register; H2 rules below reference D-30–38. The [roadmap](roadmap.md) owns sequencing and implementation status. [Visual direction](herald-visual-direction.md) owns screen contracts. `openspec/specs/` continues to describe implemented behaviour.

**Confirmed by the maintainer on 13 November 2026:** open participant registration without opening administration; do not check guest identity coincidences at account creation or registration; automatically cancel at the registration deadline when the minimum admitted field is not reached, notifying participants and the organiser; include the complete bounded automation set in §5.

**Author-defined defaults for review:** the remaining detailed policies were defined under the maintainer's instruction to complete H2 as a domain expert. They are concrete recommendations, not claims that every detail was individually approved. §13 identifies them and the implementation gates still requiring review. This documentation change does not approve production work or select an identity-provider configuration, scheduler or integration design.

**H1 compatibility:** H1's restricted administrator sign-in and manual registration window remain the description of current code. H2 adds a distinct participant access path and clock-driven registration transitions. The H1 historical decisions are not rewritten as if these behaviours already existed.

## 2. Outcomes, actors and boundaries

### 2.1 Outcomes

1. A new participant can create an account, obtain a place, check in, handle a match result and consult history.
2. A captain or non-playing manager can do the equivalent for a direct team, with eligibility and representation kept separate.
3. A tournament makes scheduled admission decisions without silently depending on an operator being online.
4. Pending reports never change points, and disputes have attributable independent resolution.
5. Every user sees their current status and next action without exposing another person's private data.

### 2.2 Actors and authority

| Actor | H2 authority | Explicit limit |
| --- | --- | --- |
| Visitor | Public discovery; public and unlisted detail/results by permitted link | No mutation; no private discovery |
| Participant | Own profile, individual applications, check-in, match reports/responses and history | Account creation grants no administrator access or organisation creation |
| Team member | Own accepted membership and participation information | Membership alone grants no representation or result powers |
| Team captain | Register the represented team, manage tournament rosters, check in, submit lineups and handle results | Only represented team scope; no referee or organisation powers |
| Team responsible person | Captain powers plus management of team identity and representatives | No power to rewrite frozen rosters or past results |
| Organisation owner | Existing administrative powers; invite scoped collaborators | Restricted administrator eligibility remains required |
| Tournament director | Delegated preparation, entry and competition operations for named tournaments | No general organisation administration |
| Referee | Delegated incidents, results, disputes and permitted corrections for named tournaments | No resolution involving their own entry or represented team |
| Automatic process | Only the transitions and conditions in §5 | No implicit sporting judgement or unrestricted operator authority |
| External application | Explicitly delegated operations through the public API | Knowing a resource identifier or holding a receipt grants no authority |

A person may hold several relationships. Each operation checks the current acting person, represented entrant and resource scope. A person cannot act for both sides to confirm their own report. Revocation blocks subsequent privileged actions and preserves past authorship.

### 2.3 Included and excluded scope

Includes discovery; participant accounts; own and represented entries; admission and waiting lists; self-service check-in; persistent team identity and representation; roster/lineup submission; competitor reports, confirmation and disputes; scoped staff invitations; private invitations; in-app notices; private personal/team history; delegated API actions; §5 automation.

Excludes payments/refunds, chat, evidence attachments, appeals, email/push channels, recommendations, public people search, public global player histories, automatic guest merges, new result profiles or competition systems, in-match substitutions, composite encounters, circuits and automatic team formation from an individual pool (D-28). Existing H1 profiles and safe correction limits apply. Email remains H5; richer results remain H3 or a separately approved bounded change.

## 3. Participant identity, invitations and private access

### H2-ID-01 Open participant account, restricted administration

Anyone may create a participant account and choose their display alias. Authentication is required before a self-service mutation. Identity is stable and is never inferred from an email address or name. A participant account does not grant the administrator application role, organisation membership, organisation creation or access to private operational records.

A person already authorised to administer may also participate. The interface shows the available contexts without combining their permissions. A staff invitation alone does not enable administrator sign-in: the recipient must also pass the existing platform-managed eligibility process. Show separately whether invitation acceptance or administrator habilitation is pending.

### H2-ID-02 Guests and later verified linkage

Do not search for, flag or block a possible guest coincidence during account creation or self-service registration. One active entry per known individual/team identity remains enforced, but a newly created identity is not presumed to be an existing guest. There is no promise to detect the same human entering through two different identities.

When a coincidence is explicitly identified, the account holder may request linkage and the relevant organisation's owner verifies it. Do not expose guest records across organisations or merge by name/email. Record verifier, time, affected identities and reason. Preserve original entrant, roster, result and actor identifiers; do not confer organisation access.

If both records already have entries in the same tournament, linkage must not silently collapse slots, points or participation. The owner resolves the conflicting entries using the permitted cancellation/correction procedures before completing linkage; frozen competitive history remains attributable. Cross-organisation claims are separate verifications. Detailed verification evidence and identity-provider integration are slice design gates.

### H2-ID-03 Visibility and invitation lifecycle

| Visibility | Discovery | Read access |
| --- | --- | --- |
| Public | Listed | Anonymous permitted content |
| Unlisted | Never listed, including title searches | Anyone with the link, permitted content only |
| Private | Never listed | Current explicit tournament access or scoped operational authority |

A private invitation grants tournament read/application access, not a place. It is a single-use link, valid for seven days, bound to the signed-in account that accepts it. It is shareable through an external channel; H2 does not send email. The creator may revoke an unused invitation and separately revoke an accepted access grant. Expiry concerns unaccepted invitations; it does not silently expire an accepted grant.

Team representation and staff invitations use the same proposed seven-day, single-use acceptance policy, with their own explicit scope. Guessing a link or an expired/revoked invitation reveals no private tournament content. Revoked read access does not erase earlier competitive evidence.

## 4. Discovery, admission and self-service readiness

### H2-EN-01 Directory and tournament detail

Filter public tournaments by game, variant, dates, on-site/online mode, location, registration state and individual/team entry. Public historical results remain discoverable. Show organiser, rules, reference time zone, capacity unit, indicative availability, admission mode, minimum admitted field, registration deadlines and current competition state. Team detail also shows roster bounds, active players per match, freeze deadline and lineup requirements.

Availability is informative; only successful admission secures a place. Full tournaments may offer a waiting list without implying a vacancy. No contact details, rejected applications, private reasons or private tournament metadata enter search or shared public caches.

### H2-EN-02 Applications, capacity and departures

Use H1's admission semantics: admitted entries consume one slot; waiting applications do not. Show waiting for capacity separately from waiting for approval. With automatic admission, a vacancy promotes the first eligible waiting entry while registration is open; promotion directly grants the slot and creates a notice. Manual admission respects capacity and records exceptions to queue priority.

Participants apply only while registration is open. After closure, only an authorised operator may admit before start, subject to the deadline outcome in §5. A duplicate request for the same known identity returns its existing application rather than another slot. Cancellation before start frees a place; reapplication loses queue priority. Rejection has a private reason and a new application requires the director's permission.

If pairings are published, a participant requests cancellation and the director first withdraws/reviews publication before changing the field. After competition start, use competitive withdrawal, preserve earlier outcomes and apply H1's remaining-match policy. No late entrants after start. Automatic cancellation of the whole tournament is a separate terminal action, not a set of voluntary withdrawals.

### H2-EN-03 My competitions and next action

List own individual applications, accepted team participation and represented team entries without merging their authority. Show admitted/waiting/rejected/cancelled state; check-in; roster readiness; published next match or matches; pending confirmation/dispute; provisional/final/cancelled outcome. Name the represented team whenever acting for it. Do not reveal draft pairings.

### H2-EN-04 Check-in

An admitted individual or team representative may confirm or undo check-in at any time before competition start. H2 does not add a configurable check-in window. Waiting entries cannot check in; promotion starts pending. Mandatory check-in gates start; optional check-in records the same evidence. Team check-in confirms the entry, not the presence of each member. Keep the H1 restriction on changing the policy while confirmed check-ins exist.

Missing check-in never triggers deadline cancellation by itself. The operator reviews absences and start readiness. At least two eligible entries are required to start even when the deadline check previously passed. Neither a full roster nor a confirmed captain's check-in proves all starters are present.

## 5. Lifecycle and bounded automatic transitions

### 5.1 Scheduled registration and minimum field

**Confirmed direction, D-35/36:** dates become operative in H2. Each published tournament declares opening and closing instants and a minimum admitted entry count, at least two and no greater than capacity. A team counts as one entry. The minimum is visible before application; filling the maximum capacity is never required.

| Trigger | Required current state | Transition and observable effects |
| --- | --- | --- |
| Opening instant arrives | Published, preparation, registration not yet open, valid current dates and no manually closed state | Open registration; do not publish drafts or reopen a manually closed window |
| Closing instant arrives | Published, preparation, current closing deadline reached, open/not-open/already manually closed registration | Close registration and evaluate the current admitted field exactly once for this deadline revision |
| Admitted count is below minimum at deadline | Same deadline evaluation | Cancel competition with reason `minimum-not-reached`; close registration, release admission reservations, preserve entries/history and make all entry mutations unavailable |
| Admitted count reaches minimum at deadline | Same deadline evaluation | Keep competition in preparation with registration closed; do not start, freeze all match lineups or declare everyone ready |
| A valid vacancy exists while open | Automatic admission; eligible waiting entry | Promote one eligible entry per available slot under H1 queue policy; start its check-in pending |

At the deadline count only entries already admitted, regardless of pending check-in. An admitted team whose roster is still incomplete counts; roster eligibility is reviewed separately before play. Waiting-for-approval and capacity-waiting applications do not count. No last-minute automatic admission sweep is implied by closure.

An early manual close does not cancel immediately and does not suppress the later deadline check while the tournament remains in preparation. An early manual reopen does not change the closing instant. Before the deadline, the director may extend it explicitly and notify affected people. Extending before cancellation invalidates obsolete scheduled work. Do not accept self-service applications or automatic promotions at/after the closing instant even if the scheduled worker is late; subsequent reconciliation applies the recorded deadline to the eligible pre-deadline field.

**Proposed operational safeguards:** publish only with a future closing deadline; block starting before the announced closing instant until the director explicitly brings it forward and the minimum check completes. Prevent a higher minimum after the first active application; allow a lower minimum, never below two, as an announced material change before expiry. After automatic cancellation, changing dates cannot resurrect the tournament: create a replacement and invite people to apply again. A cancelled entry does not carry over automatically.

### 5.2 Other automatic transitions

| Trigger | Transition | Important boundary |
| --- | --- | --- |
| Unaccepted invitation reaches expiry | Invitation becomes expired | Do not revoke an already accepted grant |
| Announced roster deadline arrives | Freeze the tournament roster at an identifiable revision | Incomplete/ineligible entries remain visible and blocked; no automatic expulsion or fabricated eligibility |
| Opponent explicitly confirms a report, including an identical counter-report | Report becomes the effective result and standings update once | Current match/report revision and opposing authority required |
| Opponent rejects or counter-reports a different result | Open a dispute, retaining both versions and reasons | No points from either pending version |
| Every pairing in a round has a valid terminal resolution | Complete the round | No unresolved disputes; no automatic next-round publication or competition finalisation |

Freeze never creates a lineup. A representative submits a valid lineup before each team match; submission locks that version. H1's round completion and promotion semantics are reused rather than replaced by a second mechanism.

### 5.3 Notices, reminders and safe execution

Automatic cancellation notifies the organisation owner, delegated directors, admitted individual account holders, representatives of admitted teams and applicants/representatives still waiting. Guest-only entries remain covered by the organiser's external communication process: H2 cannot deliver an account inbox notice to someone without an account. The organiser sees affected guest entries requiring communication.

Send an organiser reminder before the closing deadline showing minimum, current admitted count, waiting-for-approval applications and cancellation risk. **Proposed timing:** 24 hours before closure; if published with less notice, send once at publication. A revised deadline invalidates obsolete reminders. Reminders never admit, cancel or claim someone read a notice.

Every automatic transition records system actor, effective trigger, execution time, reason, prior/current state and relevant revisions. Retry or concurrent execution creates no duplicate transition, capacity allocation, points or recipient notice. Recheck state and current configuration when acting. Work for an obsolete deadline, cancelled tournament or already completed transition has no effect.

Deadline checks must use authoritative admission facts through the deadline, not an eventually consistent screen count. Record which field revision and minimum produced the decision. The implementation slice must specify the admission cut-off, coordination and recovery barrier before code is approved; cancellation must not be presented as complete while writes can still admit entries. A late worker cannot count post-deadline operator admissions as if they happened before the deadline.

### 5.4 Explicit actions that remain manual

Publication; competition and match start; absence/no-show decisions; sporting concessions; dispute resolution; result corrections; final standings review/publication; cancellation for other causes; exceptional rescheduling. Silence and timers do not establish sporting facts. A failed minimum check is the one agreed automatic competition-cancellation rule.

## 6. Persistent teams, tournament rosters and lineups

### H2-TM-01 Team identity and management

A participant may create a persistent team and becomes its responsible person. The team has a stable identity and a display name/alias. Several captains may represent it. Responsibility transfer requires the successor's acceptance; removing the last responsible person is blocked. Team and organisation ownership are unrelated.

Invitations require acceptance. Do not provide a global account/name/email directory. A representative shares an invitation link; acceptance identifies the person. Representatives manage tournament rosters but do not overwrite existing guests or claim another organisation's team. Linking an operator-created guest team requires the relevant owner to verify it, preserving tournament entrant identities.

### H2-TM-02 Membership versus eligible roster

A representative may invite account holders or add guest players under the H1 guest policy. An account holder must accept tournament roster inclusion before counting as eligible. Keep pending invitations distinct from accepted roster members. Guest participation does not require creating an account.

Validate one team per known player among active entries in the tournament, roster bounds, applicable deadlines and H1 eligibility rules. No cross-identity duplicate detection is introduced. General team membership changes do not rewrite frozen tournament rosters. Membership departure cannot bypass a frozen-roster or competitive-withdrawal rule.

### H2-TM-03 Lineup submission and participation

Select the required number of eligible players from the frozen tournament roster. A valid submission locks the lineup version for the match. Before play, an authorised operator may correct it under H1 policy with a reason and retained predecessor. Representatives cannot overwrite locked lineups. Missing active players block start and require an explicit incident decision; they do not automatically withdraw the team.

No in-match substitutions or individual submatches in H2. Individual 1v1 requires no roster, lineup or synthetic one-player team. Team outcome and points belong to the entrant. Actual-play evidence, not merely a locked lineup, establishes personal appearances; reserves remain identifiable as registered but not fielded.

## 7. Reports, confirmation, disputes and corrections

### H2-RS-01 Result mode and report lifecycle

Before competition start choose operator-entered outcomes or competitor reporting with opponent confirmation. Freeze the choice at start. Use available H1 result profiles; numeric scores are accepted only if a separately delivered profile supports them.

| Current condition | Permitted action | Result |
| --- | --- | --- |
| Reportable match, no effective result or pending report | Own individual player or authorised team representative reports | One pending version, no points, opponent notice |
| Pending report | Rival confirms current version | Effective result, standings update once |
| Pending report | Rival submits identical outcome/detail | Explicit confirmation of that version |
| Pending report | Rival rejects with reason or submits different outcome/detail | Disputed, both versions retained |
| Disputed | Independent authorised referee decides with reason | One effective resolution, both sides notified |
| Effective result | Competitor requests correction with explanation | Request for operator review; effective result remains until a permitted correction |

A pending report cannot be edited in place. A reporter who made a mistake requests referee intervention; the opponent may dispute. Concurrent reports are evaluated against the current report revision, never silently overwritten. Matching outcomes with different supported score/detail are not identical reports.

An authorised operator may still record a directly effective resolution under the applicable policy; preserve the pending/disputed evidence and record that the source was an operator decision, not opponent confirmation. Silence has no confirmation timeout. Operators can see unresolved work and intervene explicitly.

### H2-RS-02 Dispute and correction limits

A dispute contains a reason and explanatory text. H2 has no attachments, evidence chat or appeal workflow. Referees and permitted operational actors may read private dispute evidence; participants see only evidence shared within their own match, not unrelated operational records.

A referee cannot decide a dispute involving their own individual entry or a team they represent. Another eligible operator/referee must act; if none exists the dispute stays open and blocks completion. H2 does not automatically appoint a referee or override independence for the owner.

Effective results remain subject to H1 safe-correction and finalisation rules. Preserve predecessors, reasons, actor, time, effects and blocked published dependencies. Pending reports and open disputes prevent round/competition completion as applicable. No correction request silently invalidates an effective result.

## 8. Scoped collaboration

The organisation owner may invite an eligible administrator as director or referee for named tournaments. Acceptance gives only that role and scope; there are no custom role builders or general organisation administrators in H2. Director permissions cover entry, preparation and competition operation; referee permissions cover incidents/results and permitted corrections. Sensitive organisation ownership and platform eligibility remain outside both delegations.

Invitations remain distinguishable from grants and administrator eligibility. A participant accepting a staff invitation still cannot enter administration until explicitly enabled by the platform's restricted process. Revocation takes effect on the next privileged operation, including an operation that was prepared before revocation; completed actions keep their receipt and authorship under current read authority.

## 9. Notices, standings and protected history

### H2-NT-01 In-app inbox

Provide readable/unread notices with links to current state. Notify application decisions and promotion; invitations and relevant acceptance/revocation; cancellation and material changes; roster/lineup actions requiring attention; published pairings; requested confirmation; dispute resolution; correction outcomes and revised final results. Include §5 reminders and automatic cancellation notices.

Team operational notices go to current authorised representatives; player-specific participation notices go only to the affected account holders under current visibility. Failure to deliver does not roll back business state. Avoid duplicate visible notices for the same fact, recipient and channel. Reading a notice is not acceptance of rules or confirmation of a result. Recheck access when opening its target and avoid retaining private tournament content in notices after access is revoked.

These are future notifiable facts, not newly published contracts in this documentation change. Implementation follows [ADR 0017](adr/0017-notifications-consume-fact-events.md), updating its recorded/published inventory when a slice actually introduces a fact or consumer. Email remains H5.

### H2-HI-01 Private personal and team history

Own history shows tournament, game/variant, date, organiser, entry status, relevant matches, provisional/final position and cancellation/withdrawal/disqualification as permitted. Team history is available to current representatives; a member sees their own participation and permitted current team-entry detail. A revoked representative loses team-wide access but retains their own legitimate participation evidence.

Personal history is private in H2. Existing public tournament pages continue to show reviewed aliases, results and standings; there is no global public player/team history directory. Private-tournament information never enters public histories or search. Access to private tournament detail still follows its current grant; historical participation alone does not grant operational or opponent-private access.

Show actual appearance separately from accepted roster membership, reserve status and intended lineup. A rename, representation change or general team departure does not rewrite historic identities. Corrected results update history with revision disclosure; cancelled competitions remain cancelled, never a fabricated win. Retention/deletion procedures beyond preserving attributable competition records require a separate policy before those account operations are offered.

## 10. Public API and observable recovery

All new participant, representative and delegated operator actions have API equivalents, with the same resource/acting-person authority. Scope is current and revocable; an external application needs explicit delegated authority. Application onboarding and broad ecosystem management are not added by this scope.

Mutations use expected revisions and operation identities. A safe retry returns the original outcome; a changed request or stale version fails without partial state. Distinguish forbidden, no longer available, validation failure, stale state, pending outcome and confirmed success without leaking private existence. Lost responses can be reconciled through authorised receipts/current reads. Do not show a successful admission, check-in or resolution until it is established.

Use tournament reference time zone alongside local display where helpful. Store an unambiguous instant and reject ambiguous deadline input until resolved. Background delays are visible as processing/reconciliation states, not as invented final outcomes. Scheduler, identity and cross-module consistency designs are implementation proposals, not fixed by this document.

## 11. End-to-end user journeys

| Journey | Main path | Recovery and success |
| --- | --- | --- |
| H2-UJ-01 Individual | Discover → create account → apply → wait/admit → check in → play → report/respond → history | Last-slot race shows actual status; no roster work; pending report awards no points |
| H2-UJ-02 Captain | Create/represent team → apply → complete accepted roster → check in → submit lineup → handle result | Invalid member/count identified; revoked representative blocked; alternate captain continues |
| H2-UJ-03 Private invitation | Open invitation → sign in → accept explicit access → inspect/apply | Expired/revoked link grants nothing; acceptance reserves no slot |
| H2-UJ-04 Referee | Accept scoped delegation → resolve assigned dispute with reason | Administrator eligibility required; own-entry conflict blocks adjudication |
| H2-UJ-05 Deadline | Review minimum and deadline → organiser reminder → close/evaluate | Insufficient admissions cancel with owner/participant notices; sufficient field remains in preparation |
| H2-UJ-06 Verified claim | Identify guest coincidence → request → owner verifies → preserve historical linkage | Conflicting live entries require explicit resolution; no name-based merge |

## 12. Acceptance scenarios and visual handoff

These are target acceptance scenarios for later slices, not claims of passing executable tests.

| ID | Given / action | Expected observable outcome |
| --- | --- | --- |
| H2-AT-01 Access separation | A new participant registers and tries organisation creation/admin routes | Participant use succeeds; administrative access and creation remain denied |
| H2-AT-02 Coincidences | A guest named Alex exists; a new account with that alias applies | No coincidence search/block/merge; repeat for the same known account creates no extra active entry |
| H2-AT-03 Visibility | Search public, unlisted and private tournament titles anonymously | Only public listed; unlisted link works; private content and history do not leak |
| H2-AT-04 Last slot | Two eligible applications race for one slot; the admitted one later cancels | At most one initial admission; at most one promotion per vacancy; explicit waiting reason |
| H2-AT-05 Check-in | Admitted individual/team representative confirms then undoes before start | Revisioned pending/confirmed evidence; team member presence not inferred; waiting entry denied |
| H2-AT-06 Representation | Ordinary teammate and revoked captain try to report | Both denied; current captain can act; non-playing manager supported |
| H2-AT-07 Roster | Account invitation pending at freeze; roster otherwise too small | Pending person does not count; frozen version retained; entry blocked, not silently expelled |
| H2-AT-08 Lineup | Captain submits valid starters, then tries to overwrite lock | First version locked; correction requires authorised operator; lock alone adds no appearance |
| H2-AT-09 Confirmation | Report pending; rival silent, then confirms current revision twice | Silence changes nothing; confirmation produces one effective result and one points effect |
| H2-AT-10 Dispute | Rival submits different supported detail; referee represents one side | Both versions preserved, no pending points; conflicted referee denied; independent reasoned decision resolves |
| H2-AT-11 Invitation | Accept, replay, expire or revoke invitation; revoke accepted grant separately | One acceptance; expired/revoked link grants nothing; accepted grants do not expire with invitation |
| H2-AT-12 Open | Opening instant reaches a draft, a prepared published tournament and a manually closed one | Only eligible published/not-yet-open window opens; no draft publication or manual-close override |
| H2-AT-13 Below minimum | Minimum four; three admitted plus two waiting at deadline | Registration closed; tournament cancelled once with reason; admitted reservations released, evidence retained; owner/admitted/waiting account recipients notified |
| H2-AT-14 Enough | Minimum four; four admitted of capacity sixteen, including pending check-ins | Close without cancellation; neither full capacity nor check-in required for this check; start still validates eligibility |
| H2-AT-15 Team unit | Minimum four; three admitted five-player teams | Count three, not fifteen; cancellation applies |
| H2-AT-16 Manual close | Operator closes early below minimum | No immediate cancellation; deadline still evaluates unless tournament already terminal |
| H2-AT-17 Deadline race | Owner extends deadline before expiry while obsolete job is queued | Current revision wins; obsolete close/reminder has no effect; no automatic reopen after cancellation |
| H2-AT-18 Late worker | Worker runs late; application/promotion is attempted after deadline | Attempt cannot obtain a post-deadline slot; authoritative pre-deadline admitted field determines outcome |
| H2-AT-19 Pending approval | Sufficient applications but insufficient admitted entries; reminder before expiry | Reminder shows pending work/risk; applications do not count as admissions; cancellation if still insufficient |
| H2-AT-20 Retry/recovery | Duplicate jobs, stale report response, lost save response or notice delivery failure | No duplicate state/points/notices; current-state recovery; delivery failure never reverses decision |
| H2-AT-21 Round/final | Last unresolved pairing receives valid resolution | Round completes once; next round not published automatically; tournament finalisation remains explicit |
| H2-AT-22 History | Reserve never plays; team renamed; result later corrected | No invented appearance; old attribution preserved; revision visible; no private public-history leak |
| H2-AT-23 Scoped staff | Eligible referee accepts tournament A; tries tournament B; participant accepts staff link | A permitted, B denied; participant still needs restricted admin habilitation |
| H2-AT-24 Claim conflict | Verified claim would link two active entries in the same tournament | No silent competitive merge; explicit operator conflict resolution required before linkage |
| H2-AT-25 Guest notices | Automatic cancellation affects account entries and guest-only entries | Account recipients get deduplicated inbox notices; organiser sees guest communication work; no false delivery claim |

Affected surfaces for future implementation: account/sign-in; directory/filter/detail; invitation acceptance; My competitions/own entry/check-in; team identity/representation; roster invitation/readiness; match lineup/detail/report/confirmation/dispute/correction request; organiser scheduling/minimum/reminder/cancellation; staff delegation/referee queue; inbox and private history.

Each affected slice must record desktop/mobile, keyboard, empty/loading, denied/revoked, stale, failed/uncertain-save, blocked, pending/disputed/effective and cancelled states as applicable. The [existing discovery concept](assets/mockups/herald-tournament-discovery.png) covers direction only. [Visual direction §9.4](herald-visual-direction.md#94-h2-screenstate-inventory) owns the screen/state inventory; screen proposals still need reviewed mockups. This documentation PR changes no screen and requires no new executable UI script.

## 13. Decision summary, gates and delivery handoff

The authoritative statuses are D-30–38 in the [single decision register](herald-functional-discovery.md#15-decision-register-and-development-gates). This summary names decisions without creating another status ledger.

| Register | Decision covered | Rule reference |
| --- | --- | --- |
| D-30 | Open participant accounts; keep restricted administrative eligibility and organisation creation | §3, §8 |
| D-31 | No guest coincidence checks at onboarding/application; verified later linkage without rewriting competition | §3 |
| D-32 | Public browsing; private, unlisted and scoped invitations; seven-day single-use default | §3–4 |
| D-33 | Self-service application/admission/departure and pre-start check-in, no configurable check-in window | §4 |
| D-34 | Persistent teams, explicit representation, accepted registered roster membership and locked submitted lineups | §6 |
| D-35 | Deadline minimum uses admitted entry units, at least two; insufficient field automatically cancels with notices | §5.1/5.3 |
| D-36 | Bounded automation; manual-close protection; reminder and reliable/revision-aware execution | §5 |
| D-37 | Frozen reporting mode; explicit confirmation, immutable pending version, dispute and independent referee | §7–8 |
| D-38 | In-app notices, private own/team history and API parity; no email or global public history | §9–10 |

Review gates before implementation: provider/app-registration design preserving ADR 0014's restricted administrative boundary; invitation/linkage evidence and account recovery; current grant enforcement; authoritative deadline/admission coordination and scheduler recovery; team identity scope and guest-reference access; reporting/independent-referee access; notices and private-history visibility; affected mockups and executable scenarios. The 24-hour reminder, minimum-edit/start safeguards and seven-day invitations are author-defined defaults to validate, not previously confirmed technical decisions.

Suggested functional batches: (1) participant identity, visibility and invitations; (2) discovery, own entries/check-in and deadline automation with its notices; (3) team representation/rosters/lineups; (4) reports/disputes and scoped staff; (5) history and remaining notices, followed by integrated UJ-04/05 acceptance. Each batch must deliver the notices and authority checks its actions need; a later inbox-completion batch is not permission to omit cancellation delivery. Size batches only after the delivery-process ADR and preview prerequisites are settled.

H2 exit requires all §12 scenarios assigned to reviewed implementation slices, both individual and direct-team journeys working through web/API, independent dispute resolution, protected private data and the automated minimum-field cancellation journey. Scope agreement is not blanket approval of implementation defaults, mockups or architecture. No production code or implemented specification changes in `h2-functional-discovery`.
