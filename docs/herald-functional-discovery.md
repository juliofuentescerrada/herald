# Herald — Domain Discovery, Functional Specification and Roadmap

Version 0.4 · 6 November 2026 · Proposal for domain review

## 1. Purpose and status

Herald is a platform for organising and participating in competitive gaming tournaments. It combines an operational tool for organisers with a public portal where players discover competitions, register, compete and consult their history.

Its secondary purpose is to demonstrate a .NET/Azure reference architecture. Product behaviour should justify technical choices; this functional model does not mandate a particular distribution of modules or services.

**Confirmed with the maintainer:** cover both organiser and player perspectives; support games beyond Magic; deliver in phases; produce functional documentation and a roadmap that complement the repository; expose an API for external applications; account for individual and team competitions in the initial domain definition; make roster and lineup configuration unnecessary for individual 1v1 competitions. Implementation does not start during this discovery stage.

**Proposed in this document:** detailed rules, priorities and limits are recommendations for review, not automatically approved product decisions. Sensitive decisions are listed in §15. Early milestones have more detail; later extensions require refinement before implementation.

Reviewed sources: [README](https://github.com/juliofuentescerrada/herald/blob/HEAD/README.md), [roadmap](https://github.com/juliofuentescerrada/herald/blob/HEAD/docs/roadmap.md), [ADR 0004](https://github.com/juliofuentescerrada/herald/blob/HEAD/docs/adr/0004-modular-monolith-of-hexagonal-modules.md), [ADR 0006](https://github.com/juliofuentescerrada/herald/blob/HEAD/docs/adr/0006-tactical-ddd-with-domain-events.md). These references record the baseline reviewed for discovery, not a claim to have audited every repository document. This proposal does not modify the repository.

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

These areas are not automatically bounded contexts. Results may belong to Competition and Standings may begin as its projection. Team management does not necessarily require a separate module in H1. The public catalogue does not decide admissions; history does not change results. Discovery must settle ownership of tournament configuration and lifecycle, currently implicit between Registration and Competition.

Scheduling and standings consume entrant identities, not roster members. Roster eligibility and lineup validation remain explicit responsibilities; they must not be silently duplicated in every competition-system algorithm.

## 5. Lifecycles and control points

Publication, registration and competition must not share a single state: a published tournament can have closed registration without having started.

| Dimension | Proposed states | Rule |
| --- | --- | --- |
| Publication | Draft, published, archived | Visibility is separate: public, unlisted or private |
| Registration window | Not open, open, closed | May reopen before the start; does not itself alter entries or pairings |
| Competition | Preparation, running, finalised, cancelled | Finalisation is explicit after validation; temporary suspension is a later extension |
| Round | Draft, published, running, completed | Only published rounds are visible to competitors; published revisions are announced |
| Match | Scheduled, in play, awaiting validation, disputed, resolved, voided | State and resolution reason are separate |
| Entry application | Waiting, admitted, rejected, cancelled | Check-in, roster readiness and competitive withdrawal are separate dimensions |
| Entrant check-in | Pending, confirmed, absent | Profile determines whether it is mandatory |
| Team readiness | Incomplete, eligible, ineligible | Derived from applicable roster and attendance rules, not an extra admission slot |
| Match lineup | Draft, submitted, locked | Changes after locking require a permitted substitution or explicit correction |

**CP-01 Publication:** requires title, organiser, game/variant, dates and time zone, location or online mode, entry capacity, entrant kind, participation structure, initial system and visible rules. Team profiles also specify roster bounds, active players per side, representative powers and lineup requirements. Publishing does not open registration automatically.

**CP-02 Registration closure:** prevents new applications. Closure is allowed with zero or one admitted entrant so the director can cancel or reopen. The minimum of two eligible entrants is enforced when starting. Two five-player teams satisfy this minimum; one team containing ten players does not.

**CP-03 Preparation:** the director reviews attendance and eligibility, resolves exclusions and fixes the entrant list. Initial scope does not admit new entrants after the competition starts. Team rosters are frozen at the announced deadline; changing general team membership later does not rewrite tournament rosters.

**CP-04 Start:** requires closed registration, at least two eligible entrants, complete rules and valid initial pairings. It fixes identifiable versions of entrants and rules, plus tournament rosters where applicable. Individual 1v1 entries require no roster freeze or lineup submission: the player is determined by the entry. Team lineups may be submitted later before their match starts, within the roster and profile; no match starts without a valid locked lineup when required. Updating a catalogue profile does not change an ongoing tournament.

**CP-05 Finalisation:** requires completed stages, resolved countable matches and no open disputes. The director reviews provisional final standings before publishing them.

**CP-06 Cancellation:** requires a reason. Before starting, cancels admitted entry reservations and announces the change. After starting, preserves history, marks the competition cancelled and does not automatically declare a winner. Cancellation is not deletion.

## 6. Functional use cases

### F-01 Organisation and operational staff

A user creates an organising organisation and becomes its owner. They may invite collaborators and delegate direction/refereeing per tournament. Accepting an invitation does not grant access to other organisations.

Rules: at least one owner remains; ownership transfer requires acceptance by the successor; revocation stops future actions but preserves historical authorship. A collaborator cannot grant powers beyond their own. Team representation is separately authorised and may be exercised by a person outside the organising staff.

Acceptance: a director of organisation A cannot edit B's private tournament. A referee without administration cannot alter entry capacity or appoint directors. A captain can act for their team but cannot settle its dispute as an organiser unless separately authorised, in which case that intervention is attributed.

### F-02 Prepare, announce and change a tournament

The director sets listing, dates, rules, entry capacity, automatic/manual admission, optional/mandatory check-in and visibility, then previews before publication. Dates include registration opening/closure and planned start; planned time alone does not start competition.

The entry kind is individual or team, with mixed individual/team fields excluded initially. Team configuration separates eligible roster size from active players per side. A roster of seven with five active players is a valid structure only if its profile permits two reserves. Capacity is labelled in entries: “16 teams”, not an ambiguous “16 players”.

Before starting, capacity, schedule and rules can change. Material changes after admission are versioned and announced: system, competitive rules, participation structure, venue and start time. Capacity cannot fall below admitted entries until affected entries are explicitly resolved. Changing individual/team entry kind after admissions requires cancelling or reprocessing those applications explicitly, not converting identities silently. After starting, descriptive corrections remain possible but entrant, roster and scoring changes are governed by explicit procedures.

Public tournaments appear in discovery. Unlisted tournaments can be opened by link but are absent from the directory. Private tournaments require invitation or operational authority; knowing a URL is insufficient. They do not leak through public player or team history.

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

Team admission reserves a slot; roster readiness is separately visible. Incomplete rosters are allowed while completing registration if the announced deadline permits them, but cannot start while ineligible. A vacancy promotes one eligible team, not its individual members. A representative may not register an unrelated team without authority.

Organisers may add guest individuals or teams without forcing every player to create an account. Records need visible names and stable internal identities to flag possible duplicates. People are not merged solely because another person supplied the same name/email. Later account linking is verified and preserves the original entry and roster attribution.

Acceptance: with capacity 16 and 16 admitted entries, entry 17 waits; cancelling one promotes exactly one. Sixteen admitted five-player teams consume 16 slots while their rosters account for 80 players. Failed requests never display nonexistent admission.

### F-05 Check-in and entrant readiness

During a configured window, an individual checks in or a director records attendance. For teams, an authorised representative checks in the entry; member attendance and lineup readiness are separate. A captain's action does not assert that five eligible players are present unless the policy explicitly requires and records this evidence.

With mandatory check-in, only admitted, checked-in and eligible entrants may start. Expiry does not automatically remove entries or promote others: the director reviews absences and explicitly frees slots before starting. No geolocation is required initially. Leaving before the field is fixed is registration cancellation; afterwards it is competitive withdrawal.

Acceptance: an individual without mandatory check-in is excluded from initial pairings. A team with only four eligible active players cannot start a match requiring five, despite the captain having checked in. Closing registration does not mark anyone absent. Directors see why each entry is eligible or blocked.

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

A round completes when every pairing has a valid terminal resolution, including byes and administrative outcomes. Voiding a match needs system-specific treatment; deleting it is not a completion rule. Timer expiry only alerts: the profile and an authorised action resolve the match. Synchronized timers and game-specific overtime procedures are later extensions.

Swiss waits for the previous round to complete. Round-robin can schedule all rounds initially and allow matches from different rounds according to schedule. Elimination can unlock a match as soon as both slots are determined without waiting for an entire bracket level.

A missing team member does not automatically withdraw the team. The director can wait, approve a valid pre-start lineup change or apply the published no-show/understrength policy. H1 disallows starting under the required active count and uses an operator's explicit resolution if the problem persists.

Acceptance: an unresolved dispute blocks round completion and identifies the match. A no-show keeps its cause rather than appearing as a played game. An ineligible team member blocks the lineup, without changing existing opponent results.

### F-09 Standings, finalisation and history

Standings use effective results, show provisional status and explain points/tiebreakers. Pending reports may appear in details but do not count as effective. An entrant's position can be traced to its relevant results.

Entries inseparable under published criteria share position. Name/ID ordering is presentation, not a competitive tiebreaker. A cut requiring a unique qualifier must have a terminal criterion published before starting, such as an additional decider or supervised recorded draw.

The director reviews and finalises. History keeps tournament, title/variant, date, organiser, entry, matches, position and withdrawal/disqualification where applicable. It does not compare incompatible game points or turn shared positions into exact ones. Cancelled competitions remain distinct.

For a team entry, the rank and match outcome belong to that entrant. Team history and personal participation are separate: a roster member is not assumed to have played every match. Locked lineups preserve who actually appeared; substitutes not fielded remain registered reserves. A later team rename or member departure does not rewrite those records.

Acceptance: withdrawn entries retain previous results. Authorised correction revises standings/history with revision disclosure. Private-tournament history remains protected. Replacing one team player between eligible matches does not change the team's points or create a new entrant.

### F-10 Operational notifications

Minimum notices: admission/promotion, cancellation, material changes, roster or lineup rejection, published pairing, requested confirmation, dispute resolution and revised final results. In-app notices come first; email is an additional channel.

Each notice identifies tournament/reason, links to current state and avoids visible duplicates for the same fact. Delivery failure does not reverse admission or resolution. The user dashboard remains authoritative. Team notices reach the assigned representatives; player-specific lineup notices follow visibility settings. Promotional preferences are separate from operational notices.

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

Initial tiebreaker policy: points, then shared position. This deliberately simple but complete profile is sufficient for H1. Additional criteria require a new profile before use. A unique champion is not required when final standings are tied.

Withdrawal keeps effective previous results; future unplayed scheduled matches are administratively awarded to the opponent. Two withdrawn entrants produce a double absence with no points. This has fairness implications and must be announced. Policies discarding an entrant's entire record remain alternatives, not rules mixed into one tournament. A player leaving a roster does not invoke this withdrawal rule unless the team entry itself withdraws.

### 7.3 Single elimination

A loss eliminates an entrant; each winner advances into exactly one subsequent slot. Bracket size is the next power of two. Empty slots become byes according to an announced seeding procedure. The draw/seeding used is preserved.

Six entrants produce eight bracket slots, two initial byes and five played matches if no other incidents occur. A bye advances an entrant without inventing played games. A terminal draw is forbidden; the profile defines a decider. The final determines winner and runner-up; entrants eliminated at the same stage share position unless an additional placing match or rule was announced. No third-place match exists by default.

Before the bracket is fixed, withdrawal can lead to regeneration. Afterwards the relevant slot is resolved as concession/no-show. No replacement entrant is inserted once running. A single-match tournament has two entrants, one stage and one match, whose outcome follows its profile. Either entrant may be a team.

### 7.4 Swiss

Swiss belongs to the planned product, after the initial milestone. It pairs entrants with similar performance over a fixed number of rounds without automatic elimination. Pairing sees entrant IDs and points, not individual roster members.

The minimum contract includes active entrants, points for outcomes/byes, rounds, score-group priority, no repeat opponents, odd groups and floats, bye eligibility, seeding/tiebreakers and manual review.

Initial direction: minimise score gaps while respecting constraints; do not repeat opponents; assign a bye to the lowest-scoring eligible entrant without a prior bye, with a stable published tie order and only if the remaining field can be paired. A competitive bye awards win points without actually played games. Its statistical treatment is separately defined by profile.

This is not a complete algorithm. Global pairing, floats, administrative-win exclusions, search limits and unsatisfiable cases require their own specification and validated examples before H4. There is no promise of official MTG Swiss. Minimum scenarios include odd groups, withdrawal, previous byes, an impossible final pairing and reproducible reconstruction. Failure is explicit, never a hidden rematch or partially published round.

### 7.5 Combined stages

Target example: Swiss followed by a Top 8. Rounds, qualifier count, cut tiebreakers and bracket seeding are fixed before starting. Stage transition uses the previous stage's final standings; points do not carry over by default. A stage cannot begin with unresolved entry slots.

Qualified teams retain their entry identity; stage transition does not reopen roster registration automatically. Any stage-specific roster/substitution exception must be announced before the tournament and preserve version history. Corrections affecting a dependent stage follow §9: a published cut is neither immune to errors nor permission to replace opponents silently.

## 8. Results, standings and game-specific data

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
| Entry withdraws after pairing | Preserve pairing; resolve pending match under profile; do not overwrite resolved matches |
| Team member leaves or is disqualified | Reassess eligibility and future lineups; do not automatically remove the team or erase previous results |
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
| Result | Match/entrant references and score | Same competitive references, with lineup reference where required |

Acceptance: create an individual league, register two players, admit/check in, publish their pairing, start, submit/confirm the result and read history without any roster/lineup field, object identifier, command or screen. Repeat via an independent API client. Existing five-player team readiness checks must still reject a team with only four eligible starters. A composite team's individual board still validates its authorised player assignment.

### 10.2 Roster and lineup rules

The following rules are proposed defaults, to be confirmed with the maintainer before H1:

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
- **TM-12 Sanctions:** a member sanction and a team sanction have different scope. A member's removal blocks their future selection; previous team results change only through an explicit authorised decision.

Initial roster lifecycle: a representative submits/updates before the deadline; Herald validates bounds, identities and exclusivity; the director reviews exceptions; the eligible version is frozen. For each match a representative selects a lineup, the system validates it, and start locks the record. Invalid lineups are rejected without silently substituting another player.

For H1 the organiser may perform these actions and register guest teams/players; a persistent self-service team directory is not a prerequisite. Nevertheless API identities must preserve team, entrant, player and roster/lineup distinctions from the first release. H2 introduces representation and self-service management without changing the meaning of existing competitive identifiers.

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

- **Authorisation:** every operation validates scope, including direct URL/API access. A public link never grants mutation powers. Team actions verify representation, not just roster membership.
- **Auditability:** admission exceptions, profile changes, publications, results, corrections, sanctions, delegations, roster versions and lineup changes preserve actor, time, reason and previous version where relevant.
- **Consistency:** no overcapacity or two effective winners for one match. Dependent operations wait for current results even if public read views refresh later. A team outcome is counted once regardless of active player count.
- **Visible updates:** tables expose current time/revision and synchronisation status. Provisional pilot target: public results reflect changes within five seconds under normal conditions; measure before making a commitment.
- **Privacy:** emails, contact details, private rejection reasons and dispute evidence are not public. Public names, roster/lineup visibility and identity retention need a product policy before public launch. Do not expose secret game submissions through team APIs.
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

## 14. Proposed functional roadmap

### 14.1 Sequencing principles

Each milestone produces demonstrable behaviour through UI/API as applicable. Existing M0 foundations remain necessary but should not indefinitely delay the first complete journey. Identity, authorisation, effective rules and external contracts arrive with the first flow that needs them.

Team-aware identities and direct team support begin in H0/H1. Individual 1v1 remains a direct registration-to-match workflow with implicit single-player participation, as required by IP-01–06. H6 extends team functionality rather than introducing teams for the first time. This is a deliberate change to version 0.2, which postponed too much team modelling and operation.

No dates are assigned without effort/capacity estimates. Main sequence: H0 → H1 → H2 → H3 → H4 → H5. H6/H7 are separately prioritised extensions after the relevant core capabilities. External adapter work can progress alongside H3 after H2; its connected Swiss journey cannot finish before H4.

### H0 — Domain agreement and product contract

**Value:** a reviewable definition before building.

Deliverables: vocabulary/lifecycles, H1/H2 scope, permissions, first individual/direct-team profiles, initial API, roster/lineup invariants, league/admission/result scenarios, integration authority decision, and review of affected ADRs/roadmap.

Exit: D-01–08, D-12 and team decisions D-15–18 in §15 are settled for H1; scenarios have unambiguous expected outcomes; no core flow relies on deciding rules in a handler. Validate a 1v1 journey, a two-team 5v5 match and the distinction from a composite team encounter before fixing public identifiers. Later capabilities can remain open if they do not compromise the core contract.

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

### 14.2 Relationship to the repository roadmap

| Existing milestone | Proposed treatment |
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
| Notices | F-10 | State visible without email; correct team recipients | H2/H5 |
| API | API-01–10, F-11 | Journey without Angular; scoped identities | H1–H5 |
| External integrations | F-12 | Connected tournament with one authority | H4 |
| Individual simplicity | §10.1.1, IP-01–06 | Complete 1v1 journey without roster/lineup setup | H0–H2 |
| Basic teams | §10.1–10.4, TM-01–12 | 1v1 and direct 5v5 without changing entry semantics | H0–H2 |
| Composite teams/substitutions | §10.3–10.4 | Parent aggregation once; versioned fielded players | H6 |
| Game submissions/circuits | §10.5–10.6 | Private lists; revisable season and team continuity | H6/H7 |

## 15. Domain decisions for review

Public API support, considering teams from the initial model and avoiding explicit roster/lineup configuration for individual 1v1 competitions are confirmed. Detailed defaults below remain proposals for validation with the maintainer before becoming accepted specifications.

| ID | Decision | Initial recommendation | Required before |
| --- | --- | --- | --- |
| D-01 | Connected tournament authority | Herald directs competition; external consumer executes; local mode separate | H1 contract/external adapter |
| D-02 | External result granularity | Completed match first; detailed games/submatches extend contract | H1 API |
| D-03 | Guests and synthetic entrants | Stable identities without forced human accounts; distinguish simulated actors | H1 |
| D-04 | Initial profile | Single round-robin, 3/1/0, shared positions; individual/direct-team variants | H1 |
| D-05 | Withdrawal/disqualification | Keep effective previous results; resolve future matches under §7/§9; member and team sanctions separate | H1 |
| D-06 | Waiting-list promotion | Direct automatic promotion while open; director promotion after closure | H1 |
| D-07 | Corrections with dependencies | Initially apply only without published dependencies; detect/block others | H1 |
| D-08 | Tournament lifecycle ownership | **Settled:** the Tournaments module owns configuration, publication, visibility and lifecycle; Registration owns admission (ADR 0004) | H1 design |
| D-09 | Public identity/history | Public alias without email; tournament visibility inherited; actual lineup participation distinct from roster registration | H2 public launch |
| D-10 | Competitor confirmation | No silence-based confirmation; operator escalation; team representation required | H2 |
| D-11 | External profile compatibility | Shared formulas, bye treatment, drawn games and participation rules | H4 |
| D-12 | Result-source authority | Explicit tournament/organisation grant, revocable and audited | External writes H1 |
| D-13 | Distributed execution | One executor initially; assignment/leases before multiple instances | H4 integration |
| D-14 | Ecosystem opening | Controlled pilot consumers first; third-party registration and version commitments before general access | H5 |
| D-15 | Competitive entry identity | Individual or team entrant distinct from player/account; two sides independent of active-player count | H0/H1 contract |
| D-16 | First team scope | Direct team matches in H1; fixed rosters/starting lineups; composite submatches in H6 | H0/H1 |
| D-17 | Roster freeze and exclusivity | Freeze no later than start; one active team entry per player per tournament; no new players after freeze in H1 | H1 |
| D-18 | Team readiness and representation | Full eligible active count; identifiable captain/manager; operator resolution for understrength/no-show | H1; self-service H2 |
| D-19 | Substitution windows | Between-match selection from frozen roster initially; richer game/map changes explicitly profiled later | H6 |
| D-20 | Team circuit continuity | Separate stable team, roster and organisation; define which owns season points | H7 |

Deferred questions that do not block H1: payments, prizes, minors, official regulatory compatibility, bidirectional offline authority, rollback of played brackets, complex penalties, higher-than-pilot scale, evidence-access policy, transfers after roster freeze, cross-tournament scheduling and detailed player statistics. If the pilot includes any of these conditions, its specification is no longer deferrable.

## 16. Proposed incorporation into project documentation

This file is functional baseline v0.4, not a substitute for OpenSpec or ADRs. After domain review, distribute it as follows:

- `docs/product/vision-and-scope.md`: §1–2 and API vision.
- `docs/domain/glossary.md`: §3, especially entrant/player/team distinctions.
- `docs/domain/capabilities-and-lifecycle.md`: §4–5.
- `docs/functional/tournament-operations.md`: §6, §9 and §11–12.
- `docs/functional/competition-systems.md`: §7–8.
- `docs/functional/teams-and-lineups.md`: §10.1–10.4 and associated acceptance scenarios.
- `docs/functional/submissions-and-circuits.md`: §10.5–10.6.
- `docs/functional/public-api-and-integrations.md`: §13.
- `docs/roadmap.md`: update using §14, retaining the necessary technical delivery track.
- `docs/domain/open-decisions.md`: §15 and subsequent resolutions.

Each OpenSpec change takes a vertical slice of a milestone, references its rules and defines executable scenarios. ADRs explain technical alternatives; functional specifications explain expected behaviour. Proposed decisions do not become accepted merely by appearing in a file.

Next refinement: review D-01–08, D-12 and D-15–18, then specify H1 acceptance and the initial API before designing aggregates. Teams are accounted for in core identities and initial direct-match operation; advanced submatch aggregation and seasons can be refined later without redefining a competitive entrant as a different concept.
