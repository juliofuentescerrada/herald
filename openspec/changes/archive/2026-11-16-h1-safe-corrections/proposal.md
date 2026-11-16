## Status

**Proposed in H1 batch 3's proposals pull request, 15 November 2026.** The rules come from the batch's decision session of the same day, recorded in the functional discovery (§9.1, §9.3, §8.1; §15 rows D-07 and D-24). It depends on batch 2. Merging the proposals pull request approves this change (ADR 0018); task 1.1 records that approval.

**Approved for implementation on 16 November 2026**, when the maintainer merged the batch 3 proposals pull request (#74), with the review answers below (ADR 0018). The review asked for no change to this proposal.

**Review answers, 15 November 2026 (#74):** the maintainer accepted Q1 and Q2 (the preview from Standings with Competition rejecting a stale revision; departure outcomes correctable, the entrant staying departed) and the prototypes as they are.

## Why

A resolved match cannot change: a wrong result stays wrong, and the only way out is a departure or nothing. D-07, confirmed on 15 November 2026, lets the owner correct any effective resolution while the competition runs, with a reason and a preview of what changes. AT-08 tests it.

## What Changes

- **Correction (D-07, §9.1):** while the competition is running, the owner corrects a resolved match to any outcome and cause of §8.1 (played, concession, absence, no contest), with a required reason of at most 500 characters, private to the organisation, the match's expected revision and an operation identity. The match keeps one effective resolution; the previous one is kept with who, when and why it was replaced. A repeat with the same operation identity and content returns the original; different content conflicts.
- **Recorded play is never erased (§8.1):** if the match recorded play, the new cause must allow play (played, concession after play, no contest after play); appearances stay. A team played outcome still needs the match's start evidence (locked lineups); a correction cannot create it.
- **Impact preview (§9.3):** before confirming, the owner sees the previous and new outcome and cause, recorded play, each entrant's points before and after, and the standings positions that change. The preview is computed by Standings from the results it applied; if Competition has moved on, the preview says the standings are updating and the confirmation is refused as stale.
- **Blocked cases:** a match that is not resolved is resolved, not corrected; a finalised competition requires reopening first (`h1-finalisation`); in a round-robin league no published pairing depends on results, so no other dependency blocks in H1 (§9.1 step 4 does not arise).
- **Corrections of departure outcomes:** a resolution created by a withdrawal or disqualification may be corrected like any other; the entrant stays departed.
- **Standings:** the corrected result changes points once; the results revision increases once.
- **Admin application:** the Match page of a resolved match gains "Correct result", which opens the cause-first Result form with the current values, a required reason and "Review impact"; the impact panel then offers "Apply correction". The match shows a "Corrected" label and a Result history.
- **Notifiable facts (ADR 0017):** a corrected result. It is persisted with the resolution history; no consumer is added here. `h1-change-log` records corrections of a finalised competition's results as revised final results.
- One end-to-end journey (24): an owner corrects a recorded win to a draw with a reason, reviews the impact, and sees the corrected result with its earlier version.

Out of scope: rollback of played brackets (none in H1), correcting lineups after start, correcting a departure itself, corrections by pilot applications (`h1-pilot-access` grants operations, this change adds one).

## Decision rows

| Row | Status | Used for |
|---|---|---|
| D-07 Corrections | Confirmed for H1 15 Nov 2026 | Any effective resolution, reason, impact preview, expected revision |
| D-24 Finalisation review barrier | Confirmed for H1 15 Nov 2026 | Finalised competitions need reopening; stale previews refused |
| D-25 Terminal outcomes | Confirmed 15 Nov 2026 | Causes allowed after recorded play |

## Open questions for the review

- **Q1** The preview is a query to Standings over the results it applied, with the proposed resolution substituted; confirming is a command to Competition that rejects a stale match revision. Confirm, or have Competition compute points itself.
- **Q2** A correction on a match resolved by a departure leaves the entrant departed and may give its opponent fewer points. Confirm, or block corrections of departure outcomes in H1.

## Screens

Prototypes in `prototypes/frontend/correct-close-open-states.html` (design.md, Visual input):

- **Match page (modified):** resolved match with "Correct result"; correction form with the current values and reason; impact preview; stale preview; conflict; failed save keeping input; corrected result with history; finalised match blocked.

## Capabilities

### New Capabilities

- `result-corrections`: correcting an effective resolution with a reason, its preview and history.

### Modified Capabilities

- `standings`: the correction preview.
- `end-to-end-journeys`: journey 24.

## Impact

- `Herald.Competition`: `Match` keeps its replaced resolutions; feature `CorrectResult`; migration (resolution history).
- `Herald.Standings`: query `PreviewCorrection` over its applied snapshot.
- Admin OpenAPI document and client; Wolverine's generated code; admin `matches` feature.
- `e2e/`: journey 24 and its test script; `tools/Herald.Seed`: a running league with a corrected result. Docs: visual direction §9.3.
