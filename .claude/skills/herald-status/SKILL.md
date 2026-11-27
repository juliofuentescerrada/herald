---
name: herald-status
description: Summarise where Herald's delivery stands: the roadmap's current state, the work done most recently and a recommended next task. Use when the maintainer asks for the status, a summary of the roadmap, what was done last, or what to do next ("where are we", "what's next"). Read-only.
---

# Herald status

A read-only briefing in four parts. It changes no file, label or issue; the maintainer decides what to start.

## Gather

Read each source by section, never whole (`docs/roadmap.md` is long), and run the commands in parallel:

- `node scripts/slice-state.mjs`: the branch, active changes with their approval and next unchecked task, the last checkpoint.
- `git fetch -q origin`, then `git log --oneline -15 origin/main`, `git log --oneline origin/main..HEAD` and `git status -sb` (the local `main` may be stale).
- `docs/roadmap.md`: the "Current state" table (`grep -n '^## ' docs/roadmap.md`, then read up to the next heading) and the batch section of the milestone in progress (its slices and "Depends on" columns).
- GitHub (`gh`, skip if not signed in and say so):
  - Open pull requests with their CI and review: `gh pr list --state open --json number,title,isDraft,headRefName,labels,reviewDecision,mergeable,statusCheckRollup,updatedAt`. For each, name failing or pending checks, and read its unresolved comments by the maintainer (`gh pr view <n> --comments`).
  - The last merged: `gh pr list --state merged --limit 5 --json number,title,mergedAt`.
  - The milestones' issues: `gh issue list --state open --milestone "<milestone>" --json number,title,labels` for the milestone in progress and the next (`gh api repos/{owner}/{repo}/milestones --jq '.[]|"\(.title) \(.open_issues)/\(.open_issues+.closed_issues)"'` lists them), so batches, slices and other issues all appear; `gh issue view <batch> --comments` for the batch's last note.
  - `gh issue list --label needs-decision --state open --json number,title` and `gh issue list --label feedback --state open --json number,title`.
  - CI on `main`: `gh run list --branch main --limit 3 --json workflowName,conclusion,headSha`.
  - The "Herald delivery" board: `gh project item-list <number> --owner @me --format json` (`gh project list --owner @me` gives the number). It needs the `read:project` scope; without it, say that `gh auth refresh -s read:project` enables it and go on.

  Check the tracking against `docs/operations/delivery-tracking.md`: a slice's label matches its pull request (`in-progress` while a draft, `ready-to-test` once ready, `feedback` with open comments), a closed slice's checkboxes in its batch, a card's column matches its label, and a merged slice's issue is closed.

Issues and pull requests hold progress (ADR 0018, `docs/operations/delivery-tracking.md`); the roadmap holds milestones and exit criteria. Where they disagree, report the disagreement instead of picking one.

## Report

In the maintainer's language, short, with links as `path:line` or `#n`:

1. **Roadmap:** the milestone in progress, which of its slices are merged, in progress, ready to test or not started, and what remains of its exit criteria. One line for what follows it.
2. **GitHub:** each open pull request with its CI, review and comments; CI on `main`; and the tracking mismatches found, each with the fix (the agent applies a label fix only when asked).
3. **Last done:** the last merged pull requests and the commits of the current branch not on `main`, grouped by change, with any task still unchecked or a branch not yet pushed.
4. **Next:** one recommendation and why, then at most two alternatives in one line each. Choose by this order:
   1. Finish what is open: an unchecked task of an approved change, a pull request with `feedback`, a CI failure, a merged change not yet archived.
   2. A slice waiting for the maintainer (`ready-to-test`, `needs-decision`): say what they must do; the agent cannot do it.
   3. A new slice, only if fewer than two are in progress (ADR 0018) and every slice in its "Depends on" is merged; without an approved change it starts with `/opsx:propose`.
   4. Otherwise the next milestone's decision session or batch proposal.

   A rule the decision register (`docs/herald-functional-discovery.md` §15) does not settle is a question for the maintainer, not part of the recommendation.

State what could not be checked (no `gh`, a source missing) in one line at the end.
