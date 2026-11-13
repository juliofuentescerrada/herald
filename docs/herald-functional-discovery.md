# Herald — Domain Discovery, Functional Specification and Roadmap

Version 0.8 + H4 discovery · 13 November 2026 · Consolidated baseline with linked H2 and H4 extensions

## 1. Purpose and status

Herald is a platform for organising and participating in competitive gaming tournaments. It combines an operational tool for organisers with a public portal where players discover competitions, register, compete and consult their history.

Its secondary purpose is to demonstrate a .NET/Azure reference architecture. Product behaviour should justify technical choices; this functional model does not mandate a particular distribution of modules or services.

**Confirmed with the maintainer:** cover both organiser and player perspectives; support games beyond Magic; deliver in phases; produce functional documentation and a roadmap that complement the repository; expose an API for external applications; account for individual and team competitions in the initial domain definition; make roster and lineup configuration unnecessary for individual 1v1 competitions. Implementation does not start during this discovery stage.

**Decision status:** [ADR 0013](adr/0013-functional-delivery-scope.md) accepts the H1–H7 delivery sequence, including identity, scoped operator authority and direct teams in H1. The explicitly confirmed start/result and public-identity contracts in §§8/12 also remain confirmed. This does not approve every rule default. §15 is the single decision register: it separates confirmed clauses from proposed defaults, assigns an owner and gate, and links acceptance evidence. Unless explicitly marked confirmed, rules in this document remain recommendations for review.

**New in v0.8:** the [H2 functional discovery](herald-h2-functional-discovery.md) defines participant access, self-service, teams, reporting, collaboration, history and bounded automation. D-30–38 record the 13 November 2026 discussion and distinguish explicit maintainer decisions from author-defined defaults. H2 changes scheduled registration behaviour; H1 manual actions and restricted administration remain the implemented baseline. The H2 extension owns H2-specific detail; this document retains shared rules and the single decision register.

**Consolidated in v0.7:** the lifecycle, exception, access and review matrices below make previously missing choices concrete. Rows labelled proposed are new recommendations pending the maintainer's decision, not an assertion of prior approval. The consolidated baseline is ready for decision and visual review; it does not declare H1 ready for implementation. §18 records the outstanding acceptance and visual gates.

Source hierarchy: this [functional baseline](herald-functional-discovery.md) defines behaviour and decision status; the [roadmap](roadmap.md) sequences delivery; [ADR 0013](adr/0013-functional-delivery-scope.md) records accepted scope; [ADR 0004](adr/0004-modular-monolith-with-vertical-slices.md) and [ADR 0006](adr/0006-tactical-ddd-with-domain-events.md) describe proposed technical responsibilities. The [PPT](herald-domain-overview.pptx) and [visual direction](herald-visual-direction.md) illustrate this baseline and must identify proposed or simplified behaviour. Historical review notes remain evidence of the gaps found, not a competing functional specification. Accepted product decisions still require reviewed implementation specifications.

No compatibility with official MTG, chess or other governing rules is claimed. Profiles describe Herald behaviour; official compatibility requires its own requirements and authoritative sources. The 1v1 and 5v5 examples below illustrate participation structures, not complete or current game regulations.

## 2. Vision, users and boundaries

### 2.1 Product outcomes

1. An organiser can run a complete tournament without auxiliary spreadsheets.
2. A player or team representative can distinguish an application, an admitted entry, check-in, roster eligibility and active participation.
3. Everyone knows the next action: wait for admission, complete a roster, check in, submit a lineup, play, confirm a result or address an incident.
4. Spectators can understand progress and results without accessing private data.
5. A significant decision can be explained afterwards: who made it, when, why and what changed.
6. Competition mechanics operate on entrants, whether individuals or teams, without equating a competitive slot with a user account or a single human player.

### 2.2 Actors and responsibilities

| Actor | Goal | Initial authority |
| --- | --- | --- |
| Visitor | Discover tournaments and public results | Public read access without an account |
| Player | Compete and maintain personal history | Own individual registrations; own permitted match actions; team actions only through explicit delegation |
| Team manager or captain | Represent a team | Register the team, manage its tournament roster or lineups within policy, check in and report or confirm on the team's behalf |
| Organising organisation owner | Administer an organising entity | Its members, permissions and tournaments |
| Tournament director | Prepare and run a competition | Configuration, admission, check-in, rounds, results and finalisation |
| Referee or collaborator | Perform delegated duties | Assigned operational permissions, without implicit organisation administration |
| Platform administrator | Operate Herald | Moderation and support; exceptional competitive intervention remains attributable and reasoned |
| External application | Provide an alternative client or execute matches | Explicitly authorised operations, within organisation/tournament and user scope |

A person may play, captain a team and organise tournaments. Permissions have organisation and tournament scope, rather than a single global role. Organising authority and team representation are separate: being a team captain does not confer referee powers; owning an organising organisation does not automatically make someone captain of every team it fields.

A director may compete, but interventions affecting their own entry are identified. A later policy may require an independent referee. Teams do not sign in with shared team accounts: an identifiable person or application acts on their behalf.

### 2.3 Progressive scope

**Core domain from the outset:** two opposing entrants per match; each entrant is either an individual or a team. Direct team play includes structures such as five active players against five active players. On-site and online tournaments, public discovery, private invitations, registration, waiting lists, check-in, rounds, results, standings and history are within the product scope.

**First operational delivery:** an organiser-run round-robin competition supporting individual entries and direct team entries, with fixed tournament rosters, one starting lineup per match and operator-entered aggregate match results. Advanced substitutions and individual submatches are not required for that first delivery.

**Planned expansion:** Swiss, combined stages, richer game profiles, composite team encounters with individual submatches, substitution workflows, game-list submissions, circuits, seasons and game-engine integrations.

**Outside initial milestones:** payments/refunds, monetary prizes, venue booking, permanent matchmaking, social chat, streaming, anti-cheat, full deck legality validation, cross-game global rankings and matches with more than two opposing entrants. Ten people in a 5v5 match are not ten opposing entrants and are not excluded by the two-entrant limit.

## 3. Shared language

| Term | Definition and distinction |
| --- | --- |
| Account | An identity that accesses Herald. Not a competitive slot. |
| Player | An identifiable human competitor, possibly not yet linked to an account. |
| Player profile | Public identity, alias and verified personal history associated with a player. |
| Organising organisation | Entity responsible for hosting tournaments: shop, community, club or promoter. |
| Team | A competitive collective with an identity distinct from its members and organising entities. A persistent team may enter multiple tournaments. |
| Team representative | Person authorised to act for a team, such as a manager or captain. Representation does not require being an active player. |
| Event | Optional grouping of tournaments, such as a weekend with several competitions. Not required to create a tournament. |
| Tournament | Unit of entry and competition with rules, entrants and a final outcome. |
| Registration | Application/admission record for an individual or team entering a tournament. |
| Entrant | Tournament-specific competitive identity occupying one slot, being paired, scoring points and advancing. References an individual or team. |
| Guest entrant | Entrant added by an organiser without requiring its players to have accounts. User actions still require verified identity and authority. |
| Tournament roster | Eligible players registered for a team entry in this tournament, with version and effective dates. Distinct from the team's general membership. |
| Lineup | Players selected from an eligible tournament roster for a specific match or game, according to the profile. |
| Active players per side | Required number of players simultaneously fielded by an entrant. Independent of roster size, substitutes and number of opposing entrants. |
| Game title | Competitive activity, such as Magic, Hearthstone or Overwatch. |
| Game variant | Competitive variant of a title, such as Modern. Avoid unqualified use of “format”. |
| Rules profile | Versioned rules covering participation structure, results, scoring, tiebreakers and compatibility. |
| Competition system | Round-robin, single elimination or Swiss. Independent of individual versus team entry. |
| Stage | Part of a tournament with a competition system and entry/completion rules. |
| Round | Logical group of stage matches. They need not happen simultaneously. |
| Match | Competitive encounter between two entrants, except a bye allocation. May involve 1v1 players or two multi-player teams. |
| Game or map | A played scoring unit within a match, as defined by its profile. A match may be a series of such units. |
| Submatch | Separately resolved encounter within a composite team match, often an individual board or seat. Not synonymous with one player in a shared 5v5 game. |
| Pairing | Assignment of opposing entrants, bracket slots or a bye for a round. |
| Bye | Exemption from playing an opponent. May award points or advancement under the profile, without implying games were actually played. |
| No-show | Absence leading to an administrative decision. Not a bye. |
| Standings | Competitive ordering of entrants within a stage or tournament. |
| Seeding | Initial order used to distribute entrants, not their final ranking. |
| Withdrawal | Voluntary departure of an entrant; previous results remain. A member leaving a team is a separate event. |
| Disqualification | Exclusion by an authority, requiring a reason and a defined result policy. Player and team disqualifications are distinct. |
| Circuit / season | Higher-level competition combining tournaments under its own rules. |

The previous “participant” terminology is made explicit as **entrant** for the competitive unit and **player** for a human member. Specifications and public contracts must preserve that distinction; the exact implementation types remain a design decision.

## 4. Capability map and boundaries to validate

| Functional area | Responsibility | Information needed from other areas |
| --- | --- | --- |
| Identity and organisations | Accounts, profiles, memberships and operational delegations | Entry references for history |
| Teams and representation | Team identity, membership and authorised representatives | Player identities and scoped permissions |
| Catalogue and publication | Public listing, visibility, discovery and announced rules | Slot availability and competition status |
| Registration and eligibility | Entry admission, capacity, waiting lists, tournament rosters and check-in | Tournament configuration and player/team identities |
| Competition operations | Active entrants, stages, pairings, locked lineups, rounds and advancement | Admitted entries and fixed rules profile |
| Results and refereeing | Reports, confirmation, disputes and corrections | Matches, authorised actors and relevant lineup versions |
| Standings | Calculation, explanation, provisional status and publication | Effective results and tiebreaker rules |
| Communication | Operational notices and material changes | Facts from the other areas |
| History and circuits | Personal/team history and cross-tournament results | Identifiable final results, participation evidence and revisions |

These areas are not automatically bounded contexts. Results may belong to Competition and Standings may begin as its projection. Team management does not necessarily require a separate module in H1. The public catalogue does not decide admissions; history does not change results. Tournaments owns configuration, publication, visibility and lifecycle; Registration owns admission (D-08 and ADR 0004).

Scheduling and standings consume entrant identities, not roster members. Roster eligibility and lineup validation remain explicit responsibilities; they must not be silently duplicated in every competition-system algorithm.

## 5. Lifecycles and control points

Publication, registration and competition must not share a single state: a published tournament can have closed registration without having started.

| Dimension | Proposed states | Rule |
| --- | --- | --- |
| Publication | Draft, published, archived | Visibility is separate: public, unlisted or private |
| Registration window | Not open, open, closed | May reopen before the start; does not itself alter entries or pairings |
| Competition | Preparation, running, finalised, cancelled | Finalisation is explicit after validation; temporary suspension is a later extension |
| Round | Draft, published, running, completed | Only published rounds are visible to competitors; published revisions are announced |
| Match | Scheduled, in play, awaiting validation, disputed, resolved, voided | State and resolution reason are separate; the proposed H1 meaning of voided is in §8.1 |
| Entry application | Waiting, admitted, rejected, cancelled | Check-in, roster readiness and competitive withdrawal are separate dimensions |
| Entrant check-in | Pending, confirmed, absent | Profile determines whether it is mandatory |
| Team readiness | Incomplete, eligible, ineligible | Derived from applicable roster and attendance rules, not an extra admission slot |
| Match lineup | Draft, submitted, locked | Changes after locking require a permitted substitution or explicit correction |

**CP-01 Publication:** requires title, organiser, game/variant, dates and time zone, location or online mode, entry capacity, entrant kind, participation structure, initial system and visible rules. Team profiles also specify roster bounds, active players per side, representative powers and lineup requirements. Publishing does not open registration automatically.

**CP-02 Registration closure:** prevents new applications. Closure is allowed with zero or one admitted entrant so the director can cancel or reopen. The minimum of two eligible entrants is enforced when starting. Two five-player teams satisfy this minimum; one team containing ten players does not.

**CP-03 Preparation:** the director reviews attendance and eligibility and resolves exclusions. Closing registration does not freeze the field. Publishing pairings fixes the reviewed field for that publication: before competition start, changing it requires explicitly withdrawing publication, invalidating affected draft pairings and reviewing and republishing them. Competition start permanently freezes the field; subsequent departures are competitive withdrawals. Initial scope does not admit new entrants after the competition starts. Team rosters are frozen at the announced deadline; changing general team membership later does not rewrite tournament rosters.

**CP-04 Start:** requires closed registration, at least two eligible entrants, complete rules and valid initial pairings. It fixes identifiable versions of entrants and rules, plus tournament rosters where applicable. Individual 1v1 entries require no roster freeze or lineup submission: the player is determined by the entry. Team lineups may be submitted later before their match starts, within the roster and profile; no match starts without a valid locked lineup when required. Updating a catalogue profile does not change an ongoing tournament.

**CP-05 Finalisation:** requires completed stages, valid terminal resolutions for every scheduled pairing and no open disputes. The director reviews current provisional final standings before publishing them. The proposed observable revision barrier is in §9.3 (D-24); a stale view is not permission to finalise.

**CP-06 Cancellation:** requires a reason. Before starting, cancels admitted entry reservations and announces the change. After starting, preserves history, marks the competition cancelled and does not automatically declare a winner. Cancellation is not deletion.

### 5.1 H1 transition contract for review

**Status: proposed refinements under D-27**, constrained by the documented separation of publication, registration and competition. **The first row (publish a draft tournament) was confirmed on 10 November 2026**, with no action that returns a published tournament to draft. **Rows 2 and 3 (open or reopen, and close, registration) were confirmed on 11 November 2026** as explicit owner actions that the announced dates neither trigger nor block; their parts about pairings and admission apply when those exist. The other rows remain proposed. The operator is the authorised organisation owner in the H1 baseline; a pilot application may perform only expressly granted actions (D-12/D-21). Competitor invitations and delegated staff remain H2. Every mutation checks current authority and expected revision; a repeat with the same operation identity returns its original outcome, while stale or changed content is rejected without a partial transition.

| Action and prior state | Preconditions | Proposed resulting state and effects | Acceptance |
| --- | --- | --- | --- |
| Publish a draft tournament | CP-01 complete; aliases of entries to be publicly shown reviewed | Publication becomes published; registration remains not open/closed; no entries, pairings or play are created | AT-02 |
| Open or reopen registration during preparation | Valid announced window; any previously published pairings first withdrawn | Registration becomes open; existing applications retain their state; admission follows RI rules | AT-03 |
| Close registration | Preparation; any admitted count, including zero | Registration becomes closed; do not change check-in, freeze the field, generate pairings or start | AT-02 |
| Publish initial pairings | Registration closed; reviewed eligible field and valid draft | Publish an identifiable field/pairing revision; later pre-start field changes require withdrawal of this publication | AT-03 |
| Withdraw initial pairing publication | Competition has not started; reason recorded | Hide the withdrawn revision from current competitor views, retain history and invalidate affected drafts; republish after review | AT-03 |
| Start competition | CP-04; matching current published field/rules; eligible frozen team rosters | Competition becomes running; field and rule versions become fixed; do not implicitly start every match | AT-01/04 |
| Start a match | Running competition; current published pairing; no competitive departure preventing play; valid locked team lineups where applicable | Match becomes in play; round becomes running on its first started match; record actual play separately from lineup lock. Individual start/resolution may be combined as allowed by §8 | AT-04/06 |
| Resolve a pairing | Running competition; published pairing; allowed terminal outcome under §8.1; current revision and authority | Store one effective resolution; round becomes completed when every pairing is terminal, including a round resolved entirely administratively | AT-06 |
| Start a later league-round match | Its own pairing and readiness checks pass | Allow it without completing all earlier rounds; retain known scheduling conflict warnings | AT-01 |
| Finalise | CP-05 and §9.3 review barrier pass | Competition becomes finalised; publish the reviewed standings revision; registration remains closed | AT-07 |
| Reopen finalised competition | Explicit reason; unarchive first if necessary; correction allowed under §9 | Return to running for authorised correction and renewed review; retain previous final revision; do not reopen registration or unfreeze entrants/rosters | AT-07/08 |
| Cancel before start | Reason and current revision | Competition becomes cancelled; registration closes; active waiting/admitted applications become cancelled; withdraw current pairing publication; retain identities and prior audit | AT-09 |
| Cancel after start | Reason and current revision | Preserve effective results and recorded play; unresolved pairings are marked voided due to tournament cancellation without points; retain roster/lineup evidence; no champion or final league ranking is declared | AT-09 |
| Archive/unarchive | Only finalised or cancelled competitions may be archived in the proposed H1 policy | Archive removes the listing from active views without deletion or visibility changes; unarchive restores the published record with its finalised/cancelled competition state | AT-09 |

