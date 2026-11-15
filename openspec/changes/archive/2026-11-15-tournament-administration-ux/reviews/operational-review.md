# Operational assessment with disposable seed data

Date: 15 November 2026. Follow-up to [browser-review.md](browser-review.md). The maintainer explicitly confirmed that the local records are test data recoverable by running the Aspire seed, and authorised changes. The earlier cancellation-review rejection was not bypassed; the later test followed this new authorisation.

## Executed browser checks

| Scenario | Observed result | UX disposition |
| --- | --- | --- |
| Cancel an admitted individual in a full, open, automatic-admission tournament | Autumn League's dialog names the entrant, explains finality for that entry and identifies the first waiting entrant who will be promoted. Initial focus is Keep entry. Confirmation exposes Cancelling and disables both actions. Cleo Marsh is cancelled; Felix Arden becomes admitted; capacity remains 4 of 4; waiting changes from 2 to 1; cancelled history count becomes 2. Focus moves to the updated summary. | Consequences, safe default focus and effective page state are positive in this sample. Preserve this behaviour. |
| Save a team lineup | In Saltmarsh Team League, selecting five of seven players enables saving for that side. Save disables controls while pending; after completion it removes Discard changes and exposes collapsed lineup history. The missing-lineup blocker then identifies the other team. Repeated for the second side. | Counts, per-side save and blocker progression are understandable. Saving remains explicit; selection alone is not saved. |
| Start the team match | Confirmation names both teams, required player count and locked-lineup consequence. Initial focus is Keep as it is. Confirmation succeeds; match becomes In play; both lineups become read-only Locked, with revision, starters and reserves. Result entry becomes available. | Correct distinction between lineup preparation and play; preserve explicit start. |
| Record a team result | Initially no outcome is selected. Selecting Granite Herons wins enables Record result. Submission disables controls; success replaces selection with Resolved / Granite Herons won / played and recorded time. Back to schedule shows the same effective outcome. | No result-selection default and consistent effective state pass in this sample. No correction flow was introduced or tested. |
| Generate a schedule | Midsummer Classic starts with No draft. Generate draft is disabled until an explicit seeding choice. Admission order generates four players, three rounds and six matches, with pairings and a Draft label. | Prerequisite explanation is clear. After generation the regeneration seeding resets to unselected while the summary retains Admission order; this is visible but not classified as a new defect. |
| Publish schedule | Publish shows Publishing while pending. Completion shows Published revision 1 and a persistent field-lock notice; generation controls disappear. | Explicit publication and lock consequences are positive in this sample. |
| Withdraw without reason | Withdraw dialog describes retained history, returned draft and unlocked field. Initial focus is Keep it published. Submitting an empty reason keeps the dialog open and displays Error: Enter a reason beside the field. | Local validation is visible. Focus stays on Withdraw; field error announcement and focus-on-error remain accessibility verification targets. |
| Withdraw with reason | Entering a test reason and confirming succeeds. Pairings return as Draft; Publish and regeneration controls return; revision 1 remains in expanded Publication history with publication, withdrawal and reason. | Preserved history and actual draft state pass. TA-09's expanded-history concern is now reproduced in the browser. |

## Finding updates

- **TA-06:** the team in-play and resolved variants are now browser-inspected. Both locked lineup panels and their history controls still precede the Result panel. The next task remains visually subordinate to read-only detail; phase-aware grouping is part of the proposal scope. The result operation itself completed correctly.
- **TA-09:** publication history opens expanded after withdrawal, confirmed rather than only source-inspected. Retain its evidence while reducing competition with current draft actions.
- **G-07/G-08:** selected busy, successful mutation, local required-field error and effective-state propagation paths now have runtime evidence. These checks do not establish network failure, revision conflict, repeated-submission or uncertain-response recovery.
- Cancellation confirmation coverage is no longer blocked. Its safe initial focus, consequence text, pending state and completed promotion were actually observed under the maintainer's disposable-data authorisation.

## Local data left changed

| Tournament | Resulting state |
| --- | --- |
| Autumn League | Cleo Marsh's entry cancelled, Felix Arden admitted automatically, Greta Lowe remains waiting. Four admitted, one waiting, two cancelled. |
| Saltmarsh Team League | Both five-player lineups saved at revision 1; Granite Herons versus Saltmarsh Wolves started and resolved as a played Granite Herons win. |
| Midsummer Classic | Admission-order schedule generated, revision 1 published and then withdrawn with a test reason; pairings remain as the draft and the publication is retained in history. |

The seed has **not** been rerun. The browser was left on Midsummer Classic's draft schedule so the resulting state can be inspected. No production source, policy, change approval or deployment was modified. Signed-in screenshots were inspected in the session and are not committed, consistent with the repository's synthetic E2E evidence requirement.

## Remaining limits

Not executed: tournament creation/save/publication and competition start writes; guest/roster membership creation/removal; check-in/absence writes; manual/out-of-order admission; fault injection; revision conflicts; uncertain responses; full modal focus cycles, screen reader, axe and zoom checks. These remain targeted acceptance work for implementation, not claims of a finished regression suite. Existing source findings still apply unless specifically superseded here.

The operational checks reinforce the existing scope: preserve working domain operations and confirmations, improve their navigation, hierarchy, selection feedback, immutable-field cues, responsive composition and recovery. They do not require new competitive capabilities.
