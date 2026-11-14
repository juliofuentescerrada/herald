# Experience patterns: organiser, participant and public portal

Status: maintained UX guidance, accepted 14 November 2026. Informed by the maintainer's supplied `user-experience-perspectives.md` (v1.0, November 2026). That document supplies motivations, anxieties and aspirations; its feature examples are not automatically approved product requirements or implementation instructions.

Use this document with the [style guide](style-guide.md), [component intent](components.md), [icons](icons.md) and [visual foundations](../herald-visual-direction.md). The [H2 functional discovery](../herald-h2-functional-discovery.md) and the [single decision register](../herald-functional-discovery.md#15-decision-register-and-development-gates) own functional scope and decision status. The [roadmap](../roadmap.md) owns sequencing. H2 patterns below describe targets, not implemented screens, approved mockups or permission grants.

## One design system, different jobs

The organiser wants an operational safety net: reliable preparation, a clear view of exceptions and confidence about what each action will change. The participant wants a pocket competition companion: understand the event, obtain a place and see the next useful action without learning tournament administration.

These are UX archetypes, not two new global security roles. A visitor browses the public portal anonymously; a signed-in participant may act for themself or an explicitly represented team. An organiser may also play. Switching the visible context never combines permissions, and the participant portal never becomes an unlocked administration shell (D-30).

| Dimension | Organiser workspace | Public visitor | Participant / team representative |
| --- | --- | --- | --- |
| Main question | What needs my decision, and what will this change? | Is this event suitable and trustworthy? | What do I need to do next? |
| Starting point | Organisation/tournament context and actionable work | Search/listing or shared tournament detail | Own competitions and the current entry/match |
| Composition | Full-width operational groups, compact rows, exceptions first | Public shell, readable content, discovery cards and focused detail | Public/participant shell, focused task and progressive detail |
| Primary information | Counts, readiness, blockers, revisions and effects | Format, rules, organiser, schedule/time zone, eligibility and availability | Actual admission, check-in, represented team, published match and pending response |
| Typical actions | Prepare, publish, admit, resolve, correct, delegate | Inspect/filter/share; sign in when an allowed personal action needs it | Apply, check in, manage permitted team work, report/respond |
| Secondary detail | Read-only history, audit evidence and policy explanation | Full rules, public results and accessibility/location detail | Own history, notifications and detailed match context |
| Emphasis | Calm, dense and easy to scan | Confident competition identity with restrained imagery | Mobile clarity, explicit status and one useful next action |

Shared: semantic tokens, square geometry, type family, spacing scale, breakpoint, focus, accessible targets, feedback meanings, component APIs and icon family. Different: information order, density within the existing ranges, navigation model, copy, disclosure and primary task. Do not fork the tokens, add a second component library or copy the admin rail/tables into the participant home.

## XP-01 Organiser operations

Start with the selected organisation and tournament, independent lifecycle facts and the work that is actionable now. Group registration/capacity, check-in/readiness, current competition and unresolved decisions in the order defined for that page. A summary names the pending decision and links to its work; it is not a collection of decorative statistics.

Preserve the full-width stacked composition. A future "director's cockpit" means situational awareness within this composition, not a new multi-column dashboard or a licence to bypass §7.2. Show the distinction between recorded, pending, effective and final. Explain why a step is blocked and the minimum corrective action; retain audit evidence after the operation. Scope delegated work to the tournament and role actually granted.

Use progressive disclosure for rarely needed detail, but keep consequences, validation and the next required decision visible. Setup should feel straightforward through clear grouping and useful help; a wizard or duplication action needs its own reviewed scope. Do not invent default scoring, automatic corrections or a new incident policy to reduce clicks.

**Review:** an organiser can find the unresolved work without reading every record, explain why an action is unavailable and predict its effects on entries/results before confirming it. Errors preserve their work and offer recovery at the point of failure.

## XP-02 H2 public discovery

Use the public shell and an approachable introduction only where it helps orientation. Lead with the directory's search/filter task and event list; do not require sign-in to read public event conditions. Use event imagery as supporting identity while retaining readable titles and essential facts in text.

Each listing should allow a useful comparison: tournament identity, game/variant, individual/team unit, organiser, date and reference time zone, on-site/online context, entry state and indicative availability. Use the H2-EN-01 filter set; do not add unsupported filters merely to fill a toolbar. Keep selected filters visible, provide reset and distinguish no matches from an unavailable directory. On narrow screens expose a labelled filter summary and contextual filter flow, not a shrunken admin table.

Cards are for scanning and choosing a destination. Their main link opens details; repeated cards do not each need an accent-filled registration action. Do not show private events in discovery. Unlisted/private access follows the reviewed D-32 policy and current grant; a share link is never proof of admission or authorisation.

**Review states:** initial/results/loading, filtered/no matches/reset, failed/retry, full but waiting available, closed/cancelled and public/unlisted/private boundary. These are design targets; detailed invitation/visibility defaults in D-32 remain proposed.

## XP-03 H2 tournament detail and the next action

Lead with identity, organiser, format/rules, entry unit, schedule/time zone and venue/online context. Put the admission conditions and current action where they can be found without searching below a promotional hero. Disclose the announced minimum and deadline before application. Teams additionally need roster bounds, active players and applicable deadlines. Use [H2 §4](../herald-h2-functional-discovery.md#4-discovery-admission-and-self-service-readiness) for the authoritative field/condition set.

Use one next-action area driven by current data and authority. The following is a presentation target under D-32/33, not a new admission policy:

| Current situation | What the person must understand | Interaction intent |
| --- | --- | --- |
| Anonymous visitor, self-service action available | Public details remain readable; account required to act | Sign in/create participant account, then return to this event/task |
| Signed in, no application, registration open | Entry unit, admission mode and indicative capacity | Apply; never promise a slot before the authoritative response |
| Waiting for approval / waiting for capacity | Which reason applies, and that no place is secured yet | Show actual waiting state and permitted departure/next step |
| Admitted, check-in pending | Place secured; separate readiness action remains | Show permitted check-in and its consequence |
| Checked in | Confirmation recorded; this does not prove all team members are present | Show recorded state and permitted next action |
| Registration closed or tournament cancelled | This event cannot take a new self-service entry | Clear state/reason; no dead prominent application control |
| Access/invitation expired or revoked | The current operation is unavailable under current authority | Safe recovery without exposing private event metadata |

Do not treat a countdown or scheduled date as the authority for an action. Reconcile last-slot races and lost responses to the real entry state. Keep publication, registration, check-in and competition separate. An accepted invitation is neither an admitted entry nor permission to administer.

## XP-04 Participant account and own competitions

Delay authentication until the person chooses a personal action; keep the public-reading path available. Explain the benefit and return destination in the sign-in flow. Collect only the information required by the reviewed account/entry contract. D-30 confirms open participant accounts while provider design remains pending; do not promise a particular single-click provider or reuse H1's invitation-only administrator copy for participant onboarding.

After sign-in, lead with the person's own applications and accepted team participation, status and next action (H2-EN-03). Do not reproduce organisation management navigation. A person with several entries must be able to identify the event and acting identity before submitting. Waiting, rejection, cancellation and confirmed admission need distinct copy and permitted actions; no optimistic "You're in" while a request is unresolved.

Self-service check-in should be easy to find and explicit about what it confirms. D-33's detailed policy is proposed: pre-start admitted-entry check-in with undo, no configurable check-in window. Keep that status separate from admission, roster eligibility and presence of individual team members. No guest-name coincidence search is added to onboarding/application (confirmed part of D-31).

**Review:** after authentication, cancellation or an uncertain response, the person returns to a recognisable event/task with the actual current state. Private content disappears when authority is lost; safe recovery does not grant access by retaining a screen.

## XP-05 Participant match-day companion

When published match data exists, prioritise the person's next relevant match or matches: opponent, available schedule and location/station, the relevant readiness and permitted response. Keep event and acting-team context visible. Only show a court/station or exact start time if the product actually records/publishes it. If pairings are not published, say so; never reveal a draft opponent or invent a countdown.

Prefer a readable mobile list/round view with expandable detail over requiring pinch-and-zoom on a wide bracket. Keep identity and outcome understandable without colour. Show what is pending and who can act next. A dispute or delay has an explicit state and recovery/authority path; it must not appear as a frozen or silently successful form.

Competitive atmosphere comes from credible published information and clear change feedback. Show freshness/processing when available and preserve focus/scroll during refresh. Do not claim instant delivery, real-time transport, live court data or an effective result solely because a client animation ran. H2's in-app notices and result effects are distinct from the richer H5 live-following scope.

**Review:** with one hand on a narrow screen, a participant can find the relevant match and next action without opening an admin-style overview. Pending, disputed and effective outcomes remain recognisable after a refresh or reconnect.

## XP-06 Team representation and invitations

Make acting identity explicit: "Acting for [team]" accompanies team entry, roster, lineup and result work. Distinguish a player viewing their own participation, a captain/representative acting for the team and a non-playing manager. A context selector is a presentation aid; current representation and scope are checked on every operation.

Use an invitation flow to reduce coordination where the reviewed team policy supports it. Explain what the invitation grants, who must accept, expiry/revocation and what remains pending. A shared link alone does not claim identity, admit an entrant, accept roster membership or grant staff powers. The source's "magic link / claim an alias" is an aspiration for low friction, not permission to bypass account/acceptance checks. D-34's representation/acceptance details remain proposed.

Show roster readiness with counts and the missing requirement; keep the roster, accepted membership, frozen revision and match lineup distinct. Avoid making the captain re-enter data already held and permitted to reuse, but never silently merge guest identities. Individual participation has no synthetic one-player team or roster.

**Review states:** invitation pending/accepted/expired/revoked, member acceptance, incomplete/full roster, frozen roster, locked lineup, lost representation, duplicate/linkage concerns and a teammate continuing after authority changes. Use the existing H2 scope rather than inventing transferable powers.

## XP-07 Reporting, confirmation and disputes

Use a focused match task with the reporting identity, outcome/version under review and explicit next action. A submission acknowledges a pending report; it does not imply the result is already effective. Numeric score inputs appear only for a delivered result profile that supports them.

The opponent's response must be an explicit decision on the current version. Present confirmation and disagreement without hiding the alternative; collect the required reason for a dispute. Preserve both versions and show the pending independent resolution. An organiser/referee sees operational exceptions in their authorised queue; a participant does not see unrelated disputes or private staff records.

D-36 confirms automatic effects of explicit confirmation/disagreement, not confirmation by silence. D-37's detailed report/referee policy is proposed. Keep immutable pending versions, effective results and correction requests distinguishable under the reviewed policy. Do not introduce chat, attachments, an appeal flow or automatic owner self-resolution.

**Review:** participants know whether they submitted, need to respond or await an independent decision. A stale revision or lost response never turns a pending report into a falsely confirmed score. The organiser can explain who decided what and when without changing history invisibly.

## XP-08 In-app notices and protected history

Use notices to bring the person back to relevant current work, not to replace authoritative state. An inbox is distinct from a short-lived toast: it has unread/read state and a permitted destination. Reading a notice does not confirm a result, accept an invitation or prove the event was communicated to every entrant.

Separate team-operational notices for current representatives from personal participation notices. Recheck authority at the target; revoked/private information must not remain exposed in old notice text. Automatic minimum-field cancellation has confirmed recipients/effects under D-35; D-38's wider inbox/history detail is proposed. Guest-only entries need organiser communication work, not a fictitious "delivered to all" badge. H2 does not add email or push channels.

History should recognise participation without inventing competitive evidence: actual appearance differs from accepted roster membership, being a reserve and a submitted lineup. Show correction/revision and cancelled outcomes honestly. H2 personal/team-wide history is private under the proposed detailed scope; tournament public results do not imply a global public career profile, win-rate directory or badges system.

**Review:** the person can distinguish an outcome toast, an ongoing page blocker and an inbox item; history and notices reveal only permitted information after a team/context/access change.

## XP-09 Bounded automation with organiser confidence

Explain what is automatic, what is waiting for processing and what still needs an organiser decision. D-35 confirms minimum-field cancellation at the registration deadline; D-36 confirms the bounded transition set. Do not extend that into automatic competition start, next-round publication, final publication or confirmation by silence.

Show current registration state alongside announced deadlines/time zone and protection of a manual close. Distinguish waiting-list promotion, admitted-entry minimum and start readiness. An incomplete roster still counts as an admitted team for the deadline minimum; it can separately block play. A full capacity is not required, and pending check-in alone does not trigger minimum-field cancellation.

When an automatic cancellation occurs, state what was cancelled, why, the effect on participation and the relevant in-app communication work. A delayed worker or changed deadline needs visible reconciliation, not a made-up completed transition. Keep any manual intervention's consequences and actor/time evidence available.

**Review:** both organiser and participant can explain the current state without assuming that every planned date triggered successfully. Exceptions are actionable and historical facts are attributable.

## Supplied-document traceability and scope

This table preserves the supplied document's intent while preventing its exploratory examples from becoming unreviewed feature promises. Functional statuses remain in D-30–38; the table is a scope mapping, not a second decision ledger.

| Supplied perspective / aspiration | Guidance coverage | Scope treatment |
| --- | --- | --- |
| Participant: clean competition identity, public information before login | XP-02/03; shared visual foundations | Apply the shared style to the H2 discovery/detail target; directory/visibility detail remains D-32 |
| Participant: lightweight onboarding | XP-04 | D-30 direction confirmed, provider design pending; no promise of a specific single-click sign-in |
| Captain: share a link instead of typing every teammate | XP-06 | H2 team invitation/acceptance target under proposed D-34; alias claim alone is not membership/authority |
| Participant: My next match, time/station/readiness | XP-04/05 | Use published/available data under H2-EN-03; no new scheduling/station feature implied |
| Participant: calendar/ICS integration | Future option | Not specified in current H2 scope; requires a separate product decision, privacy and update/cancellation design |
| Participant: easy check-in and opponent confirmation | XP-04/07 | D-33 details proposed; explicit result effects confirmed in D-36 and detailed policy proposed in D-37 |
| Participant: live atmosphere and immediate updates | XP-05/08/09 | Accurate freshness/processing and in-app work; richer live following is later scope, no instant-delivery guarantee |
| Participant: career passport, public rivalry stats, podiums and badges | XP-08 protects current history semantics | Private own/team history is the H2 target; global public profiles, badges and head-to-head features are not authorised by this guide |
| Participant: signal over noise, no silent changes/disputes | XP-05/07/08 | In-app relevance and explicit unresolved state; email/push, chat and appeals are outside H2 |
| Organiser: credible branded showcase | XP-02/03 and shared public composition | Identity/content consistency; a dedicated organisation portal, custom theme/domain or configurable branding requires separately scoped work |
| Organiser: single-screen situational awareness and exception handling | XP-01/09 | Operational summaries in the full-width stacked composition; do not invent a new dashboard layout or authority |
| Organiser: three-minute wizard, clone last event | XP-01 and usability review below | Ease-of-use goals, not a shipped wizard/clone command or an approved timing promise |
| Organiser: scheduled registration, waiting promotion, minimum safeguards | XP-09 | Confirmed bounded direction D-35/36; preserve manual-close protection and current H1/manual distinction |
| Organiser: two-tap incidents and automatic progress | XP-01/07/09 | Fast access to permitted operations; no new incident policy, knockout engine or automatic publication implied |
| Organiser: competitor CRM and analytics | Future option | Not a general-purpose CRM or cross-organisation people search in H2; needs explicit scope/privacy review |
| Organiser: delegated volunteers and defensible audit | XP-01/06/07 | Proposed scoped staff policy D-37, existing attributable evidence; no finance screens or general organisation-admin role introduced |

## H2 design review and handoff

For each H2 slice, select the relevant XP patterns and the [§9.4 screen/state inventory](../herald-visual-direction.md#94-h2-screenstate-inventory). The inventory remains the maintained list; do not claim that a general discovery concept covers account, team, match and recovery states. No screen or new mockup is produced by this documentation change; actual H2 slices still need their reviewed visual inputs.

Include these questions alongside the style guide's G-/RU- checks:

1. Which archetype/context is active, and what decision are they trying to make?
2. Does the composition expose that task, rather than reproducing the other experience's navigation/density?
3. Which exact entry, team, match/report version and acting identity does the action affect?
4. Can a visitor read public conditions before authentication, and return to their task after it?
5. Does the screen show actual admission/readiness/result state without optimistic promises or draft/private disclosure?
6. What happens under waiting, cancellation, stale data, lost response, revoked access and a changed schedule/deadline?
7. Are a mobile list/summary, keyboard flow, long content and reduced-motion behaviour usable with the shared components?
8. Does every proposed feature map to an authorised capability/decision status, with unsupported source aspirations kept out of production controls?

Use task walkthroughs with synthetic individual entrants, a captain/non-playing representative and an organiser. Observe whether they can find the next action, understand waiting/blocked/pending states and recover without help or lost work. Record completion, errors, unnecessary navigation and time actually measured. "Two taps" and "three minutes" are research aspirations from the source, not acceptance thresholds or performance guarantees until a reviewed usability target defines the task and conditions.

The existing-screen audit covers H1/admin plus the current public shell, home and not-found pages. It cannot establish conformance of H2 flows that do not exist yet. Future H2 reviews must cover both visitor and signed-in participant states, representative context and organiser consequences, not just the public landing page.