Cancellation is a distinct competition outcome, not a shortcut to satisfy league finalisation. Reject new competitive writes after cancellation, including delayed API submissions. An uncertain response is reconciled through its receipt before retrying. No transition silently revives a cancelled tournament; a replacement is a new tournament in the proposed H1 policy.

### 5.2 Visibility and changed dates

**Status: proposed defaults under D-27; former G-02/G-03.** Changes preserve actor, reason and the old/new revision. Show their impact before confirmation. Public aliases and private roster/lineup rules in §12 remain confirmed constraints.

| Change | Proposed H1 behaviour | Acceptance |
| --- | --- | --- |
| Public to unlisted | Exclude from discovery when the H2 directory exists; H1 permitted links still work; publish the visibility change record | AT-10 |
| Public/unlisted to private | Immediately require operational authority for new reads; invalidate public delivery/cache entries; deny prior anonymous links and preserve already-issued competitive state | AT-10 |
| Private to public/unlisted | Require a fresh alias/content preview; expose only approved entrant aliases and public results, never contacts, private reasons, rosters or lineups | AT-10 |
| Postpone start before competition starts | Preview start, registration, roster-freeze and check-in deadlines separately; change only explicitly selected future deadlines; maintain valid ordering | AT-11 |
| Postpone after roster freeze or completed check-in | Keep the roster frozen and existing check-in evidence; do not silently extend eligibility. An optional renewed attendance check is an explicit operator review, not roster reopening | AT-11 |
| Change dates after competition starts | Keep actual start, entrant/rule freeze and recorded activity; permit announced changes to future planned match times, not retroactive start/deadline changes | AT-11 |

Making previously public information private prevents subsequent disclosure by Herald; it cannot retract copies already seen. No private payload may remain accessible through public detail, history or a shared cache. Technical invalidation and time-zone conversion belong to the affected implementation specification; a change is not shown as complete before its required privacy effect is effective.

## 6. Functional use cases

### F-01 Organisation and operational staff

A user creates an organising organisation and becomes its owner. They may invite collaborators and delegate direction/refereeing per tournament. Accepting an invitation does not grant access to other organisations.

Rules: at least one owner remains; ownership transfer requires acceptance by the successor; revocation stops future actions but preserves historical authorship. A collaborator cannot grant powers beyond their own. Team representation is separately authorised and may be exercised by a person outside the organising staff.

Acceptance: a director of organisation A cannot edit B's private tournament. A referee without administration cannot alter entry capacity or appoint directors. A captain can act for their team but cannot settle its dispute as an organiser unless separately authorised, in which case that intervention is attributed.

### F-01a H1 access and pilot authority

**Status: D-21 confirmed (9 Nov 2026); D-22 partly confirmed for guests (11 Nov 2026, `h1-entries`); D-12 remains proposed.** H1 sign-in and organisation isolation are accepted scope. Only people the platform operator invites and assigns to Herald's application can sign in; there is no self-service account registration in H1. A signed-in person may create an organisation immediately and becomes its single owner; a person may own several organisations and switch context. The identity is keyed by the credential provider's directory and object identifiers, never by email. The provider authenticates; Herald's own memberships authorise. Recovery uses the provider's verified self-service recovery; when that fails, a recorded support procedure relinks the identity under the rules below. H1 has no collaborator/spectator invitation workflow and no shared team accounts. Private tournament content is readable only by an authorised operator or explicitly scoped pilot application; a guest competitor identity alone grants no access. H2 refines invitations and representation.

| Actor/context | Proposed H1 authority | Explicit limit |
| --- | --- | --- |
| Visitor | Read published public/unlisted alias-only tournament data | No private content, registration mutation, roster or lineup access |
| Signed-in person without organisation membership | Create an organisation; enter its owner context | Cannot gain another organisation's rights through a supplied identifier |
| Organisation owner acting as operator | Configure/run own tournaments, manage guests and team readiness, review/finalise; view their operational records | Revalidate organisation/tournament scope on every direct link and mutation; no implied team authority outside this operator scope |
| Pilot application | Only operations/tournaments expressly authorised by that organisation; identifiable responsible source | A credential or known application is not a global grant; no implicit other-organisation or competitor authority |
| Guest individual/team member | Appear through operator-managed entry and approved public alias | No sign-in, account claim or mutation rights conferred by guest creation |

Pilot provisioning is an explicit recorded procedure: identify the responsible owner/application, select organisation and allowed tournament operations, issue revocable access, demonstrate denied cross-scope access, and record how the owner or platform operator revokes it. Pilot access remains proposed under D-12 and belongs to the API access slice. A general application-management console is H5. Account recovery verifies the existing identity before restoring access; when self-recovery fails, a recorded support process must verify ownership before relinking. It must not merge guests, copy another owner's permissions or bypass the last-owner rule. The credential provider and recovery verification mechanism require the access slice's specification.

Guest player/team records are organisation-scoped in the proposed H1 policy, with stable opaque identifiers and an operator-reviewed publication alias. Flag possible duplicates within the organisation for review; do not search/expose or merge another organisation's records by name/email. Explicit verified account claims and cross-organisation linkage remain H2. A grant revoked while an operation is pending prevents further privileged execution; a completed operation retains its receipt and authorship under the caller's current read authority. Specify this boundary in the API access slice rather than inferring it from possession of a receipt ID.

Acceptance: AT-12/13 and the permission-denied/organisation-context mockups in §18. Failed authorisation never returns the private tournament's title, entrants or roster as an explanation.

### F-02 Prepare, announce and change a tournament

The director sets listing, dates, rules, entry capacity, automatic/manual admission, optional/mandatory check-in and visibility, then previews before publication. Dates include registration opening/closure and planned start; planned time alone does not start competition.

The entry kind is individual or team, with mixed individual/team fields excluded initially. Team configuration separates eligible roster size from active players per side. A roster of seven with five active players is a valid structure only if its profile permits two reserves. Capacity is labelled in entries: “16 teams”, not an ambiguous “16 players”.

Before starting, capacity, schedule and rules can change. Material changes after admission are versioned and announced: system, competitive rules, participation structure, venue and start time. Capacity cannot fall below admitted entries until affected entries are explicitly resolved. Changing individual/team entry kind after admissions requires cancelling or reprocessing those applications explicitly, not converting identities silently. After starting, descriptive corrections remain possible but entrant, roster and scoring changes are governed by explicit procedures.

Public tournaments appear in discovery. Unlisted tournaments can be opened by link but are absent from the directory. Private tournaments require operational authority in the proposed H1 access policy; H2 adds explicitly authorised invitations. Knowing a URL is insufficient. They do not leak through public player or team history.

**Confirmed for the first slice (10 November 2026, `h1-tournament-setup`):** a draft needs only a title (at most 120 characters); every other value is required at publication, except registration opening and closure, which are required when registration opens. Nothing is preselected except the reference time zone, proposed from the browser. Every save rejects inconsistent values: capacity outside 2–256; roster sizes or active players outside 1–50, or active players above the minimum roster, or minimum above maximum; registration opening not before closure; closure after the planned start (equal is allowed); an unknown time zone. Game/variant is free text of at most 80 characters and a venue at most 120. A published tournament stays editable but every save must keep it complete; while no entries exist its entry kind may change, and changing from team to individual drops the team structure. Publishing has no public effect until the public-read slice: visibility is stored only.

**Confirmed for the registration window (11 November 2026, `h1-registration-window`):** the owner opens, closes and reopens the registration of a published tournament with an explicit action; the announced opening and closure are information and the clock neither changes the state nor blocks the action. Opening and reopening require both registration dates; while registration is open every save must keep them. Closing is allowed from open only and changes nothing else. These actions state the revision they were based on, and one already in effect is a repeat. Until entries exist: only the person and time of the last window change are kept, no integration event is published, entry kind and capacity stay editable while registration is open, and neither action asks for confirmation.

Acceptance: publishing without a complete profile fails with an explanation. A later profile edit does not change tournament rules. Cancellation cannot leave a listing appearing open for entry. A team of five players consumes one slot, not five.

### F-03 Discover competitions

Visitors filter by game title, variant, date, on-site/online mode, location, registration status and individual/team entry. Listings show organiser, reference time zone, capacity unit and vacancies, rules, eligibility and update time. Team listings expose roster and active-lineup requirements before application. Public historical results are discoverable.

Displayed availability is informative; only confirmed admission guarantees a slot. Search reveals neither emails nor rejected applications nor private tournaments. Personal recommendations, maps and popularity rankings are not required initially.

Acceptance: searching an unlisted tournament by title does not reveal it, but its link opens the listing. Full tournaments may offer a waiting list without suggesting a vacancy. Team competitions cannot be mistaken for individual sign-up.

### F-04 Register and manage capacity

An authenticated individual or authorised team representative applies, reviews current conditions and receives an explicit status. Automatic admission grants a vacant slot; otherwise the entry waits if enabled. Manual admission leaves a waiting application with reason “admission pending”, distinguished from “capacity full”. Neither reason implies a reserved slot.

Rules RI-01 to RI-07:

- An individual or team has one active application per tournament; repeating it does not duplicate a slot. Player exclusivity across team rosters is validated separately under §10.
- Pending applications and waiting lists do not consume capacity; admitted entries do, one per individual or team.
- Concurrent applications cannot both obtain the last slot.
- Capacity-waiting priority is the time of entering that queue, with a stable secondary order. Departures from policy are recorded.
- With automatic admission, a vacancy promotes the first eligible waiting entry while registration is open. After closure, only the director can promote before starting. Initial promotion grants the slot directly and notifies the individual or team representative.
- With manual admission, the director admits eligible entries within capacity and records exceptions to queue priority.
- Cancellation before starting frees a slot. Reapplying does not retain priority. Rejection requires a private reason; a fresh application requires permission from the director.

Team admission reserves a slot; roster readiness is separately visible. Incomplete rosters are allowed while completing registration if the announced deadline permits them, but cannot start while ineligible. A vacancy promotes one admission-eligible team, not its individual members. Admission eligibility means authority and entry restrictions are satisfied; it does not require a complete roster before its announced deadline. Tournament-start readiness additionally requires an eligible frozen roster and required check-in. Match readiness additionally requires a valid locked lineup. Direct admission and promotion use the same admission eligibility rules. A representative may not register an unrelated team without authority.

Organisers may add guest individuals or teams without forcing every player to create an account. Records need visible names and stable internal identities to flag possible duplicates. People are not merged solely because another person supplied the same name/email. Later account linking is verified and preserves the original entry and roster attribution.

**Confirmed for operator entries (11 November 2026, `h1-entries`):** the organisation's owner enters guest players or guest teams of the organisation while registration is open; a team is a name until rosters exist. One active entry per guest and tournament; a cancelled entry is final and re-entering joins the back of the queue. Admission, waiting reasons, the capacity queue, operator admission and promotion follow D-06 as confirmed; admitting and cancelling remain possible after closure, before the competition starts. Capacity cannot fall below admitted entries, and entry kind and admission cannot change while active entries exist. A capacity or kind mismatch produced by crossed changes is shown and blocks entering and admitting until the owner resolves it. Cancellation asks for confirmation, needs no reason and records who and when; admission with how and any reason. Rejection, check-in, rosters, representatives and self-service are later slices.

Acceptance: with capacity 16 and 16 admitted entries, entry 17 waits; cancelling one promotes exactly one. Sixteen admitted five-player teams consume 16 slots while their rosters account for 80 players. Failed requests never display nonexistent admission.

### F-05 Check-in and entrant readiness

