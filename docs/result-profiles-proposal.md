# Proposal: extensible match result profiles

Status: proposed roadmap refinement, 7 November 2026. This document does not change the accepted delivery scope or approve implementation. The functional baseline and its decision register remain authoritative.

## Purpose

Support a small set of useful result models first, while allowing richer models later without changing tournament scheduling, entrant identity or result acceptance for every discipline. A discipline may suggest a profile; listing or following that discipline does not promise full support for its rules.

This proposal concerns result recording and interpretation. Organisation onboarding and discovery preferences are separate work.

## Product model

Keep four concepts separate:

- **Discipline/title and variant:** what people play and search for.
- **Match result model:** the evidence recorded and how it determines the match outcome.
- **Competition system:** how entrants are paired and advance.
- **Standings policy:** points and supported tiebreakers applied to effective outcomes.

A versioned rules profile selects compatible combinations, including participation requirements. Herald offers validated profiles, not an unrestricted rule editor. The same result model can serve individual or direct-team entries; a team victory counts once.

| Result model | Recorded evidence | Resolution and limits |
| --- | --- | --- |
| Outcome only | Winner, or draw when allowed | No numeric score required. Strict W/L is a no-draw variant; preserve H1's draw-capable baseline. |
| Direct numeric score | One non-negative integer per side, such as 1–0, 3–2 or 56–40 | Initially higher score wins; equality is accepted only by a draw-capable profile. No sport-specific timing or scoring-event validation is implied. |
| Best-of-N series | Aggregate games won, optionally ordered game outcomes under a separate detail mode | For a decisive Bo3, first to two wins: 2–0 or 2–1 and their reverses. There need not be three games. |
| Sets and nested scores | Set scores and, where the selected profile requires them, games or tiebreak details | Explicit profile-specific validation; tennis/padel illustrate future needs, not a commitment to implement all variants. |

Match scores and standings points are independent: a 3–2 match result does not itself mean three standings points. Tiebreakers may use only statistics supported by the selected result model and recording mode. Outcome-only results must not acquire invented numerical scores to satisfy a tiebreaker.

## Proposed delivery

| Gate | Scope | Completion evidence |
| --- | --- | --- |
| **H1 baseline** | Preserve operator-entered outcomes, optional draw according to profile, individual/direct-team support and existing standings policy. Establish profile identity/version and explicit supported result capabilities in the configuration/result contract. | Complete the existing league journey without numeric scores; reject incompatible results; updating the profile catalogue does not alter a started tournament. |
| **H1 follow-on, proposed addition** | Add a bounded direct-score profile through its own OpenSpec change after the outcome-only flow works. Keep this optional for H1 exit; if it delays that gate, deliver with H3. | Record 1–0, 3–2 and 56–40; derive the winner; accept/reject equality by profile; reject negative/fractional scores; corrections update standings once. |
| **H3 richer profiles** | Decisive outcome-only and aggregate Bo3 profiles, compatible with elimination and single-match tournaments. Add ordered game detail only where a concrete use case requires it. This refines the existing H3 commitment. | Accept 2–0/2–1 and reverses, reject 3–0 and unfinished 1–1; reject a terminal draw where advancement needs a winner. Two tournaments with different profiles operate concurrently. |
| **Later, milestone unassigned** | Introduce one concrete sets profile when demanded, with its exact validity and completion rules. Generalise only from demonstrated needs. | Fixtures cover ordinary completion, required winning margins and the chosen tiebreak variant; unchanged core scheduling and acceptance flows handle the new profile. |

Series games belong to the same match between two entrants. They do not introduce H6's composite team encounters, individual boards or substitution workflows.

## Extension contract

The configuration and result slices should preserve these functional boundaries; their OpenSpec designs choose the implementation mechanism:

1. A tournament identifies its rules profile and version. Starting fixes the applicable competitive rules under the existing lifecycle contract.
2. A result model declares its required inputs, permitted completion states, validation rules and derived statistics. The server validates evidence and derives the outcome; a contradictory submitted winner is rejected.
3. The competition core consumes the effective outcome and declared statistics. Match-detail evidence is retained for display, audit and correction without making pairing logic interpret each sport's score structure.
4. Web and API expose supported capabilities. Unsupported models fail explicitly; clients never silently reinterpret an unknown score as a generic win/loss.
5. Aggregate-only and detailed-series recording are explicit modes. Aggregate 2–1 does not imply game order. When detail is required, missing games fail validation; when detail is supplied, aggregate and detail must agree, and no game may follow the decisive win.
6. Profile-specific presentation can be added when needed. Extensibility does not require a universal form renderer, public plugin SDK, user-authored scripts or arbitrary rules language.

Effective-result authority, retry safety, expected revisions, correction dependencies and retained history continue to follow the existing contracts. Byes, concessions, no-shows and administrative awards retain their distinct causes and never fabricate played scores. An unfinished series resolved administratively uses that path rather than passing ordinary completed-series validation.

## Organiser experience

Tournament configuration presents **How are results recorded?** with compatible available profiles and a short example. Outcome-only shows winner/draw inputs; direct score shows two numeric inputs; Bo3 shows valid aggregate outcomes or the required game details. A discipline can suggest a choice without silently binding it.

Only implemented profiles are selectable. Publication/start validation explains incompatible system, draw, participation or tiebreaker choices. Result entry preserves input after errors and explains which profile rule failed. Neither numeric detail nor a discipline-specific setup becomes mandatory for the H1 outcome-only journey.

## Acceptance scenarios

- The same four-entry league can use outcome-only or direct score, with six matches and one effective outcome per match regardless of team size.
- A draw-enabled outcome-only profile accepts a draw without a numeric score; a strict W/L profile rejects it.
- A direct-score win and an outcome-only win receive the same standings points under the same policy. A score-based tiebreaker cannot be selected with outcome-only evidence.
- Bo3 accepts W–L–W as 2–1 in detailed mode; W–W–L is rejected because play continued after resolution. Aggregate-only 2–1 remains valid without invented game order.
- A repeated submission produces no duplicate standings effect. A permitted correction preserves old/new evidence and recalculates the effective outcome and supported statistics under existing dependency checks.
- Publishing a new catalogue version leaves an ongoing tournament's validation unchanged. A consumer encountering an unsupported model receives an explicit compatibility failure.
- Administrative resolution preserves any actual play evidence without pretending the remaining games or sets were played.

## Incorporation decisions

Before incorporating this proposal, resolve the following in the functional baseline's single decision register rather than creating a competing register here:

- **D-02 / D-04:** retain score-free H1 outcomes; approve or defer the optional direct-score follow-on and its initial numeric limits. The existing proposed 3/1/0 standings policy is not approved by this proposal.
- **H3 profile scope:** confirm decisive Bo3 first. Magic is an illustrative series use case; game draws, timed rounds and unfinished-series resolution require their own explicit profile policy before claiming compatibility.
- **D-11 / H4:** agree exact capabilities and formula compatibility with the real external consumer; generic series support alone does not establish game-specific equivalence.
- **Future sets:** select a real first use case and delivery milestone before specifying rules or committing implementation.

On acceptance, update functional discovery §§7–8, H1/H3 and the affected register entries, then the roadmap delivery rows. Propose separate bounded OpenSpec changes for the result contract, direct-score support and series support at their respective gates. No runtime implementation or new ADR is required merely to review this proposal.

References: [functional baseline](herald-functional-discovery.md), [roadmap](roadmap.md), [delivery scope ADR](adr/0013-functional-delivery-scope.md).
