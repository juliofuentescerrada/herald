## Why

H5 promises combined stages, live following, email and an open API ecosystem, but its cut, delivery and reconciliation policies are not detailed enough for bounded implementation proposals. This authorised documentation discovery makes those choices reviewable without approving policy or implementing functionality.

## What Changes

- Add the H5 functional extension with concrete stage/cut rules, live and delivery lifecycles, application authority, complete journeys and observable target acceptance.
- Add proposed D-57–65 to baseline §15; keep functional detail in the extension, delivery sequence in the roadmap and future visual inventory in visual direction.
- Update reading order, source guidance and OpenSpec context following H2/H3. Verify actual prerequisites from current implemented specifications and repository state.

Decision dependencies: D-16 and ADR 0013 confirm milestone scope/sequence, not detailed defaults. D-04 confirms the H1 league profile only. D-08 confirms ownership within its recorded limits. D-09/17/18/27 remain partial, D-07/14/24 proposed, D-38 proposed detail, and D-39–56 retain their recorded H3/H4 proposed gates. D-57–65 are recommendations for maintainer review; this commission approves none of them.

## Capabilities

### New Capabilities

- `h5-discovery-documentation`: maintain the H5 extension, single-source links and documentation-only handoff.

### Modified Capabilities

None. `openspec/specs/` retains implemented behaviour.

## Impact

Documentation only; no code, endpoints, dependencies, event publication or infrastructure changes. No screen is created or modified, so mockups and executable screen scripts are not applicable. Future surfaces/states are inventoried for later visual review, not declared implementation-ready. No runtime notifiable facts are introduced and ADR 0017's inventory stays unchanged. Target notices and public webhook contracts do not imply existing published events or direct subscriptions to internal events. No Wolverine/OpenAPI generation or product tests apply.