For H2 self-service, [H2-EN-04](herald-h2-functional-discovery.md#h2-en-04-check-in) refines the earlier window recommendation below: no configurable check-in window is included in H2. D-29 retains H1 implementation status.

During a configured window, an individual checks in or a director records attendance. For teams, an authorised representative checks in the entry; member attendance and lineup readiness are separate. A captain's action does not assert that five eligible players are present unless the policy explicitly requires and records this evidence.

With mandatory check-in, only admitted, checked-in and eligible entrants may start. Expiry does not automatically remove entries or promote others: the director reviews absences and explicitly frees slots before starting. No geolocation is required initially. Before competition start, leaving is registration cancellation; after start it is competitive withdrawal. Published pairings must first be withdrawn before a pre-start field change.

Acceptance: an individual who has not completed a required check-in is excluded from initial pairings. A team with only four eligible active players cannot start a match requiring five, despite the captain having checked in. Closing registration does not mark anyone absent. Directors see why each entry is eligible or blocked.

**Confirmed for operator check-in (12 November 2026, `h1-check-in`):** the organisation's owner checks in admitted entries, individual or team, and undoes a check-in, at any time before competition start and whatever the registration state; H1 has no check-in window, configured or announced. An entry's check-in is pending or confirmed; there is no absent state until the start slice's absence review. Waiting entries do not check in, a promoted entry starts pending, and a cancelled entry keeps its check-in as evidence and stops counting. Every confirmation and undo is recorded with who and when under its own revision. Optional and mandatory check-in record the same way; mandatory takes effect with competition start. The check-in policy cannot change while confirmed check-ins exist. A team's check-in is the entry's and asserts nothing about its players (TM-09). Start readiness, the absence review, check-in windows, player attendance and self-service or representative check-in remain later slices (D-29).

### F-06 Prepare and publish pairings

The director generates a draft from the system, eligible entrant IDs and seeding, reviews it and publishes an identifiable revision. Draft regeneration sends no notices and produces no results. Each entrant sees its opposing entrant, round, table/server/channel if assigned and approximate time. Player lineups are attached to the match rather than paired as separate entrants.

An entrant cannot face itself or have two matches in the same round; a bye has exactly one beneficiary; withdrawn entrants do not appear in newly generated rounds. For teams, one shared five-player lineup does not produce five pairings. Manual adjustments must pass the same validation and record actor/reason. No valid solution means an explained failure, never silent relaxation of constraints.

Acceptance: publishing the same revision twice duplicates neither matches nor notices. Players do not see drafts. Four teams produce six round-robin matches, just as four individuals do. Regenerating after activity requires §9 procedures.

### F-07 Report, confirm and resolve a match

The profile selects operator-entered results or competitor reports with opponent confirmation. H1 uses the former; self-service adds the latter. Each match has a single current effective result.

In individual play, the player reports. In team play, only an authorised representative reports or confirms for the entrant; roster membership alone does not confer that right. A permitted substitute may be captain, while an absent former captain cannot act after revocation. A representative cannot confirm their own entry's report on behalf of the opposing entry.

The reporter submits score and game/map detail where supported; Herald derives the outcome and checks profile consistency. Self-service reports remain pending until the opponent confirms or disputes. Silence does not imply confirmation or award a win. An identical counter-report may confirm; a different one opens a dispute and preserves both versions.

A referee resolves a dispute with a reason. An authorised operator/source may enter a directly effective result, explicitly distinguished from opponent confirmation. Players and captains request corrections to effective results rather than editing them in place.

Acceptance: 2–0 is valid for a two-win series profile; 3–0 is not. A tied score cannot finish a profile requiring a winner. A pending report does not advance a bracket. A five-player team's shared victory produces one team match result, not five individual wins. Retrying confirmation does not change points twice.

### F-08 Operate rounds and address incidents

The director sees pending, reported, disputed and resolved matches, withdrawals, assignments and team-readiness blockers. No-show, concession and administrative decision are distinct actions. None automatically fabricates played-game scores.

A round completes when every pairing has a valid terminal resolution, including byes and administrative outcomes. Voiding a match needs system-specific treatment; deleting it is not a completion rule. Timer expiry only alerts: the profile and an authorised action resolve the match. Synchronised timers and game-specific overtime procedures are later extensions.

Swiss waits for the previous round to complete. Round-robin can schedule all rounds initially and allow matches from different rounds according to schedule. Elimination can unlock a match as soon as both slots are determined without waiting for an entire bracket level.

A missing team member does not automatically withdraw the team. The director can wait, approve a valid pre-start lineup change or apply the published no-show/understrength policy. H1 disallows starting under the required active count and uses an operator's explicit resolution if the problem persists.

Acceptance: an unresolved dispute blocks round completion and identifies the match. A no-show keeps its cause rather than appearing as a played game. An ineligible team member blocks the lineup, without changing existing opponent results.

### F-09 Standings, finalisation and history

Standings use effective results, show provisional status and explain points/tiebreakers. Pending reports may appear in details but do not count as effective. An entrant's position can be traced to its relevant results.

Entries inseparable under published criteria share position. Name/ID ordering is presentation, not a competitive tiebreaker. A cut requiring a unique qualifier must have a terminal criterion published before starting, such as an additional decider or supervised recorded draw.

The director reviews and finalises. History keeps tournament, title/variant, date, organiser, entry, matches, position and withdrawal/disqualification where applicable. It does not compare incompatible game points or turn shared positions into exact ones. Cancelled competitions remain distinct.

For a team entry, the rank and match outcome belong to that entrant. Team history and personal participation are separate: a roster member is not assumed to have played every match. Locked lineups identify intended starters; actual-play evidence establishes who appeared. A lock alone grants no appearance, and substitutes not fielded remain registered reserves. A later team rename or member departure does not rewrite those records.

Acceptance: withdrawn entries retain previous results. Authorised correction revises standings/history with revision disclosure. Private-tournament history remains protected. Replacing one team player between eligible matches does not change the team's points or create a new entrant.

### F-10 Operational notifications

**H1 announcement recommendation (D-26, proposed):** record admission changes, published pairings, cancellations, material changes and revised final results in an operator-visible change log with actor, time, reason and revision. Show permitted material changes on the public/unlisted tournament page; a private change log stays private. The organiser communicates changes to guests through their existing contact process. Herald records publication, not proof that every guest received or read it. Input/roster/lineup rejection appears immediately to the acting operator with a specific correction path. This minimum has no participant inbox or email dependency.

**H2 in-app notices:** admission/promotion, cancellation, material changes, roster or lineup rejection, published pairing, requested confirmation, dispute resolution and revised final results. Email is an additional H5 channel. H1/H2 announcement scope must be stated in each affected acceptance scenario; “announce” must not silently introduce H2 delivery.

Each notice identifies tournament/reason, links to current state and avoids visible duplicates for the same fact. Delivery failure does not reverse admission or resolution. The user dashboard remains authoritative. Team notices reach the assigned representatives; player-specific lineup notices follow visibility settings. Promotional preferences are separate from operational notices.

Architecture: ADR 0017 (proposed) delivers these notices through a consumer-only `Notifications` module fed by fact events; each change records its notifiable facts in that ADR's inventory.

## 7. Competition systems and rules profiles

### 7.1 Independent dimensions

| Dimension | Examples | Determines |
| --- | --- | --- |
| Game title and variant | Magic / Modern; a particular video-game mode | Game-specific information and requirements |
| Entrant kind | Individual or team | Who owns the entry, competitive points and advancement |
| Participation structure | One active player per side; five per side; several individual boards | How humans participate in a match |
| Competition system | Round-robin, single elimination, Swiss | Opponents and progression |
| Match resolution | One game, best-of-three, map series, aggregate submatches | How a match winner or draw is determined |
| Scoring | Win 3, draw 1, loss 0 | Standings points |
| Tiebreakers | Head-to-head, game differential, opponents' performance | Separation of equal scores |
| Operational procedure | Check-in, lineup lock, confirmation, refereeing | Authorised execution of competition |

These dimensions do not imply every combination is valid. Elimination cannot accept a terminal draw without a deciding rule. Game-dependent tiebreakers cannot be enabled without the required data. A five-player team profile cannot accept a single-player lineup. Herald initially offers validated, versioned profiles, rather than an arbitrary rule language.

### 7.2 Round-robin league

Initial profile: one meeting per pair of entrants; win 3 points, draw 1, loss 0. Draw-enabled profiles must allow a valid draw outcome; series requiring a winner use a different result profile. The same schedule operates on individuals or teams.

For n entrants there are n(n−1)/2 matches. Four entrants produce six matches in three rounds. Five produce ten in five rounds, with one rest round each. An odd-field rest awards no points and is not a victory. Five players on each team do not multiply this match count.

Initial tiebreaker policy: points, then shared position (1, 1, 3). This deliberately simple but complete profile is sufficient for H1. Additional criteria, head-to-head included, require a new profile before use. A unique champion is not required when final standings are tied.

**Confirmed H1 profile (D-04, 9 Nov 2026):** points are fixed by the profile, not edited per tournament; another scale is another profile. The generic profile allows draws; a no-draw variant is a separate profile (H3). The schedule is a single round-robin generated deterministically by the circle method from a seeding order: admission order by default, or a random draw the operator runs before publishing the pairings, recorded with the draft so the schedule is reproducible. A match from a later round may start when its own checks pass. Standings show played, won, drawn, lost and points; a rest is shown apart and never as a win.

Withdrawal keeps results of encounters already played; future unplayed scheduled matches are administratively awarded to the opponent. If that opponent subsequently withdraws too, the unplayed encounter is explicitly revised to double absence with no points, preserving the earlier administrative award and its reason in history. This revision is part of the withdrawal operation, affects standings once and must pass the dependency checks in §9; otherwise the operation is blocked for incident review. The final outcome must be the same whichever entrant withdraws first. Two withdrawn entrants produce a double absence with no points. This has fairness implications and must be announced. Policies discarding an entrant's entire record remain alternatives, not rules mixed into one tournament. A player leaving a roster does not invoke this withdrawal rule unless the team entry itself withdraws.

### 7.3 Single elimination

A loss eliminates an entrant; each winner advances into exactly one subsequent slot. Bracket size is the next power of two. Empty slots become byes according to an announced seeding procedure. The draw/seeding used is preserved.

Six entrants produce eight bracket slots, two initial byes and five played matches if no other incidents occur. A bye advances an entrant without inventing played games. A terminal draw is forbidden; the profile defines a decider. The final determines winner and runner-up; entrants eliminated at the same stage share position unless an additional placing match or rule was announced. No third-place match exists by default.

Before the bracket is fixed, withdrawal can lead to regeneration. Afterwards the relevant slot is resolved as concession/no-show. No replacement entrant is inserted once running. A single-match tournament has two entrants, one stage and one match, whose outcome follows its profile. Either entrant may be a team.

### 7.4 Swiss

Swiss belongs to the planned product, after the initial milestone. It pairs entrants with similar performance over a fixed number of rounds without automatic elimination. Pairing sees entrant IDs and points, not individual roster members.

The minimum contract includes active entrants, points for outcomes/byes, rounds, score-group priority, no repeat opponents, odd groups and floats, bye eligibility, seeding/tiebreakers and manual review.

Initial direction: minimise score gaps while respecting constraints; do not repeat opponents; assign a bye to the lowest-scoring eligible entrant without a prior bye, with a stable published tie order and only if the remaining field can be paired. A competitive bye awards win points without actually played games. Its statistical treatment is separately defined by profile.

This is not a complete algorithm. Global pairing, floats, administrative-win exclusions, search limits and unsatisfiable cases require their own specification and validated examples before H4. There is no promise of official MTG Swiss. Minimum scenarios include odd groups, withdrawal, previous byes, an impossible final pairing and reproducible reconstruction. Failure is explicit, never a hidden rematch or partially published round.

The [H4 extension](herald-h4-functional-discovery.md#4-swiss-pairing-and-publication) develops a complete candidate policy, exact statistical examples and failure handling for review. Its new defaults remain proposed under D-48–56; neither this summary nor the extension claims implementation or official rules compatibility.

### 7.5 Combined stages

Target example: Swiss followed by a Top 8. Rounds, qualifier count, cut tiebreakers and bracket seeding are fixed before starting. Stage transition uses the previous stage's final standings; points do not carry over by default. A stage cannot begin with unresolved entry slots.

Qualified teams retain their entry identity; stage transition does not reopen roster registration automatically. Any stage-specific roster/substitution exception must be announced before the tournament and preserve version history. Corrections affecting a dependent stage follow §9: a published cut is neither immune to errors nor permission to replace opponents silently.

## 8. Results, standings and game-specific data

**H1 result/start contract (confirmed):** the generic profile accepts winner or draw, plus resolution cause; a numeric score is not required. An authorised operator explicitly starts a match. For individual entries, recording a played result may combine start and resolution in one validated operation. For teams, start requires both eligible locked lineups; a later entered played result must reference that start evidence. Administrative outcomes may resolve an unstarted match without claiming play. A locked lineup records intended starters, not proof of participation: actual appearances require recorded play. A no-show before play credits no appearances, even with locked lineups. Record whether play occurred separately from the resolution cause; a concession may occur before or after play.


A result separates competitive outcome, score/game or map detail, cause—played, concession, absence, bye, referee decision—validating authority, version and effective time. Points derive from the result under fixed rules.

Herald does not simulate game actions or establish a winner from an action log. It can accept a game engine's result through an authorised procedure while preserving source and external reference. Active player count is not a scoring unit: five players winning a shared map do not create five map wins.

| Proposed profile | Participation | Result | Points and ties | Delivery |
| --- | --- | --- | --- | --- |
| Generic individual league | One individual per side | Win, draw or loss | 3/1/0; shared position if tied | H1 |
| Generic direct team league | Two teams; configured active count | One team match outcome | 3/1/0; shared position if tied | H1 |
| Best-of-three duel | One player per side | Two wins; aggregate score and draws if profile permits | No terminal draw in elimination | H3 |
| Team map series | Multiple active players sharing each game/map | Team map score leading to one match outcome | Defined by profile, independent of roster size | Basic aggregate result H1; richer detail H3/H6 |
| Experimental card-game Swiss | One player per side | Games and match outcome | 3/1/0; explicit tiebreakers before H4 | H4 |
| Composite team encounter | Several individual submatches between team entries | Aggregate according to board/seat rules | Team-level points, separate individual detail | H6 |

Different profiles must operate simultaneously. Editing the profile library does not recalculate historical tournaments. Opponent-performance tiebreakers need formulas, rounding, floors, bye and withdrawal treatment; a criterion's name is not a sufficient specification.

Best-of-three must specify whether it means first to two game wins and how drawn games affect the series. A generic two-win profile can accept 2–0 or 2–1; if drawn games are collected, their count is separate and may require additional games. This must not be confused with a fixed three-game aggregate.

A bye has no actually played games, even if a profile assigns a statistical score for tiebreakers. Reporting and APIs must preserve that distinction. Direct team profiles do not require per-player statistics, eliminations or kills to establish the match outcome.

### 8.1 Proposed H1 terminal-outcome matrix

**Status: D-25 proposed defaults**, using D-04's confirmed 3/1/0 profile. The existing confirmed distinction between resolution cause and whether play occurred remains unchanged. Confirmed withdrawal behaviour remains: preserve previously played effective outcomes, and revise an unplayed encounter between two withdrawn entrants to double absence with zero points regardless of withdrawal order. The additional cases below await decision.

| Prior facts and operator action | Proposed terminal resolution | Points under 3/1/0 | Participation and later effect |
| --- | --- | --- | --- |
| Valid play produces a winner or permitted draw | Resolved: played | Winner 3/loser 0; draw 1 each | Credit only recorded actual play; do not credit unused reserves |
| One entrant concedes before play | Resolved: concession before play | Opponent 3; conceding entrant 0 | No appearances; no fabricated score |
| One entrant concedes or competitively withdraws during play | Resolved: concession after play | Opponent 3; departing entrant 0 | Preserve actual-play evidence and the team lineups used; future unplayed encounters follow the withdrawal policy |
| One entrant is absent/understrength and the operator awards the encounter without play | Resolved: single absence | Ready opponent 3; absent entrant 0 | No appearances; this incident alone does not withdraw either entrant |
| Both entrants are absent/understrength without withdrawing | Resolved: double absence | 0 each | No appearances; both remain eligible for later matches if other checks pass |
| Both entrants withdrew before their encounter was played | Resolved: double absence | 0 each | Preserve/revise any earlier administrative award once; no appearances; order-independent confirmed withdrawal rule |
| Encounter cannot be completed for a reason attributable to neither side | Voided: no contest, reason required | 0 each | Preserve any actual play already recorded; no winner. Proposed H1 offers no automatic replay/replacement encounter |
| Correct an already effective resolution, including conversion to no contest | New effective resolved/voided revision under §9 | Recompute once from the new resolution | Keep predecessor, reason and actual-play evidence; never erase play merely because points become zero |
| Tournament cancelled with unresolved encounters | Voided: tournament cancelled | No new awards | Preserve recorded facts; tournament remains cancelled, not a finalised league |

An operator must explicitly choose the outcome/cause and confirm whether play occurred; opening a new-result form must not preselect a winner. A team played outcome requires valid start/lineup evidence under §8. An administrative decision cannot manufacture that evidence. A no-contest decision after play uses the same correction/impact review as other changes; it is not deletion. The permission to record a no contest and the 0/0 treatment are proposals, not existing accepted policy.

**Zero active entrants (proposed D-25):** resolve every remaining pairing through the announced terminal policy. Permit league finalisation only after the normal review barrier; retain historical points/positions and withdrawal/disqualification flags, but declare no active champion. Do not silently cancel or award a champion because a departed entrant has the highest points. Product review must accept or replace this policy before AT-06 becomes executable acceptance.

## 9. Corrections, withdrawals and difficult situations

### 9.1 Corrections with dependencies

1. An operator identifies the result, supplies a reason and proposes a new version.
2. Herald previews impact on points, standings, derived pairings, qualifiers and notices. If participation evidence changes, affected roster/lineup history is included.
3. Without published competitive dependencies, apply the correction, preserve its predecessor and recalculate.
4. If a dependent round is published but has no activity, require explicitly withdrawing that publication and republishing. Unaffected matches are not invalidated without cause.
5. If dependent matches have started or resolved, block ordinary correction. The director must address the incident; a partial edit must not pretend to repair the tournament. A future rollback workflow must define affected matches and an explicit impact review before applying reversals.
6. A finalised tournament requires a reasoned reopening, the same checks and revised finalisation. History discloses the revision.

Initial implementation supports corrections without published dependencies. Other cases are detected and blocked with an explanation. Arbitrary rollback of played brackets is outside the MVP. Retroactively editing general team membership cannot serve as a correction to who actually played.

### 9.2 Incident behaviour

| Incident | Proposed behaviour |
| --- | --- |
| Two requests for the last slot | One admission; the other waits or receives capacity-full rejection |
| Double click on a result report | One report for the same operation identity |
| Opponent does not confirm | Pending until operator action; no automatic victory |
| Conflicting reports | Visible dispute; never two effective results |
| Entry withdraws after pairing | Preserve pairing; resolve pending match under profile; preserve played outcomes; revise future administrative awards under §7.2 when both entrants withdraw |
| Player leaves persistent team, withdraws from tournament participation or is sanctioned | Distinguish these actions under §10.2.1; general membership departure alone does not revoke the frozen tournament eligibility |
| Team disqualified | Reason mandatory; initial policy keeps previous results and treats future matches as absence; other policies require an explicit profile |
| Team has too few active eligible players | Block match start; director applies published readiness/no-show policy |
| General team roster changes | Tournament roster and locked historical lineups remain unchanged |
| Duplicate table assignment in a time slot | Reject or expose conflict before publication; advanced scheduling is not required in H1 |
| Email delivery fails | Competitive state unchanged; in-app notice available |
| Standings still updating | Show pending update; never generate dependent pairings from stale data |
| Competitive profile changed mid-tournament | Reject changes to fixed competitive rules |
| Player requests account deletion | Revoke access and apply identity-retention policy; do not cascade-delete opponents' results |
| Guest player claims history | Verify identity linkage; alias coincidence is insufficient |
| Same player appears in opposing lineups | Reject lineup/start, including when aliases differ but identity is known |

### 9.3 Review barrier and durable correction evidence

**Status: D-24 proposed observable contract, constrained by existing consistency/audit requirements.** The finalisation screen/API exposes (a) the current revision of competitive facts affecting standings, (b) the revision those standings have applied, and (c) the revision the operator reviewed. Finalise only when all three agree and CP-05 still passes. A concurrent result, withdrawal, sanction or correction that changes those facts invalidates the review. Return a conflict/pending-update explanation, keep the competition unfinalised and offer refresh plus review again. The UI must not show success until finalisation succeeds.

This is a functional consistency boundary, not a requirement for one global counter or a particular persistence/messaging mechanism. The responsible operation validates authoritative completion and current permission as well as projection freshness. The public page may lag ordinary changes while disclosing its revision; the operator cannot approve stale final standings. Reopening preserves the previously approved final version and leads to a new reviewed finalisation with revision disclosure.

Every correction preserves the prior/effective result, reason, actor/source, operation identity, time and affected participation evidence. Result, roster and lineup revisions belong to durable tournament history, not only diagnostic logs or transient delivery messages. The owning implementation slice must demonstrate that the effective change and its required evidence cannot partially succeed. This does not imply event sourcing.

**Review states required:** previous/new outcome and cause; recorded-play impact; current/proposed points; affected dependency; stale revision; denied authority; failed save retaining input; uncertain response with receipt lookup; reopened final result. A published competitive dependency remains a blocker in the proposed H1 correction policy. Display the affected match/round and do not offer a partial change that claims to repair it. Acceptance: AT-07/08.

## 10. Teams, lineups, game submissions and circuits

### 10.1 Teams are a core participation structure

Supporting teams is a baseline modelling requirement, not an optional conversion from PlayerId to TeamId in H6. A match initially has two opposing entrants; an entrant may field one player or several. This separates entrant count, active players per side, roster size and result structure.

| Illustrative competition | Tournament entrants | Active lineup | Match resolution |
| --- | --- | --- | --- |
| Hearthstone-style individual duel | Two individual entrants per match | One player each | Individual duel or series |
| Overwatch-style 5v5 | Two team entrants per match | Five players each, with separately configured reserves | One shared team game/map or series |
| Team board competition | Two team entrants per match | Several assigned players each | Separate individual submatches aggregated into a team outcome |

A shared 5v5 game is not five parallel 1v1 games. Direct team play and composite encounters are distinct profiles. A club with several players in an individual tournament does not become a team entrant merely because those players share an affiliation.

The same real-world club may host tournaments and field teams, but its organiser identity, competitive team identity and tournament entry remain distinct. Team identity persists across tournaments; a tournament entrant captures the team as entered in that competition. A team changing name or personnel does not replace its historical entry.

### 10.1.1 Individual 1v1 is the simple path

**Confirmed design requirement:** an individual 1v1 tournament does not ask organisers, players or API consumers to configure, create, submit, freeze or lock a roster or lineup. Registration directly identifies the player represented by the entrant; each match derives its player on either side from its assigned entrant.

- **IP-01 Configuration:** selecting an individual profile implies one active player per side. Do not ask for roster bounds, substitutes, captain, roster deadline or lineup policy. An organiser does not create a one-member team to enter an individual player.
- **IP-02 Workflow:** registration/admission, eligibility and check-in lead directly to competition readiness. No extra roster or lineup steps, states, reminders or missing-lineup blockers apply to an individual entry.
- **IP-03 Derived participation:** any common internal participation view may derive the single player from the entrant. No separately managed roster/lineup lifecycle, independent mutable copy or synthetic team is required. Internal representation is a design choice, not a consumer obligation.
- **IP-04 API:** individual requests identify the player/entrant and omit team-only fields. Neither roster IDs, lineup IDs, singleton arrays, roster revisions nor lineup commands are required for registration, pairing, match start or result submission. For individual-only requests, supplying unsupported team configuration produces a clear validation error rather than silently changing entrant kind.
- **IP-05 History:** derive the individual player's participation from the entry and match activity/outcome, distinguishing actual play from byes and administrative awards. Do not demand lineup evidence to credit an individual match.
- **IP-06 Applicability:** this shortcut is selected by individual entry kind and its profile, not merely by counting players in a game. A team represented by one selected player in a composite 1v1 submatch may still need a team roster and seat assignment. It must not lose team eligibility rules because that submatch has one player on each side.

| Operation | Individual 1v1 | Direct team match |
| --- | --- | --- |
| Tournament setup | Choose individual profile; active count is implicit | Choose team profile; configure required roster/active counts |
| Entry | Identify one player | Identify team and responsible representative |
| Eligibility | Player and entry eligibility | Entry plus eligible tournament roster |
| Match preparation | Players derive from paired entries | Select eligible players and validate the lineup |
| Start | Normal match checks; no lineup command | Lock a valid lineup before play |
| Result | Match/entrant references and outcome; score only when the profile requires it | Same competitive references, with lineup/start evidence for played results where required |

Acceptance: create an individual league, register two players, admit/check in, publish their pairing, start, submit/confirm the result and read history without any roster/lineup field, object identifier, command or screen. Repeat via an independent API client. Existing five-player team readiness checks must still reject a team with only four eligible starters. A composite team's individual board still validates its authorised player assignment.

### 10.2 Roster and lineup rules

The following rules combine confirmed H1 scope/start constraints with proposed defaults. §15 records status per clause; the remaining defaults require a maintainer decision before their H1 slice:

- **TM-01 Entry unit:** one team application creates one entrant and consumes one capacity slot. Team standings, byes, advancement, withdrawal and disqualification operate on that entrant.
- **TM-02 Tournament roster:** the admitted team supplies identifiable players within profile minimum/maximum bounds. Its general membership is not the live source of tournament eligibility. Guest players are supported with stable identity.
- **TM-03 Exclusivity:** a player cannot belong to two active team entries in the same tournament. They may enter unrelated tournaments unless a scheduling/eligibility rule says otherwise. Changing aliases does not bypass exclusivity; ambiguous identity is flagged for review rather than silently merged.
- **TM-04 Authority:** an identifiable authorised captain/manager acts for the entry. A team has at least one responsible contact; a non-playing manager may hold that role. Authority transfers are recorded and do not alter historical authorship.
- **TM-05 Freeze:** a roster is versioned and frozen at the announced deadline, initially no later than tournament start. H1 does not allow new players after freezing. A new team member added elsewhere does not become eligible in this tournament.
- **TM-06 Lineup size:** before match start, submit the required number of distinct eligible players, such as five. Reserves are not active until selected. The selected roster version and player identities are recorded.
- **TM-07 Lock:** the starting lineup locks before a match starts. Different matches may choose different eligible reserves from the frozen roster. H1 does not allow changes within a running match; a correction or administrative decision is required if the recorded lineup is wrong.
- **TM-08 Substitutions:** later profiles may permit changes between games/maps or, if specified, within a game. They require allowed windows, limits, eligibility and effective timestamps. Old lineups are retained, not overwritten. Disconnect/reconnect of the same player is not automatically a substitution.
- **TM-09 Presence:** entrant check-in, player attendance and lineup readiness are distinct. The initial strict profile requires a full eligible lineup to start; understrength play requires a different announced profile.
- **TM-10 Historical attribution:** record roster registration separately from actual lineup participation. Points belong to the team entry. Being an unused reserve does not count as having played all its matches.
- **TM-11 Scheduling:** a player cannot be active on both sides of a match. Known simultaneous conflicting assignments are flagged before start. Full cross-tournament scheduling optimisation is deferred; H1 does not promise it.

**Confirmed for operator rosters (11 November 2026, `h1-team-rosters`):** TM-02, TM-03 and TM-05 as they apply before competition start. The organisation's owner keeps the tournament roster of each active (waiting or admitted) team entry; members are the organisation's guest players, created with the possible-duplicate warning of D-22. A roster below the minimum is allowed and shown as incomplete; adding beyond the maximum is rejected; bounds changed later never trim a roster, which is then shown as incomplete or above the maximum. A player belongs to at most one active team entry of a tournament; a cancelled entry's roster stays as evidence and stops counting; different guests with the same name on two teams are flagged, never merged or blocked. Each roster has a revision and a history of additions and removals with who and when. The freeze happens at competition start, with no separate roster deadline; start, lineups (TM-06/07), authority (TM-04) and D-23 remain later slices.
- **TM-12 Sanctions:** a member sanction and a team sanction have different scope. A player's competitive withdrawal or applicable sanction blocks future selection; persistent-club departure alone follows §10.2.1. Previous team results change only through an explicit authorised decision.

Initial roster lifecycle: a representative submits/updates before the deadline; Herald validates bounds, identities and exclusivity; the director reviews exceptions; the eligible version is frozen. For each match a representative selects a lineup, the system validates it, and start locks the record. Invalid lineups are rejected without silently substituting another player.

For H1 the organiser may perform these actions and register guest teams/players; a persistent self-service team directory is not a prerequisite. Nevertheless API identities must preserve team, entrant, player and roster/lineup distinctions from the first release. H2 introduces representation and self-service management without changing the meaning of existing competitive identifiers.

### 10.2.1 Membership, competitive departure and sanctions

**Status: D-23 proposed clarification**, preserving frozen roster identity and previous participation. H1 uses the operator to record competitive actions; it does not introduce a self-service team directory, transfers or in-match substitutions.

| Event | Proposed effect on eligibility | Lineup and history consequence |
| --- | --- | --- |
| Player leaves/changes the persistent club or team | No automatic effect on eligibility in the frozen tournament roster | Preserve submitted/locked tournament selections and earlier appearances |
| Operator records a player's explicit withdrawal from this tournament's participation | Mark the existing roster player unavailable for future play; do not delete them or add a replacement after freeze | Revalidate future selections; team entry remains admitted/active unless separately withdrawn |
| Operator applies a player sanction | Record scope, reason and effective time; block selection/start within that scope | Keep historical appearances; any result change needs a separate authorised correction |
| Departure/sanction affects a submitted or locked but unstarted lineup | Block start and expose the specific player/count blocker | Operator records a reasoned pre-start lineup revision using only other eligible frozen-roster members; retain the former lock and explicitly lock the replacement revision |
| A sanction/incorrect lineup is discovered after the match starts | Do not silently rewrite the running lineup or substitute a player | Operator uses an explicit incident/result correction; retain actual participants and the previous record |

If fewer than the required count remain eligible, waiting or an explicit absence/concession decision must follow the announced policy; a no contest is reserved for the neutral-cause conditions in §8.1; the system never auto-withdraws the whole team. H1 still rejects adding a new player after freeze. A player's competitive departure cannot be reversed by silently updating general membership. Exceptional reinstatement and richer substitutions are outside this proposed H1 baseline and require a separately reviewed policy.

Acceptance: AT-04/05. The visual review must distinguish “left the club”, “unavailable for this tournament” and “sanctioned”; a generic “remove player” action is insufficient.

### 10.3 Direct versus composite team matches

**Direct team match:** players jointly produce one game/map result for their side. Herald receives the team outcome/score. No invented per-player subresults are required. A series can contain several team games/maps while still yielding one match outcome.

**Composite team match:** the team encounter contains separately identified submatches, often by board or seat. Each has assigned players and its own outcome. The profile defines aggregation, board weights if any, unplayed boards, draws, clinching and when the parent match becomes effective. Parent standings receive the aggregate exactly once.

H6 must define whether remaining submatches continue after the team has clinched, how individual no-shows affect the parent outcome, whether submatch reports require confirmation and how corrections propagate. A caller cannot submit an unrelated parent score that contradicts effective submatch results. Direct and composite profiles cannot be switched during a running tournament.

### 10.4 Team acceptance scenarios required before release

| Scenario | Expected outcome |
| --- | --- |
| Four teams enter a round-robin league | Four entries, six matches; not one entry per roster member |
| Five-player lineup plus two reserves | One eligible roster of seven if permitted; five active players per side |
| Team captain checks in but only four are eligible | Entry check-in may be confirmed; match start is blocked |
| One player registered for two teams in the same tournament | Second conflicting roster assignment rejected or unresolved pending identity review |
| Captain reports; arbitrary teammate confirms for the opponent | Confirmation rejected for lack of authority |
| Reserve selected before the next match | Allowed within frozen roster; entrant ID and points unchanged |
| Player substituted during a running H1 match | Rejected; no overwrite of locked lineup |
| Member leaves the persistent team after the tournament | Past roster and played lineups remain intact |
| Team wins one shared 5v5 map | One team map outcome; no five invented individual victories |
| Composite encounter has three individual submatches | Each contributes under the aggregation profile; parent result affects standings once |

The first nine scenarios constrain H1/H2. The final scenario is an H6 operational acceptance requirement, with the structural distinction established in H0.

### 10.5 Game-list or configuration submissions

A tournament may require a deck, faction, game-unit roster or configuration by a deadline. This is different from the human team roster. Preserve submission version, edit deadline, referee-only access and reveal timing. It is private by default. Legality validation and external catalogues are later capabilities; submission does not certify legality. A team-level submission and per-player submissions need explicit scope.

### 10.6 Circuits and seasons

A circuit includes tournaments and converts final positions into its own points. Specify eligible tournaments, seasons, best N results, ties, minimum participation and revisions. Only finalised published results feed it. Revised tournament results recalculate the circuit with disclosure; circuit points do not modify source results.

Team circuits additionally require continuity rules: points may follow a stable team, a tournament roster or an organisation, and these are not interchangeable. The initial recommendation is stable team identity, subject to a separately agreed continuity policy. Players changing teams do not silently transfer circuit points.

## 11. User experience and minimum screens

| Surface | Essential information/actions | Milestone |
| --- | --- | --- |
| Access and context | Account, organisations, represented teams and permissions | H1 operator; H2 self-service |
| Organiser dashboard | Own tournaments, status and next action | H1 |
| Tournament editor | Listing, profile, entry kind, capacity units, dates, preview | H1 |
| Entries and check-in | Admitted/waiting entries, guests, reasons, eligibility | H1 |
| Team roster and lineup | Roster members/reserves, representative, freeze and match readiness | H1 operator; H2 representatives |
| Operations centre | Rounds, pending matches, disputes, readiness and authorised results | H1 |
| Standings by public link | Effective results, individual/team labels and provisional/final ranking | H1 |
| Directory | Filters and public listing | H2 |
| My competitions | Own and represented-team applications, status and next match | H2 |
| Match detail | Opposing entries, permitted lineup information, location, report/confirm/dispute | H2 |
| Profile/history | Personal participation versus team results, with visibility controls | H2 |
| Bracket | Slots, byes and advancement | H3 |
| Stage editor | Qualification, cut and dependencies | H5 |
| Composite match view | Boards/submatches, assignments and aggregate result | H6 |

Individual 1v1 screens omit roster/lineup settings and navigation entirely; their single-player participation is implicit. Team-only configuration appears only for applicable profiles, and hidden team controls never remain required by form validation. An individual tournament must not display “roster incomplete” or “lineup missing”.

The interface shows the state actually reached and the available action; it does not announce admission or confirmation before it succeeds. Mobile prioritises the next action/current match. Directors can identify blockers without opening every match. Screens state whether counts mean entrants, players, roster members or active lineup members.

## 12. Observable cross-cutting requirements

**H1 public identity baseline (confirmed):** public/unlisted tournament views publish only explicitly selected display aliases for entrants, results and standings. Each guest entry requires an alias reviewed by the operator before that entry first appears publicly, including when added to an already published tournament; contact details and internal identity records never supply a public-name fallback. Rosters and lineups remain private to authorised operational actors and, in H2, permitted representatives. Private tournament data remains protected. Richer public player/team history and identity retention require their separate policy before release.


- **Authorisation:** every operation validates scope, including direct URL/API access. A public link never grants mutation powers. Team actions verify representation, not just roster membership.
- **Auditability:** admission exceptions, profile changes, publications, results, corrections, sanctions, delegations, roster versions and lineup changes preserve actor, time, reason and previous version where relevant.
- **Consistency:** no overcapacity or two effective winners for one match. Dependent operations wait for current results even if public read views refresh later. A team outcome is counted once regardless of active player count.
- **Visible updates:** tables expose current time/revision and synchronisation status. Provisional pilot target: public results reflect changes within five seconds under normal conditions; measure before making a commitment.
- **Privacy:** emails, contact details, private rejection reasons and dispute evidence are not public. The confirmed alias-only/private-roster baseline above applies to H1; richer public identity/history and retention need their separate product policy before release. Do not expose secret game submissions through team APIs.
- **Accessibility:** core flows support keyboard use, states do not rely on colour alone and errors are associated with their fields.
- **Dates:** preserve the tournament time zone and show reference/local conversion where different. Seasonal clock changes must not alter the intended match instant.
- **Recovery:** reloads/retries do not duplicate applications, matches, lineups or results. Confirmed state survives and attempted operations can be reconciled.
- **Initial scale:** validate eight entrants for the first complete flow and 32 for Swiss. Team size multiplies membership/lineup records, not entrant capacity. Include an eight-team, five-active-player scenario in initial validation. Infrastructure-specific concurrency and availability targets remain to be measured.

## 13. Public API and external integrations

### 13.1 Confirmed decision and scope

**Explicit decision by the maintainer:** Herald exposes an API for other applications, including alternative tournament clients and game engines. This is part of the product from the outset, not a possible simulator extension.

F-11 Product API: an independent consumer can organise and follow a tournament without depending on Angular. Public API means documented, authorised access, not anonymous mutation. Herald's web application and external consumers share competitive rules, even if they use different views and credentials.

| Consumer | Identity and access |
| --- | --- |
| Public reader | Only information allowed by visibility; subject to consumption limits |
| Interactive application | Acts for a user with delegated authorisation and that user's permissions |
| Server application | Authorised by an organisation for scoped operations/tournaments |

Requirements API-01 to API-10:

1. Documented, versioned contracts, examples and business errors. Do not expose internal entities, storage schemas or private domain events as public contracts.
2. Authorisation by application, user where relevant, organisation, tournament and operation. Application identity does not replace user authority or team representation.
3. Revocable credentials. A desktop client cannot depend on an embedded shared secret granting global powers. The technical authentication mechanism belongs in an ADR.
4. Retryable mutations accept an operation identity. Same identity/content returns the original receipt; same identity/different content conflicts. Publish the scope and retention period of this guarantee before general availability.
5. Expected revisions prevent overwriting concurrent changes. A conflicted client rereads and decides, rather than blindly resubmitting a stale command. Roster and lineup revisions participate where relevant.
6. Stable identifiers, pagination and documented filters. External references are scoped by application/organisation and do not replace Herald IDs. Contracts distinguish account, player, team, tournament entrant, roster and lineup. Pairings/results reference entrant IDs; fielded players are separately identified. Do not ship a universal playerId meaning “competitive side”.
7. Distinguishable authentication, permission, validation, revision, state-transition, capacity and rate-limit errors. Transport failure never adjudicates a competitive outcome.
8. Queryable receipts/status distinguish received, applied and rejected operations, especially when effects finish after the initial response.
9. Compatibility and version-retirement policy. Active consumers receive an announced transition; consumption limits indicate when to retry. Concrete values are fixed during the pilot.
10. Audit application and responsible user/source. Revocation stops future actions without erasing prior authorship, lineup history or results.

Individual 1v1 API flows require only player/entrant identity and normal match inputs. Team-only roster/lineup payloads and revisions are absent, not mandatory empty arrays or extra setup calls. Responses may expose a derived single-player participation view, but must not require consumers to manage it. Applicability follows entry kind/profile, including team-controlled individual submatches.

Initial public contracts carry an explicit entrant kind and participation profile. Team inputs include scoped representation and roster/lineup information required by the operation. A consumer may only support individual play, but must detect and reject unsupported team profiles explicitly instead of treating a team as a player. These are functional contract requirements, not a mandate for inheritance or a particular JSON shape.

| External capability | First availability |
| --- | --- |
| Create/configure tournament; inspect effective rules and participation structure | H1 |
| Add guest individual/team entries, manage initial rosters and lineups, admit/check in | H1 with operator authority |
| Start, generate/publish round-robin rounds, finalise | H1 |
| Read matches, entries and standings by identifier | H1 |
| Submit results as an authorised operator/source | H1 |
| Discover tournaments; self-register; act for a team; report as competitor | H2 |
| Elimination and single match | H3 |
| Swiss with an agreed external profile | H4 |
| Server subscriptions/webhooks | H5; revision-aware queries from H1 |
| Composite team submatches and richer substitutions | H6 |

When introduced, webhooks carry public integration contracts, not internal domain events. They require identity/version, authenticity verification, retries and duplicate/out-of-order handling. Payloads exclude secret game lists and private evidence. Consumers query the API to reconcile state. Desktop clients can use incremental/revision-aware queries without exposing an inbound Internet server.

Acceptance F-11: an independent client creates a league, registers entries, publishes pairings, submits results and reads final standings without Angular. Repeat a result after losing the response: no duplicate effect. Revocation blocks new actions. Application A cannot read B's private tournament by knowing its ID. Team entry IDs remain stable while permitted lineups change; the client does not send five separate match victories for a 5v5 result.

### 13.2 Integration types

External applications may provide alternative organiser/player interfaces, execute human or simulated matches, or read results. Some may have an existing local tournament domain. Connecting one requires explicit authority over entries, pairings, accepted results and standings; copying results between two systems is insufficient.

### 13.3 F-12 Connected tournaments: proposed boundary

The API is confirmed. The following responsibility split is proposed for review:

| Decision/data | Authority in a connected tournament |
| --- | --- |
| Registration, capacity and competitive entries | Herald |
| Tournament rules and system | Herald, using a profile the consumer declares compatible |
| Tournament roster eligibility and locked lineup identity | Herald; consumer verifies executable game configuration |
| Pairings, advancement and effective standings | Herald |
| Game actions, board/world state, AI and game rules | External application |
| Series execution, game-specific choices and configuration changes | External application initially, within the agreed profile |
| Engine-produced outcome | External application as an identifiable source |
| Acceptance and competitive consequences | Herald according to authority/profile |
| Local persistence of pending execution | External application |
| Confirmed competitive state and operation receipts | Herald |

The initial result contract accepts completed match outcomes. It does not require forwarding the world/board state, every action or configuration choice. Future per-game/submatch tracking requires a contract preventing contradictory partial and final results. A trusted game result source cannot bypass roster or assignment checks merely because it generated a plausible score.

Target flow:

1. A user authorises the client or an organisation authorises a scoped execution application.
2. The consumer creates a connected tournament and registers individual or team entrants with stable external references. Synthetic competitors do not require human accounts or generate public personal history. A synthetic team and its controlled actors, if needed, are explicitly distinguished from real players.
3. Herald returns IDs, effective profile and relevant roster/lineup requirements. The consumer checks executable compatibility before accepting work; unsupported game rules, active-player counts or configurations fail explicitly.
4. Herald publishes matches; the consumer obtains an executable assignment. Before supporting multiple executors, specify assignment/leases and expiry so two instances cannot both treat their execution as current.
5. The consumer executes and persists locally. Only a real outcome or valid concession yields a result. Engine failure, cancellation or exhausted computation budget does not become a draw.
6. It submits match/entrant IDs, execution reference, score, operation identity, expected revision and lineup reference where required. Herald verifies source, assignment, state, entrants and rules.
7. Explicit result authority allows direct acceptance; otherwise the submission is pending. Originating from a known application alone grants no authority.
8. After a lost response, retain the pending submission and query its receipt. An already authorised execution may finish offline and synchronise later, but the client does not generate new connected rounds while disconnected.
9. Herald computes standings and next opponents. Advancement can be requested through its web app or an authorised external client.

An external application's local mode is separate. Automatic merging of local and connected tournaments, importing existing local state, changing authority and offline direction require separate specifications. Connected mode does not run a competing bracket generator as a second authority.

**Profile compatibility:** byes represent no actually played games but may receive a statistical score for particular calculations. Separate those meanings and test formulas. A generic Herald profile is not presumed equivalent to an external system's tiebreakers, lineup rules or local round/size limits.

Acceptance F-12: a test application completes a four-entry league through the API; a real consumer later completes a connected tournament under a shared profile. Duplicate submission counts once; late results for a cancelled tournament are rejected; engine error resolves nothing. Test a direct team result referencing the assigned two entrants and locked lineups. Connected Swiss requires H4; the H1 league proves the contract, not yet every consumer-specific integration.

## 14. Adopted delivery sequence and proposed acceptance detail

### 14.1 Sequencing principles

Each milestone produces demonstrable behaviour through UI/API as applicable. Existing M0 foundations remain necessary but should not indefinitely delay the first complete journey. Identity, authorisation, effective rules and external contracts arrive with the first flow that needs them.

Team-aware identities and direct team support begin in H0/H1. Individual 1v1 remains a direct registration-to-match workflow with implicit single-player participation, as required by IP-01–06. H6 extends team functionality rather than introducing teams for the first time. This is a deliberate change to version 0.2, which postponed too much team modelling and operation.

No dates are assigned without effort/capacity estimates. Main sequence: H0 → H1 → H2 → H3 → H4 → H5. H6/H7 are separately prioritised extensions after the relevant core capabilities. External adapter work can progress alongside H3 after H2; its connected Swiss journey cannot finish before H4.

### H0 — Domain agreement and product contract

**Value:** a reviewable definition before building.

Deliverables: vocabulary/lifecycles, H1/H2 scope, permissions, first individual/direct-team profiles, initial API, roster/lineup invariants, league/admission/result scenarios, integration authority decision, and review of affected ADRs/roadmap.

Exit: the H1 clauses of the §15 decision register have explicit maintainer decisions, and the affected §18 scenarios have unambiguous expected outcomes and reviewed visual states. Scope approval alone does not close a proposed rule. Validate an individual journey, a two-team 5v5 match and the distinction from a composite encounter before fixing public identifiers. No core flow should rely on deciding rules in a handler. H2+ clauses may remain open if they do not compromise the H1 contract; bounded M0 foundations may continue independently.

### H1 — An organiser runs an individual or direct team league through web/API

**Value:** a complete operator-run tournament and a consumable API, without treating every competitor as one human.

Includes minimal F-01—organisation/owner, no advanced delegation—F-02, operator/guest entry in F-04, F-05–09 and F-11. Uses §7.2 round-robin scoring. Supports individual entries and direct team entries with identifiable players, fixed eligible tournament rosters, required active count, pre-start locked lineups and operator-entered aggregate outcomes. Organiser-managed guest teams are enough; persistent self-service team discovery is not required.

Waiting lists/admission are exercised through operator actions; competitor self-service follows in H2. Public read-by-link and private authorised reads are present. Include explicit withdrawal/cancellation and safe corrections. Email is not a start dependency. API offers receipts and revision-aware reads, not necessarily webhooks or language SDKs.

Exit criteria:

- Four entrants produce six matches and explainable final standings; five produce ten with rest rounds awarding no points.
- Complete an individual 1v1 tournament through web and API without roster/lineup configuration, identifiers or commands; no team-only eligibility blocker applies.
- Repeat with four five-player teams: still six matches, one capacity slot per team and team-level standings.
- A permitted roster of seven supports five starters and two reserves; fewer than five eligible active players blocks a five-player match.
- A reserve may appear in a later match under the frozen roster; earlier lineup/history and entrant identity stay intact.
- A full field rejects extra admission or waits; a vacancy follows the promotion policy.
- Another organisation's operator cannot mutate the tournament.
- A correction without published dependencies changes points once and retains audit history.
- An independent API client completes the journey without Angular.
- Lost-response retries duplicate neither applications, roster/lineup submissions nor results.

H1 excludes in-match substitutions, composite submatches and sophisticated persistent-team administration. Their identities and distinctions are already respected.

### H2 — Player portal, team representatives and discovery

The [H2 functional discovery](herald-h2-functional-discovery.md) is the maintained detailed extension for this milestone. D-30–38 record its decisions. It includes open participant accounts with restricted administration, scheduled registration/minimum-field cancellation and the bounded automation set; its target scenarios supplement UJ-04/05 and do not claim implementation.

**Value:** individuals and captains discover, enter and compete without operator mediation at every step.

Includes F-03, complete self-service admission/check-in, team representation and roster/lineup submission, competitor report/confirmation in F-07, protected personal/team history, in-app notifications, referee delegation and private/unlisted flows. New actions are also available through delegated API authority.

Exit: a user discovers an individual tournament, waits, obtains a slot, checks in, reports/confirms/disputes and reads history. A captain completes the equivalent team journey and selects eligible lineups; an arbitrary teammate cannot report or confirm without permission. A different authorised referee resolves a dispute. Private tournaments do not leak through discovery/history. Pending reports never change effective points. Guest account linkage requires verification. Personal history distinguishes registered reserve from fielded player.

This is the first **joint organiser/player portal MVP**, including direct team participation. An operator-only tool does not satisfy the full product vision.

### H3 — Elimination, single match and richer result profiles

**Value:** varied competitive needs consistently available to users and API consumers.

Includes bracket/seeding reproducibility, byes, advancement/final/shared places, single-match tournaments, no-draw and aggregate best-of-three profiles, and game/map result detail where needed. Individual and direct team entrants use the same competition systems. Profile compatibility and correction impact are validated. Prepare the external adapter without yet declaring its Swiss supported.

Exit: six entrants form eight bracket slots with two byes and five played matches absent other incidents; losers never advance. A terminal draw fails when a winner is required. Two tournaments with different profiles run simultaneously without client logic changes. At least one team bracket confirms that lineup size does not affect bracket slots or scoring multiplicity.

### H4 — Swiss and the first real connected external tournament

**Value:** useful card-game support and proof of the API with a real consumer.

Includes complete §7.4 specification, shared tiebreaker formulas, synthetic entrants and authorised result source, stable identity mappings and reconnection/cancellation/concurrent-revision handling. Swiss operates on entries; validate teams as entries even if the first real adapter executes individual games. No local-tournament import or bidirectional offline direction.

Exit criteria:

- Fixtures for eight and 32 entrants complete configured rounds, including odd groups, prior byes and withdrawal.
- No forbidden rematches/byes; unsatisfiable search never publishes a partial round.
- Shared profile standings match fixtures including bye statistics and rounding.
- The external consumer obtains opponents from Herald, executes and supplies outcomes; Herald calculates standings and next rounds.
- Recovery after a lost response neither repeats effects nor requires simulating an already-produced result again.
- Local mode is distinguishable from connected authority; a connected tournament has one competitive authority.

The [H4 discovery](herald-h4-functional-discovery.md) owns detailed target rules, connected recovery and acceptance. D-48–56 in §15 retain their proposed status; delivery sequencing stays in the [roadmap](roadmap.md#h4-discovery-and-delivery-handoff).

### H5 — Combined stages, live following and the API ecosystem

**Value:** tournaments with cuts and consumers that follow change without constant polling.

Includes groups/Swiss followed by elimination, stage seeding, terminal cut tiebreakers, email notices, live views, server subscriptions/webhooks, complete integration documentation and application registration/revocation. Before general third-party access, consumption limits and compatibility commitments have concrete values. Qualifying teams keep entrant identities and roster eligibility across stages unless an announced exception applies.

Exit: a Top 8 is generated from final stage results with unambiguous qualifiers. Corrections with started dependencies are blocked under §9. A consumer receiving duplicated/out-of-order notifications reconciles through API reads. Revocation stops new access/delivery under the contract. Stage transition cannot silently add ineligible team players.

### H6 — Advanced team encounters, substitutions and game submissions

**Value:** extend already-supported teams to composite competitions and richer roster operations.

Refine §10 before implementation. Includes board/seat assignments, individually resolved submatches and aggregate rules; optional substitution windows across maps/games; exceptional roster amendments with validation; game-list submission deadlines, locks and privacy. No universal card catalogue or official legality validation is assumed.

Exit: two teams play multiple assigned submatches; parent outcome follows published aggregation and contributes to standings once. An unapproved substitute is rejected. A permitted substitution preserves who played each game. Correcting a submatch shows parent/standings impact. Clinched/unfinished boards follow explicit rules. Private human rosters or game submissions do not leak through public APIs/history.

### H7 — Circuits and seasons

**Value:** continuity between tournaments for organisers, teams and players.

Refine §10.6. Includes circuit calendar, eligibility, season points, best N results and independent standings. Team continuity/identity rules are explicit; member changes do not silently transfer points between teams.

Exit: three example tournaments feed a season; revising one updates circuit standings without changing others. Ties resolve or remain shared under published rules. Cross-game ranking requires a separate product decision.

### 14.2 Adopted mapping from the former repository roadmap

| Former milestone | Adopted treatment (ADR 0013) |
| --- | --- |
| M0 Foundations | Retain bounded technical enablement; include H1 API/authority and team-aware contracts |
| M1 League | Expand to H1; separate closure, readiness and start; include initial scoring and direct team entrants |
| M2 Knockout and single match | H3 after the complete portal H2; systems operate on entries |
| M3 Live and sign-in | Identity/authority move to H1; competitor/captain self-service to H2; live may wait for H5 |
| M4 Cloud | Technical delivery track; remote pilot needs an accessible environment before all formats are finished |
| M5 Game policies | Minimum profiles in H1, variety in H3, Swiss in H4 |
| M6 Simulated results optional | Separate optional simulation from the required API; H4 validates a real connected consumer |
| No existing equivalent | H2 complete portal; H5 stages/ecosystem; H6 advanced teams; H7 circuits |

### 14.3 Minimum traceability

| Capability | Main rules | Main acceptance | Milestones |
| --- | --- | --- | --- |
| Organisation | F-01 scoped authority | Cross-organisation access rejected | H1/H2 |
| Publication | CP-01, F-02 | Complete profile, participation structure and visibility | H1/H2 |
| Discovery | F-03 | Public discoverable; private protected; entry kind clear | H2 |
| Admission | RI-01–07, TM-01 | Last-slot concurrency; one promotion per vacancy | H1/H2 |
| Readiness/start | CP-02–04, F-05, TM-02–09 | Eligible entrants; full valid lineup before team match start | H1/H2 |
| Pairing | F-06, §7 | No duplicates; system operates on entrants | H1/H3/H4 |
| Results | F-07–08, TM-04 | Dispute, representative authority, retry without duplicate effect | H1/H2 |
| Standings/history | F-09, §8–9, TM-10–12 | Traceable ranks and actual lineup participation | H1–H5 |
| Announcements/notices | F-10, D-26 | H1 visible changes and organiser communication; H2 in-app recipients; H5 email | H1/H2/H5 |
| API | API-01–10, F-11 | Journey without Angular; scoped identities | H1–H5 |
| External integrations | F-12 | Connected tournament with one authority | H4 |
| Individual simplicity | §10.1.1, IP-01–06 | Complete 1v1 journey without roster/lineup setup | H0–H2 |
| Basic teams | §10.1–10.4, TM-01–12 | 1v1 and direct 5v5 without changing entry semantics | H0–H2 |
| Composite teams/substitutions | §10.3–10.4 | Parent aggregation once; versioned fielded players | H6 |
| Game submissions/circuits | §10.5–10.6 | Private lists; revisable season and team continuity | H6/H7 |

## 15. Decision register and development gates

This is the single register for product decisions. **Confirmed** means an explicit prior agreement or accepted ADR covers the stated clause. **Partial** separates that clause from remaining defaults. **Proposed** means the stated recommendation still needs a decision; adding detail in v0.7 does not approve it. The maintainer is the product decision owner for all rows; engineering/design supply feasibility and review evidence. Record the decision and accepted example here or in a linked accepted ADR before the listed implementation gate.

| ID | Confirmed clause or recommendation awaiting decision | Status | Gate and evidence |
| --- | --- | --- | --- |
| D-01 Connected authority | Recommend Herald directs the connected competition and the consumer executes; local mode stays separate | Proposed | H1 public contract must not preclude this; detailed execution agreement before H4, F-12 |
| D-02 External result granularity | Confirmed H1 generic match outcomes need no numeric score (§8); completed-match integration first and later detail remain recommended | Partial | H1 API result contract, AT-14 |
| D-03 Guests/synthetic entrants | Guest operator entries in H1 are accepted scope (ADR 0013); synthetic actors belong to the later connected-consumer specification | Partial | H1 guests under D-22/AT-13; synthetic identities H4 |
| D-04 Initial profile | Confirmed (9 Nov 2026) as §7.2: fixed 3/1/0 per profile, draws allowed in the generic profile, points then shared position, single round-robin by the circle method, admission-order seeding or an operator draw before publication, rounds playable out of order, rests shown apart with no points | Confirmed | H1 scoring/pairing contract, AT-01/06 |
| D-05 Withdrawal/disqualification | Preserve played outcomes; unplayed encounters between two withdrawn entrants become order-independent double absence with zero points. In-play withdrawal, sanctions and other exceptions require D-23/D-25 decisions | Partial | H1 departures/results, AT-05/06 |
| D-06 Admission/promotion | H1 operator admission/waiting-list scope is accepted. Confirmed 11 Nov 2026 for operator entries (`h1-entries`, EN-1 to EN-12): automatic admission while a slot is free, otherwise waiting with "capacity full"; manual admission waits with "admission pending"; the capacity queue by waiting time; operator admission within capacity, with a private reason when it skips the capacity queue; direct automatic promotion only while open with automatic admission (on cancellation, capacity increase and reopening); after closure only the operator admits. Rejection with a private reason and permission to reapply remain recommended | Partial | H1 entries, AT-03 |
| D-07 Corrections | Recommend initially correcting only without published competitive dependencies; detect/block the others; retain predecessor and impact evidence | Proposed | H1 correction, AT-08 |
| D-08 Lifecycle ownership | Tournaments owns configuration/publication/visibility/lifecycle; Registration owns admission; cross-owner operations need explicit responsibility and current facts. Publication needs no coordination while no entries exist; its integration event is defined when Registration consumes it (10 Nov 2026). Confirmed 11 Nov 2026 (`h1-entries`): Tournaments publishes a tournament's entry terms (window, capacity, entry kind, admission) and Registration publishes its field counts, each as a revisioned snapshot the other keeps as a local projection (ADR 0016); crossed changes are reported, never repaired silently | Confirmed ownership; entries coordination confirmed; start/finalisation coordination to specify | H1 publication/start/finalisation designs, AT-03/07 |
| D-09 Public identity/history | Confirmed H1 aliases only, no public roster/lineup/contact/internal identity; private visibility inherited. Richer H2 history and retention policy remain open. H2 protected-history detail is defined under D-38. | Partial | H1 public read, AT-10/13; richer history H2 |
| D-10 Competitor confirmation | H2 no-silence confirmation and automatic confirmation/dispute effects are confirmed under D-36 (13 Nov 2026); D-37 defines detailed representative/referee policies for review. | Partial; see D-36/37 | H2 reporting/disputes, UJ-04/05 |
| D-11 External compatibility | Agree formulas, byes, draws and participation rules with the real consumer | Proposed | H4 profile/adapter |
| D-12 Pilot result-source authority | Recommend explicit revocable organisation/tournament/operation grant and recorded responsible source; minimal provisioning procedure in F-01a | Proposed | H1 API writes, AT-12/14 |
| D-13 Distributed execution | Recommend one executor initially; define assignment/expiry before multiple executors | Proposed | H4 integration |
| D-14 Ecosystem opening | Recommend controlled pilot consumers first; general application management and compatibility commitments later | Proposed | H1 pilot procedure; H5 ecosystem |
| D-15 Competitive identity contract | Preserve the documented entrant/player/account/team distinctions; final public identifier/contract shapes require review | Proposed contract detail | H1 API, AT-01/04/14 |
| D-16 Initial delivery scope | ADR 0013 accepts H1 identity and operator-run individual/direct-team leagues through web/API; H2 participant/representative portal; H6 composite encounters and richer substitutions | Confirmed | Delivery reference; does not approve all defaults below |
| D-17 Roster freeze/exclusivity | Recommend frozen roster no later than start, no new players after freeze, one active team entry per player/tournament. Confirmed 11 Nov 2026 (`h1-team-rosters`): rosters of active team entries hold guest players, editable until start with no separate deadline, incomplete allowed and shown, exclusivity by guest identity among active entries with same-name members flagged, revisioned history; the freeze itself is set by the start slice | Partial: roster rules confirmed; freeze at start to implement | H1 roster, AT-04/05/11 |
| D-18 Team start/representation | Valid locked lineups before team played start are confirmed (§8); representative powers and understrength incident policy remain recommended. D-34 defines H2 representative powers and lineup submission defaults. | Partial | H1 start under D-23/D-25; self-service representation H2 |
| D-19 Substitution windows | H1 scope excludes in-match substitutions; richer game/map changes need explicit profiles | Confirmed exclusion; later policy proposed | H6 |
| D-20 Circuit continuity | Recommend separating stable team, roster and organiser; decide which identity owns season points | Proposed | H7 |
| D-21 H1 onboarding/private access | Confirmed (9 Nov 2026) as F-01a: sign-in only for people the platform operator assigns to Herald's application, signed-in owner creation, one owner per organisation, identity keyed by the provider's directory and object identifiers, Herald-owned authorisation, provider recovery plus a recorded support relink, owner-only private reads; pilot access stays with D-12; invitations remain H2 (former G-01) D-30 preserves restricted administration while opening participant accounts; D-32 defines H2 invitations. | Confirmed | H1 access, AT-12; H2 invitation expiry/rights separately |
| D-22 Guest identity scope | Confirmed 11 Nov 2026 (`h1-entries`): organisation-scoped guest players and teams with opaque identifiers, reusable across the organisation's tournaments; the name is the alias, reviewed when typed; a possible duplicate (same kind and name ignoring case, accents and spaces) is reported, never merged; no contact details and no cross-organisation comparison or disclosure. Guest editing and alias changes, and verified claims (H2), remain open. D-31 defines no coincidence checks on participant entry and verified later claims. | Partial | H1 guests, AT-13; verified claims H2 |
| D-23 Frozen-roster eligibility | Recommend no effect from persistent-club departure alone; explicit competitive withdrawal/sanction affects future readiness with retained evidence | New proposal, §10.2.1 | H1 roster/lineup, AT-05 |
| D-24 Finalisation review barrier | Recommend current competitive-facts revision = applied standings revision = operator-reviewed revision, with rejection/review again on change (former G-05) | New proposal, §9.3 | H1 finalisation, AT-07 |
| D-25 Terminal outcomes | Recommend the §8.1 table: in-play concession, 0/0 double absence/no contest, preserved actual-play evidence and no active champion when all entrants depart (extends former G-06) | New proposal except confirmed D-05 clause | H1 outcomes/finalisation, AT-06/09 |
| D-26 H1 announcements | Recommend visible revisioned changes plus organiser-managed guest communication; no receipt/read claim; in-app inbox remains H2 | New proposal, F-10 | H1 publication/cancellation and pilot, AT-09/11 |
| D-27 Lifecycle/visibility/deadlines | Recommend §§5.1–5.2 transition table, terminal-only archival, effective private-read invalidation and explicit future deadline changes without roster unfreeze (former G-02/G-03). Confirmed 10 Nov 2026: the first §5.1 row (publish a draft; registration stays not open; no unpublish). Confirmed 11 Nov 2026: rows 2 and 3 (open, close and reopen registration by explicit action, not by the clock). Directed 12 Nov 2026: deleting a draft tournament, which no §5.1 row covers, is delivered with the archive change; its rules are proposed there. D-35/36 add scheduled registration and minimum-field cancellation in H2; the H1 manual-window decision remains unchanged for H1. | Partial | Relevant H1 editor/operations slice, AT-02/03/09/10/11 |
| D-28 Individual sign-up to team tournaments | Nice to have raised 11 Nov 2026 (e.g. padel pairs): in a team tournament, players without a team join a per-tournament pool that consumes no capacity; after closing registration and before publishing pairings, the operator forms teams from the pool (random draft, reviewed and confirmed, actor and time recorded), which become ordinary team entries with rosters under D-06/D-17, so competition and standings are unaffected. To decide: leftover players, a player leaving a formed team before start, aliases of formed teams (D-09), balanced versus random forming and representation (D-18). Value depends on self-service sign-up | Proposed | After H2 self-service registration; not part of H1 |
| D-29 Check-in | Confirmed 12 Nov 2026 (`h1-check-in`): operator check-in of admitted entries with undo and revisioned history, no window in H1, pending/confirmed only, policy locked while confirmed check-ins exist; see F-05. The absence review, start readiness and windows are set by later slices. D-33 defines H2 pre-start self-service check-in without a configurable window. | Partial: operator check-in confirmed; start effect to implement | H1 check-in and start, AT-01/04 |

| D-30 Participant/admin boundary | Confirmed 13 Nov 2026 in the H2 discovery discussion (`h2-functional-discovery`): anyone may register as a participant; this grants no administrator access, organisation membership or organisation creation. Existing administrator eligibility remains restricted. [H2 §3/8](herald-h2-functional-discovery.md#3-participant-identity-invitations-and-private-access) | Confirmed direction; provider design pending | H2 identity; H2-AT-01/23 |
| D-31 Guest coincidence/linkage | Confirmed 13 Nov 2026: do not control possible guest coincidences at participant onboarding/application; resolve them when identified. Owner-verified later linkage preserving entrants/history and explicit conflict resolution are author-defined defaults. [H2-ID-02](herald-h2-functional-discovery.md#h2-id-02-guests-and-later-verified-linkage) | Partial | H2 identity/linkage; H2-AT-02/24 |
| D-32 Discovery/private invitations | Author-defined 13 Nov 2026 under delegated H2 definition: anonymous public browsing, unlisted by link, private access by explicit grant; proposed seven-day single-use invitation with acceptance separate from admission and administrator eligibility. [H2 §3/4](herald-h2-functional-discovery.md#3-participant-identity-invitations-and-private-access) | Proposed defaults for review | H2 invitations/discovery; H2-AT-03/11/23 |
| D-33 Participant admission/check-in | Author-defined 13 Nov 2026: H1 capacity/queue rules exposed through self-service; post-close exceptions remain operator actions; cancellation/withdrawal kept separate; pre-start check-in with undo and no configurable H2 window. [H2 §4](herald-h2-functional-discovery.md#4-discovery-admission-and-self-service-readiness) | Proposed defaults for review | H2 own entries/readiness; H2-AT-04/05 |
| D-34 Persistent teams/representation | Author-defined 13 Nov 2026: responsible person, captains and ordinary members; explicit accepted representation; registered roster inclusion requires acceptance; guests allowed; valid lineup submission locks its version; no in-match substitutions. [H2 §6](herald-h2-functional-discovery.md#6-persistent-teams-tournament-rosters-and-lineups) | Proposed defaults for review | H2 teams; H2-AT-06–08/22 |
| D-35 Minimum-field cancellation | Confirmed 13 Nov 2026 after explicit request and agreement to include automation: at closing deadline, close registration and cancel automatically below the announced minimum admitted field (at least two, team = one), notifying organiser and admitted/waiting account recipients. Capacity need not be full; check-in is a separate start gate. [H2 §5.1/5.3](herald-h2-functional-discovery.md#5-lifecycle-and-bounded-automatic-transitions) | Confirmed direction; coordination design pending | H2 scheduling/notices; H2-AT-13–15/19/25 |
| D-36 Bounded automation | Confirmed 13 Nov 2026: automatic opening/closing, waiting promotion, invitation expiry, roster freeze, effective confirmed result, dispute opening and terminal round completion; no manual-close override, silence confirmation or automatic start/final publication; revision-aware retries and notices. Reminder timing, minimum-edit/start safeguards and late-worker policy are author-defined refinements. [H2 §5](herald-h2-functional-discovery.md#5-lifecycle-and-bounded-automatic-transitions) | Partial: automation set confirmed; refinements for review | H2 affected slices; H2-AT-07/09–21 |
| D-37 Reports/scoped referees | Author-defined 13 Nov 2026: freeze reporting mode at start; immutable pending reports, matching counter-report confirms, different report disputes; reasoned independent resolution, no attachments/appeals; delegation never opens administrator eligibility. Confirmed automatic confirmation/dispute effects remain D-36. [H2 §7/8](herald-h2-functional-discovery.md#7-reports-confirmation-disputes-and-corrections) | Proposed detailed policy; D-36 effects confirmed | H2 reports/staff; H2-AT-09/10/23 |
| D-38 Notices/history/API | Author-defined 13 Nov 2026: in-app notices, private personal/represented-team history, actual appearances distinct from rosters, current visibility on reads and delegated API parity; no email or global public profile history in H2. Cancellation delivery is confirmed by D-35. [H2 §9/10](herald-h2-functional-discovery.md#9-notices-standings-and-protected-history) | Proposed detail; D-35 delivery confirmed | H2 inbox/history/API; H2-AT-20/22/25 |

D-39–47 are reserved for the unmerged [H3 discovery PR #56](https://github.com/juliofuentescerrada/herald/pull/56); reservation is neither incorporation nor confirmation of those proposals. The following H4 rows use the next available range. Existing D-01/03/11/12/13/15 retain their statuses and refer to the detailed H4 recommendations, not new approvals.

| ID | Confirmed clause or recommendation awaiting decision | Status | Gate and evidence |
| --- | --- | --- | --- |
| D-48 Swiss pairing | Proposed 13 Nov 2026 (`h4-functional-discovery`): fixed rounds, deterministic global gap-vector matching, no repeats/second competitive bye, feasible lowest-score bye candidate; exclude unplayed administrative-win recipients from bye eligibility. [H4 §3–4](herald-h4-functional-discovery.md#4-swiss-pairing-and-publication) | Proposed defaults for review | Maintainer; complete policy/examples before pairing implementation; H4-AT-01–08 |
| D-49 Swiss scoring/tiebreakers | Recommend versioned 3/1/0 and exact rational opponent match-win percentage with 1/3 floor, no bye denominator, administrative matches included, shared positions. No game-statistic or official-rule compatibility inferred. [H4 §5](herald-h4-functional-discovery.md#5-points-tiebreakers-and-ranking) | Proposed; shared consumer formulae unresolved | Maintainer with standings/consumer owners; independently agreed fixtures before profile/adapter implementation; H4-AT-09 |
| D-50 Swiss incidents/closure | Preserve prior play; resolve current published encounter, omit inactive entrants from later rounds; order-independent double absence; no automatic R reduction or final bye champion. Exceptional incomplete closure and positions need agreement. [H4 §6.1](herald-h4-functional-discovery.md#h4-ex-01-departures-and-unsatisfiable-rounds) | Proposed; exceptional closure unresolved | Maintainer; before complete Swiss operations/closure; H4-AT-07/22–24 |
| D-51 Connected agreement | Develop D-01/11: Herald directs, identified consumer executes; fixed connected/local mode and exact version/participation compatibility before assignment. Real consumer remains to be selected/validated. [H4 §7](herald-h4-functional-discovery.md#7-connected-authority-identity-and-compatibility) | Proposed; no authority-policy approval | Maintainer with consumer owner; responsibility/profile agreement before real integration; H4-AT-14/15 |
| D-52 External/synthetic identity | Develop D-03/15: application/organisation/kind-scoped stable mappings, explicit synthetic classification, no fabricated human accounts/history; synthetic-team execution/readiness detail remains a gate. [H4-ID-01](herald-h4-functional-discovery.md#h4-id-01-stable-external-references-and-synthetic-entries) | Proposed H4 detail; existing H1 guest status unchanged | Maintainer with identity/consumer owners; before connected field writes; H4-AT-12/13/16/17 |
| D-53 Assignment/result authority | Develop D-12/13: one execution application, one fenced current attempt/match with exclusive durable consumer execution claim, explicit replacement without automatic expiry initially, terminal payload immutable; direct effect requires explicit result-source grant. [H4 §8](herald-h4-functional-discovery.md#8-execution-lifecycle-reattempts-and-cancellation) | Proposed; grant/authentication design pending | Maintainer with integration/security owners; before executable assignments; H4-AT-18–22 |
| D-54 Swiss correction barriers | Develop D-07/08/24: prior results feed every later Swiss round; block ordinary corrections after dependent publication, invalidate drafts and verify authoritative revisions at publication/finalisation. [H4-CR-01](herald-h4-functional-discovery.md#h4-cr-01-current-state-impact-and-recovery) | Proposed H4 detail; inherited gates retained | Maintainer with module owners; before correction/publication coordination; H4-AT-10/11/27 |
| D-55 Recovery/privacy/retention | Recover lost responses by receipt/current attempt without repeated simulation; current access and protected mappings; target notices under ADR 0017; recommend receipts through archive, with minimum recovery window and purge/rate limits to agree. [H4 §8–9](herald-h4-functional-discovery.md#9-api-notices-privacy-and-durable-history) | Proposed; concrete retention/limits unresolved | Maintainer with API/privacy/operations owners; before pilot availability; H4-AT-18/19/25/26/28 |
| D-56 H4 operational evidence | Validate eight-/32-entry runs, real consumer and team invariants; agree supported maximum, deterministic search budget and accessible review/recovery evidence. [H4 §11–13](herald-h4-functional-discovery.md#11-observable-acceptance-scenarios) | Proposed; limits unresolved | Maintainer with engineering/design/consumer owners; before operational readiness claims; H4-AT-01–07/12/14 |

The former G-01–06 list is consolidated into D-21/22/24/25/27; it is not a second approval queue. H1 decisions must be closed for each affected slice. Later recommendations need not be resolved to continue unrelated foundations.

Deferred questions that do not block the stated H1 pilot: payments, prizes, minors, official governing-rule compatibility, bidirectional offline authority, rollback of played brackets, complex penalties, higher-than-pilot scale, detailed dispute-evidence access, transfers after roster freeze, cross-tournament scheduling and detailed player statistics. If the pilot introduces any of these conditions, its specification is no longer deferrable. H1 must still protect the private operational evidence it already holds.

## 16. Documentation and implementation handoff

This file is functional baseline v0.8 with the H4 discovery extension. Shared rules, initial journeys and the single decision register remain here. The linked [H2 extension](herald-h2-functional-discovery.md) and [H4 extension](herald-h4-functional-discovery.md) own detailed milestone rules and target journeys; they are part of this baseline, not independent decision or implementation-status trees. The roadmap records delivery order, ADRs record significant decisions, and each OpenSpec change takes a vertical slice with executable acceptance scenarios. Product agreement is not approval to implement an unspecified change.

The functional sequence H1–H7 is the product delivery reference (ADR 0013). M0 foundations and M4 cloud remain technical tracks. Proposed clauses in §15 require review before their affected implementation slice. Each OpenSpec design names the owner of the operation, its authoritative preconditions, current organisation/permission context, required durable history and the observable provisional/effective result. Cross-module coordination details stay in the technical design; they must satisfy these functional conditions rather than change them silently.

## 17. Initial user journeys

Proposal for product review, not implementation approval.

These journeys turn the rules above into user goals, touchpoints and observable outcomes. H1–H7 define product delivery; M0 and M4 retain their technical meaning. H1 includes individual/direct-team operation, identity and organisation isolation; competitor reporting/confirmation belongs to H2. The engineering roadmap follows this sequence (ADR 0013).

### 17.1 Journey map

| ID | Actor and goal | Functional delivery | Main touchpoints |
| --- | --- | --- | --- |
| UJ-01 | Organiser establishes the right organisation context | H1 owner; H2 collaboration | Organisation setup, context selector, access |
| UJ-02 | Director runs an individual league end to end | H1 | Dashboard, editor, entries, rounds, standings |
| UJ-03 | Director runs a direct team league | H1 operator; H2 representative actions | Entries, tournament roster, match lineup, rounds |
| UJ-04 | Individual discovers, enters and competes | H2 | Directory, detail, own entry, current match, history |
| UJ-05 | Captain enters and represents a team | H2 | Tournament detail, team entry, roster, lineup, match |
| UJ-06 | Referee resolves an incident or corrects a result | H1 operator; H2 delegated referee/disputes | Operations queue, match detail, impact review |
| UJ-07 | Spectator follows a tournament | H1 read by link; H2 discovery | Public detail, rounds, standings |
| UJ-08 | External operator completes a league without Angular | H1 API | API documentation, receipts, revision-aware queries |

### UJ-01 — Establish organisation context and delegate continuity

**Goal:** organise on behalf of the correct entity and let an authorised colleague continue the work. **Trigger:** the user chooses to organise or opens an invitation. **Precondition:** an identifiable account; operational authority is scoped, never inferred from a global “admin” role. Sources: F-01, §2.2.

| Step | User action | Herald response and next action | Delivery |
| --- | --- | --- | --- |
| 1 | Open organising access | Show existing organisation memberships; a user without membership sees the proposed creation path. Pending invitations appear only in H2 | H1/H2 |
| 2 | Create an organisation, or accept an invitation | Creation makes the creator owner; acceptance grants only the invitation's stated scope | H1 creation; H2 invitation |
| 3 | Select the organisation | Show its identity and accessible tournaments persistently in the admin shell | H1 |
| 4 | Owner delegates tournament duties | Show who can direct/referee which tournaments; do not imply organisation administration | H2 |
| 5 | Collaborator opens an assigned tournament | Show current operational state and permitted next actions so work can continue without the owner's presence | H2 |
| 6 | Switch to another organisation | Replace the accessible context; revalidate authority on every action and direct link | H1 |

**Success:** in H1, the owner operates their organisation's tournaments and another organisation's operator cannot mutate them (an H1 exit criterion). In H2, two authorised colleagues can operate the same tournament independently, and a user can act for different organisations without combining their permissions. **Recovery:** an expired/revoked invitation grants nothing; revoked access blocks subsequent writes and preserves past authorship. Removing the last owner is blocked; a successor must accept ownership transfer.

**Decided:** D-21 is confirmed (F-01a): assigned-only sign-in, immediate single-owner creation, provider recovery with a recorded support relink and owner-only private reads in H1; pilot clients follow D-12. Invitation expiry and detailed collaboration roles remain H2; no separate organiser administrator is assumed.

### UJ-02 — Run an individual round-robin league

**Goal:** complete a small competition without a spreadsheet. **Trigger:** director creates a tournament. **Precondition:** organisation context and operational authority. Sources: CP-01–06, F-02, F-04–09, §7.2, IP-01–06.

| Step | User action | Herald response and next action |
| --- | --- | --- |
| 1 | Create a draft from the dashboard | Ask for listing, individual profile, dates/time zone, visibility, capacity, admission and check-in policy; omit all roster/lineup controls |
| 2 | Preview rules and publish | Validate completeness; show publication, registration and competition states separately; publication alone does not open registration |
| 3 | Open registration and add guest players | Show actual admitted/waiting status and occupied individual slots; flag possible duplicates without merging identities |
| 4 | Close registration and review attendance | Show admitted, eligible and checked-in facts separately; closure neither starts play nor marks absences |
| 5 | Resolve exclusions and prepare the field | Explain every blocker; require at least two eligible entries and mandatory check-in where configured |
| 6 | Generate/review draft pairings, then publish and start | Keep drafts private; validate the start conditions and freeze the rules and field; publication and start remain explicit actions |
| 7 | Record each match outcome | Validate against the profile; show directly effective operator results and standings update status |
| 8 | Review standings and finalise | Block unresolved matches/disputes; publish final positions, including shared positions under the initial profile |

**Success examples:** four individual entrants produce six matches over three rounds; 3/1/0 points can be traced to effective results. Five entrants produce ten matches over five rounds, with one rest round per entrant awarding no points. The whole journey contains no roster/lineup command, identifier or screen.

**Recovery:** incomplete publication preserves draft input; fewer than two eligible entrants blocks start but permits reopening/cancellation; a lost result response is reconciled before retrying. Round-robin scheduling does not force all matches of one round to finish before any later scheduled match. Withdrawal preserves previous outcomes and resolves future matches under the announced policy. Cancellation records a reason and never silently declares a winner.

### UJ-03 — Run a direct team league

**Goal:** operate a league whose competitive sides are teams. **Trigger/precondition:** as UJ-02, using a direct team profile. This is a variation of UJ-02; publication, pairings, aggregate results and finalisation stay the same. Sources: TM-01–12, §10.1–10.4.

| Moment | Team-specific action and response |
| --- | --- |
| Configuration | Specify teams as capacity units, roster bounds, required active count, freeze deadline and representative powers |
| Entry | Add a team and responsible representative; one admitted team occupies one slot regardless of player count |
| Readiness | Record identifiable eligible players; review exclusivity and incomplete rosters; distinguish team check-in from player/lineup readiness |
| Before competition start | Freeze an eligible tournament roster by the deadline; later general team changes do not alter it |
| Before each match | Select the required distinct eligible starters and lock their lineup before play; show the blocker if fewer than the required count are eligible |
| Later matches | Allow another valid selection from the frozen roster; retain earlier locked participation evidence |
| Outcome/history | Record one aggregate team outcome; attribute actual appearances separately from registered reserve status |

**Success example:** four teams each fielding five players still produce six matches. A permitted seven-person roster fields five starters; its two unused reserves are not recorded as having played. **Recovery:** four eligible starters block a five-player match even after team check-in; the operator resolves the incident under the announced policy. H1 rejects adding players after roster freeze or replacing a locked lineup during play. This journey creates no individual submatches; composite encounters remain H6.

### UJ-04 — Discover, enter and compete as an individual

**Goal:** always understand whether a place is secured and what to do next. **Trigger:** visitor opens the directory or a tournament link. **Precondition:** public/unlisted visibility or explicit H2 private access; sign-in before self-service mutation. Sources: F-03–05, F-07, F-09–10.

| Step | User action | Herald response and next action |
| --- | --- | --- |
| 1 | Filter competitions and open details | Show organiser, reference time zone, location, individual entry, rules and real registration availability |
| 2 | Sign in and apply | Return admitted, waiting for capacity or waiting for approval; displayed vacancies alone never promise admission |
| 3 | Return to own entry | Show current status and promotion/material-change notices; after promotion, show the secured slot |
| 4 | Check in within the window if required | Confirm only after success; show readiness or a specific blocker |
| 5 | Open a published match | Show opponent, assignment/time and permitted action; never reveal draft pairings |
| 6 | Report or respond to an opponent report | Keep reports pending until confirmation or authorised resolution; allow confirmation or dispute, never self-confirmation for the opponent |
| 7 | Review the effective result and final history | Distinguish provisional/final standings and actual play from administrative outcomes |

**Success:** the player completes the journey without organiser intervention except approval/incidents required by policy, and never manages a roster or lineup. **Recovery:** a last-slot race returns the actual admission outcome; cancelling a waiting/admitted application before start follows registration policy and reapplying loses queue priority. Before start, withdraw published pairings before changing the field; after competition start, use competitive withdrawal. Missing confirmation leaves the match pending; notifications link to authoritative current state rather than deciding the outcome.

### UJ-05 — Enter and represent a team

**Goal:** compete with a valid team while keeping representation and playing participation separate. **Trigger:** captain/manager chooses a team tournament. **Precondition:** explicit authority to represent the chosen team. Sources: F-04–07, TM-01–12.

| Step | User action | Herald response and next action |
| --- | --- | --- |
| 1 | Inspect the tournament before applying | Show active-player count, roster bounds, deadlines and team-slot availability |
| 2 | Select the represented team and apply | Return one team application status, not applications for every member |
| 3 | Complete the tournament roster before its deadline | Flag identity/exclusivity issues to resolve; never silently replace players |
| 4 | Check in the team | Show roster and match readiness separately from team check-in |
| 5 | Submit a starting lineup before each match | Accept only eligible players from the frozen roster; show the locked version before play |
| 6 | Report, confirm or dispute for the represented entrant | Allow only delegated powers; an arbitrary teammate has no implicit reporting rights |
| 7 | Review team standings and participation | Show each player's actual participation; preserve earlier records after a rename or membership change |

**Success:** a non-playing manager can represent the team while only selected starters with recorded play receive appearance evidence. **Recovery:** revoked representation blocks future actions; another authorised representative can continue. Lineup rejection identifies the player/count/rule to fix. The same person cannot confirm their own team's report as the opponent. Missing starters do not automatically withdraw the team. Persistent-team creation and representation verification need separate refinement before H2 implementation.

### UJ-06 — Resolve an incident and safely correct an outcome

**Goal:** restore an explainable competitive state without hiding earlier decisions. **Trigger:** operations queue shows an unresolved match, no-show, dispute or correction request. **Precondition:** authority over this tournament; delegation is H2, while H1 uses the operator. Sources: F-07–09, §9.

| Step | User action | Herald response and next action |
| --- | --- | --- |
| 1 | Open the affected match | Show current revision, entrants, permitted evidence and report versions; keep private evidence out of public views |
| 2 | Choose resolution or correction and supply a reason | Separate played result, concession, no-show and administrative decision; do not fabricate played scores |
| 3 | Review the proposed impact | Show old/new result, points, standings and relevant published dependencies; include participation impact where applicable |
| 4 | Confirm against the current revision | Apply one effective revision if permitted; record actor/reason and preserve predecessors |
| 5 | Review refreshed competition state | Show standings update status and remaining blockers; expose revision disclosure in affected final results |

**Success:** the decision has one competitive effect and can be explained afterwards. **Recovery:** a concurrent edit requires reloading and reviewing the new impact. Ordinary correction is blocked when published dependencies exist; identify the affected round/stage. The initial journey does not offer rollback of played brackets. Reopening a finalised competition is a separate reasoned action subject to the same checks. A director intervening in their own entry is identified; mandatory independent adjudication remains an open policy.

### UJ-07 — Follow progress as a spectator

**Goal:** understand who plays next and where the competition stands without an account. **Trigger:** public/unlisted link, or H2 public discovery. **Precondition:** permitted visibility. Sources: F-02–03, F-06, F-09, §12.

| Step | User action | Herald response and next action |
| --- | --- | --- |
| 1 | Open tournament details | Show organiser, schedule/time zone, participation structure and separate lifecycle facts |
| 2 | View rounds and matches | Show published rounds/matches, opposing entrants and resolution causes; drafts remain unavailable |
| 3 | Inspect standings | Base them only on effective results, with provisional/final status and update revision/time |
| 4 | Open a standing | Explain its points and published tiebreakers; shared positions remain shared |
| 5 | Return after finalisation or revision | Show the final outcome or cancellation, with revision disclosure where applicable |

**Success:** public progress is understandable without exposing contacts, private reasons or evidence. **Recovery:** stale/updating views disclose their state; a failed refresh retains context and offers retry. Private access denial reveals no tournament content through detail, discovery or history. A public link grants no mutation authority. Roster/lineup details remain private under the H1 baseline in D-09.

### UJ-08 — Complete the operator journey through the API

**Goal:** run UJ-02/03 from an independent client. **Trigger:** an authorised consumer starts a league. **Precondition:** explicit user/application scope and a compatible profile. Sources: F-11, API-01–10; connected execution authority in F-12 remains proposed.

| Step | Client action | Herald response and next action |
| --- | --- | --- |
| 1 | Read contracts and context | Expose documented contracts, profile capabilities and the authorised organisation context |
| 2 | Create/publish the league and add entries | Accept individual or team entries with distinct stable identifiers |
| 3 | Admit and check in entrants, then prepare pairings | Freeze rosters only for teams; prepare and publish pairings before starting |
| 4 | Read assigned matches | Require eligible team lineups to be locked where applicable; offer no team-only calls for individuals |
| 5 | Submit an authorised aggregate result | Require operation identity and expected revision; return a receipt |
| 6 | Reconcile and finish | Resolve uncertain transport outcomes through receipts; serve fresh standings; finalise once blockers are clear |

**Success:** four entrants yield six matches and the same final standings as the browser flow. **Recovery:** retrying identical content with the same operation identity returns the original receipt; changed content conflicts. Stale revisions require a reread; revoked scope prevents further actions. Engine failure resolves nothing. If D-01 is settled as proposed (Herald directs, the consumer executes), a disconnected consumer does not create connected rounds. Credential mechanisms, receipt retention and external execution assignment require implementation specifications; this journey does not select them.

### 17.2 Review and visual follow-up

The [visual direction](herald-visual-direction.md) identifies current concept references, superseded images and review-state mockups. The original three concept PNGs illustrate round operations, outcomes/standings and discovery; they do not establish complete journey acceptance. The corrected outcomes/standings fixture is authoritative over the earlier round-management image where their scores/ranks differ. New review-state mockups must label pending D-21–27 policy recommendations. An exploratory prototype or screenshot is not proof of a production permission, transaction or recovery guarantee.

Prioritise review of UJ-01–03, then UJ-06/07/08 for the first operator delivery; refine UJ-04/05 for H2. Before a screen implementation proposal, obtain or reuse mockups for each affected surface and relevant states: empty/loading/failure, incomplete configuration, waiting/admitted/check-in, blocked team readiness, draft/published pairings, pending/disputed/effective results and correction impact. Include mobile next-action behaviour and keyboard/error recovery.

Outstanding decisions and their owners/gates are exclusively recorded in §15. The coverage and scenarios below explain how to close them; neither a new diagram nor a working prototype changes a decision status automatically.

## 18. Acceptance and visual handoff

The following scenarios make the review falsifiable. **They are specification candidates, not a report of passed tests.** Where a scenario cites a proposed decision, its expected outcome is conditional on accepting that proposal. The maintainer must accept or replace it before the affected implementation starts. Existing confirmed constraints continue to apply in either case.

### 18.1 Acceptance fixtures

| ID | Scenario and observable expected outcome | Decisions/journeys |
| --- | --- | --- |
| AT-01 League baseline | Four individual entrants yield six matches; five yield ten and one zero-point rest each. Under the confirmed 3/1/0 profile, two equal point totals share position; a seeding draw is reproducible from the recorded draft. Complete web/API without roster fields or commands. A later-round match may start when its own checks pass | D-04/15; UJ-02/08 |
| AT-02 Publication and closure | Incomplete publication preserves draft inputs and names blockers. Publishing does not open registration. Closing with zero/one admitted succeeds; starting still fails with fewer than two eligible entrants | D-27, CP-01–04; UJ-02 |
| AT-03 Field/capacity concurrency | Two operations for the final slot yield one admission. A published pre-start field cannot change silently: withdraw publication, review, republish. Reopening under the proposed policy requires withdrawal first. Identical retries never double-admit or double-promote | D-06/27; UJ-02/08 |
| AT-04 Direct teams | Four teams yield six aggregate matches. A permitted seven-player roster fields five starters; two unused reserves receive no appearances. Four eligible starters block start. A valid locked lineup alone earns no appearances before recorded play | D-16–18; UJ-03/08 |
| AT-05 Eligibility changes | Under D-23, leaving the persistent club after freeze leaves tournament eligibility intact. Explicit competitive withdrawal/sanction blocks future selection/start; a pre-start replacement uses eligible frozen-roster players with a retained prior lock. A running lineup is not silently overwritten | D-17/23; UJ-03/06 |
| AT-06 Exceptional outcomes | Repeat the §8.1 rows, including in-play withdrawal, double no-show without withdrawal, a no contest before/after play and all entrants withdrawn. Preserve actual-play evidence. A-then-B and B-then-A withdrawal before play both yield 0/0 double absence and preserved revisions; later withdrawal never erases a played effective result | D-04/05/25; UJ-02/03/06 |
| AT-07 Current finalisation | Facts revision 12 with standings applied through 11 blocks finalisation. After projection and review at 12, a concurrent correction to 13 causes conflict and Review again. Only current reviewed standings finalise; reopening retains the previous approved revision | D-24/27; UJ-02/06/07/08 |
| AT-08 Safe correction | Show previous/new outcome, cause, points, recorded-play impact and affected dependencies. An allowed correction applies once with actor/reason/history. Published dependency blocks ordinary H1 correction. A stale save retains input but requires a fresh impact review; lost-response retry returns the original receipt | D-07/24; UJ-06/08 |
| AT-09 Cancel/archive | Under D-27, pre-start cancellation closes active applications/registration and withdraws pairings. Post-start cancellation preserves played/effective history, adds no fabricated awards and names no champion. Reject late writes. Archive only terminal competitions without deleting history or changing visibility | D-25–27; UJ-02/07 |
| AT-10 Visibility | Under D-27, public→unlisted removes discovery but keeps permitted links; public→private denies subsequent anonymous reads and invalidates public delivery caches; private→public requires alias/content preview. No path exposes contacts, private reasons, rosters or lineups | D-09/21/27; UJ-07 |
| AT-11 Changed dates | Postponement previews each deadline and changes only the selected future values. An already frozen roster remains frozen; check-in evidence remains. The change log shows old/new times and reference time zone; the proposed H1 process makes no inbox-delivery claim | D-17/26/27; UJ-02/03 |
| AT-12 Operator/pilot access | Under D-21 a signed-in newcomer assigned to Herald creates an owner organisation; a person not assigned to Herald cannot sign in. A different organisation's operator and an unscoped/revoked application cannot read private details or mutate by direct ID. Recovery restores only the verified identity's scope; context switch discards previous private context | D-12/21; UJ-01/08 |
| AT-13 Guest/public identity | Same-name guests in two organisations remain separate under D-22; no cross-organisation lookup/merge. Public listing requires reviewed aliases and never uses contact/internal identity fallback. Guest creation grants no private-access/account rights | D-09/22; UJ-02/03/07 |
| AT-14 Independent API | Client completes individual and direct-team operator leagues; receipts distinguish received/applied/rejected and expose current revision/error information. Same operation/content returns the original outcome, changed content conflicts, expired authority blocks new effects. No team-only payload is required for an individual operation | D-02/12/15; UJ-08 |

### 18.2 Journey and state coverage

The visual direction is the inventory of concrete artefacts. This matrix is the functional coverage contract. For each implementation slice, link the exact current mockup/state, record review status, and state which decisions remain proposed. A scene may demonstrate the intended composition while its policy is still pending.

| Journey | Minimum surfaces/states to review | Behaviour gate |
| --- | --- | --- |
| UJ-01 operator context | No membership; proposed owner creation; organisation switch; denied/lost access; recovery next action | AT-12; D-21 |
| UJ-02 individual operator | Empty dashboard; invalid/complete editor; separate publication/registration/competition facts; guest alias; waiting/admitted/check-in; draft/published pairings; terminal outcomes; current/stale finalisation | AT-01–03/06/07/09/11/13 |
| UJ-03 direct teams | Capacity in teams; roster seven/starters five/reserves two; freeze; player identity conflict; 4-of-5 blocker; valid lock; membership departure versus competitive sanction; played versus administrative history | AT-04/05/06; D-17/23/25 |
| UJ-06 operator incidents | Unselected new-result form; previous/new correction impact; published-dependency blocker; failed save with input retained; stale edit; receipt reconciliation; reasoned reopening | AT-07/08; D-07/24 |
| UJ-07 spectator | Alias-only public detail/standings; provisional/updating/failed refresh; cancelled/revised final result; private denial with no content leak | AT-07/09/10/13 |
| UJ-08 API consumer | Worked individual/team requests, permission/state/revision errors and queryable receipts; no extra application UI required | AT-01/04/12/14 |
| UJ-04/05 participant/representative | Own entry and next action, invitations, representation, report/confirm/dispute, personal history | H2 refinement; not an H1 implementation dependency |

For each affected screen, include desktop/mobile next-action behaviour and relevant empty, loading, populated, blocked, stale and failed states. Verify keyboard/error recovery and status text independently of colour. Do not use prototype persistence or a screenshot as evidence that authorisation, durable audit or concurrency has been implemented.

### 18.3 Closure checklist and review traceability

| Prior review finding | Consolidated source of truth | Still required before the affected slice |
| --- | --- | --- |
| R-01 scope/status drift | §§1/15/16 and ADR 0013 | Keep PPT/README/roadmap statuses aligned; explicitly decide remaining clauses |
| R-02 terminal outcomes | §8.1, D-25, AT-06/09 | Accept/replace the proposed exception policy |
| R-03 roster eligibility | §10.2.1, D-23, AT-05 | Accept/replace departure/sanction policy; review blocked/pre-start-revision screens |
| R-04 finalisation freshness | §9.3, D-24, AT-07 | Agree observable revision contract and implement its atomic acceptance check |
| R-05 access/guest/pilot gaps | F-01a, D-12/21/22, AT-12–14 | Decide operating policies; specify credential/recovery/grant procedure |
| R-06 H1 announcements | F-10, D-26, AT-09/11 | Decide minimal channel/process and review change records |
| R-07 lifecycle/visibility/deadlines | §§5.1–5.2, D-27, AT-02/03/09–11 | Accept/replace transitions and privacy/deadline effects |
| R-09 missing H1 visual coverage | §18.2 and visual-direction inventory | Review each affected journey/state; the individual happy path does not approve teams |
| R-10 correction/recovery states | §9.3, AT-07/08, UJ-06 | Review previous/new, stale/denied/failed/uncertain states and blocked dependencies |
| A-03/A-04 architecture ownership/history | §§9.3/16, D-08, affected OpenSpec design | Assign authoritative cross-module checks and durable evidence without redefining product rules |

H0/H1 readiness remains **pending explicit decisions and visual acceptance**. Documentation consolidation closes the ambiguity about where those decisions live; it does not turn pending defaults into accepted rules or claim the scenarios have passed. Continue bounded M0 work and prepare one reviewed H1 slice at a time.
