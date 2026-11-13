# Delivery tracking: milestones, labels and the board

From H1's remaining slices, progress lives in GitHub Issues ([ADR 0018](../adr/0018-deliver-in-batches-tested-on-a-deployed-preview.md)). Issues hold state and feedback, never content: specifications, decisions and ADRs stay in the repository and the issues link to them. `docs/roadmap.md` keeps the milestones' exit criteria.

## Set up once

1. **Labels and milestones:** run `scripts/github-setup` from the repository root with a `gh` signed in to an account that can administer the repository. It creates or updates the labels and milestones below, and can be run again at any time. `scripts/github-setup --dry-run` shows what it would do.
2. **The project board** (a manual step, because it needs the `project` scope on `gh`, or the web):
   - create a Projects board for the repository named "Herald delivery";
   - set its Status field to the columns below, in that order;
   - add the milestones' issues to it.

## Labels

| Label | Meaning | Who sets it |
|---|---|---|
| `batch` | An issue for a batch of three to five slices that share decisions and screens | The batch template |
| `slice` | An issue for one OpenSpec change of a batch, or its pull request | The slice template, the agent on the pull request |
| `batch-proposals` | The pull request with a batch's proposals and prototypes; merging it approves the batch | The agent |
| `needs-decision` | Waits for the maintainer to settle a rule the decision register does not | The batch template, the agent |
| `in-progress` | A slice an agent session is implementing | The agent |
| `ready-to-test` | A slice or a batch waiting for the maintainer's test round | The agent |
| `feedback` | The maintainer's feedback is waiting for the agent | The maintainer |
| `agent:start` | Starts or resumes the slice in an agent session | The maintainer |

Status labels trigger nothing. `agent:start` starts or resumes a slice once the `issues.labeled` scheduled task exists, which is after H1's first batch (ADR 0018); until then it only marks the slice the maintainer asks a session to start. ADR 0018 defines when a slice counts as in progress and how many may be.

## Board columns

Projects does not map labels to its Status field by itself: the agent moves a slice's card when it changes the slice's label, and the board's built-in workflows move closed issues to Done and newly added issues to Ready.

| Column | Issues in it |
|---|---|
| Needs decision | Batches labelled `needs-decision` |
| Ready | Slices whose "Depends on" are merged, not yet started |
| In progress | Slices labelled `in-progress` |
| Ready to test | Slices and batches labelled `ready-to-test` |
| Feedback | Slices labelled `feedback` |
| Done | Closed issues |

## Milestones

`H1 Operator league` (the remaining slices only), `M4 Cloud` and `H2 Participant portal`. Later milestones are added to `scripts/github-setup` when their first batch is near.
